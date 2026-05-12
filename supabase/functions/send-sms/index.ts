// supabase/functions/send-sms/index.ts
// Edge Function: Sends SMS payment reminders to customers via Twilio.
// Triggered by the check_overdue_payments() worker or called directly.
//
// Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   TWILIO_ACCOUNT_SID  — Twilio Account SID
//   TWILIO_AUTH_TOKEN    — Twilio Auth Token
//   TWILIO_PHONE_NUMBER  — Twilio sender phone number (e.g. "+1234567890")

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order + customer details
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`
        id, order_number, total_amount, amount_paid,
        customer:customer_id (id, contact_number, first_name)
      `)
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", details: orderErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customer = order.customer as any;
    if (!customer?.contact_number) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No customer phone number on file" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioAuth || !twilioFrom) {
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const balance = (Number(order.total_amount) || 0) - (Number(order.amount_paid) || 0);
    const name = customer.first_name || "Customer";
    const orderNum = order.order_number || order.id;

    // Format phone number — ensure it starts with country code
    let phone = customer.contact_number.replace(/[^0-9+]/g, "");
    if (phone.startsWith("0")) {
      phone = "+63" + phone.slice(1); // Philippine number
    } else if (!phone.startsWith("+")) {
      phone = "+63" + phone;
    }

    const messageBody = [
      `Hi ${name}! This is a reminder from Operix.`,
      `Your order ${orderNum} has a pending balance of PHP ${balance.toFixed(2)}.`,
      `Please settle your payment at your earliest convenience.`,
      `Thank you!`,
    ].join(" ");

    // Send SMS via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const authHeader = "Basic " + btoa(`${twilioSid}:${twilioAuth}`);

    const formData = new URLSearchParams();
    formData.append("To", phone);
    formData.append("From", twilioFrom);
    formData.append("Body", messageBody);

    const smsRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const smsResult = await smsRes.json();

    return new Response(
      JSON.stringify({
        sent: smsRes.ok,
        to: phone,
        order_number: orderNum,
        balance,
        twilio_sid: smsResult.sid || null,
        twilio_status: smsResult.status || smsResult.message,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
