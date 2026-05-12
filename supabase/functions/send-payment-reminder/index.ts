// supabase/functions/send-payment-reminder/index.ts
// Edge Function: Sends payment reminder emails to customers for overdue orders.
// Triggered by the check_overdue_payments() worker or called directly.
//
// Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY — API key from https://resend.com
//   SENDER_EMAIL   — e.g. "Operix <noreply@operix.app>"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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
        id, order_number, total_amount, amount_paid, payment_status,
        customer:customer_id (id, email, first_name, last_name)
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
    if (!customer?.email) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No customer email on file" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const balance = (Number(order.total_amount) || 0) - (Number(order.amount_paid) || 0);
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "Operix <noreply@operix.app>";
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: customer.email,
        subject: `Payment Reminder — Order ${order.order_number || order.id}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0;">Payment Reminder</h2>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Hi ${customer.first_name || "Valued Customer"},
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              This is a friendly reminder that your order
              <strong style="color: #0891b2;">${order.order_number || ""}</strong>
              has a pending balance of
              <strong style="color: #e80088;">₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>.
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Please settle your payment at your earliest convenience to avoid delays.
            </p>
            <div style="margin: 28px 0; padding: 16px; background: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0;">
              <table style="width: 100%; font-size: 14px; color: #475569;">
                <tr><td style="padding: 4px 0;">Order Number</td><td style="text-align: right; font-weight: 600; color: #0f172a;">${order.order_number || "—"}</td></tr>
                <tr><td style="padding: 4px 0;">Total Amount</td><td style="text-align: right; font-weight: 600; color: #0f172a;">₱${Number(order.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>
                <tr><td style="padding: 4px 0;">Amount Paid</td><td style="text-align: right; font-weight: 600; color: #16a34a;">₱${Number(order.amount_paid || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>
                <tr><td style="padding: 4px 0; border-top: 1px solid #cbd5e1;">Balance Due</td><td style="text-align: right; font-weight: 700; color: #e80088; border-top: 1px solid #cbd5e1;">₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px;">
              If you have already made your payment, please disregard this message.
              For questions, reply to this email or contact our team.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; text-align: center;">
              — Operix Team
            </p>
          </div>
        `,
      }),
    });

    const emailResult = await emailRes.json();

    return new Response(
      JSON.stringify({
        sent: emailRes.ok,
        to: customer.email,
        order_number: order.order_number,
        balance,
        email_response: emailResult,
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
