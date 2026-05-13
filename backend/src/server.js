// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || '*',
  credentials: true
}));

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  req.adminUser = user;
  next();
}

app.get('/health', (_, res) =>
  res.json({ status: 'OK', purpose: 'Admin auth + payroll file upload' })
);

// USER MANAGEMENT
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, contact_number } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: (role || 'customer').toLowerCase(), first_name: first_name || '', last_name: last_name || '', contact_number: contact_number || '' },
    });
    if (authErr) return res.status(authErr.message.includes('already') ? 409 : 400).json({ error: authErr.message });
    if (authData.user) {
      await supabase.from('users').update({ role: (role || 'customer').toLowerCase(), contact_number: contact_number || null }).eq('id', authData.user.id);
    }
    const { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    res.status(201).json({ success: true, data: profile });
  } catch (err) { console.error('Create user error:', err); res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, first_name, last_name, username, contact_number, address, is_active } = req.body;
    const authPayload = {}; const metadata = {};
    if (email) authPayload.email = email;
    if (password) authPayload.password = password;
    if (role) metadata.role = role.toLowerCase();
    if (first_name !== undefined) metadata.first_name = first_name;
    if (last_name !== undefined) metadata.last_name = last_name;
    if (Object.keys(metadata).length) authPayload.user_metadata = metadata;
    if (Object.keys(authPayload).length) {
      const { error } = await supabase.auth.admin.updateUserById(id, authPayload);
      if (error) return res.status(400).json({ error: error.message });
    }
    const dbPayload = {};
    if (first_name !== undefined) dbPayload.first_name = first_name;
    if (last_name !== undefined) dbPayload.last_name = last_name;
    if (username !== undefined) dbPayload.username = username;
    if (email) dbPayload.email = email;
    if (role) dbPayload.role = role.toLowerCase();
    if (contact_number !== undefined) dbPayload.contact_number = contact_number;
    if (address !== undefined) dbPayload.address = address;
    if (is_active !== undefined) dbPayload.is_active = is_active;

    if (Object.keys(dbPayload).length) await supabase.from('users').update(dbPayload).eq('id', id);
    const { data: profile } = await supabase.from('users').select('*').eq('id', id).single();
    res.json({ success: true, data: profile });
  } catch (err) { console.error('Update user error:', err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════════════════════════════════════════════════════════════════
// Start
// ═════════════════════════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  OPERIX ADMIN API | Port ${PORT} | 3 routes: create / update / delete user\n`);
  });
}

module.exports = app;

// ── Unpaid Order Reminders ───────────────────────────────────────────────────

async function checkUnpaidOrders() {
  console.log('[Reminder Job] Checking for unpaid orders...');
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Get unpaid orders older than 3 days that haven't been notified
    // We select customer contact info for registered users and guest info for walk-ins
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customer:customer_id(contact_number)')
      .eq('payment_status', 'unpaid')
      .eq('unpaid_notification_sent', false)
      .lt('created_at', threeDaysAgo);

    if (error) throw error;
    if (!orders || orders.length === 0) {
      console.log('[Reminder Job] No pending notifications found.');
      return;
    }

    console.log(`[Reminder Job] Found ${orders.length} orders to notify.`);

    // 2. Get all admin users for internal notification
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');

    for (const order of orders) {
      const phone = order.customer?.contact_number || order.guest_phone;
      const orderNum = order.order_number;

      // A. Send SMS to Customer
      if (phone) {
        await sendSMS(phone, `Reminder: Your order ${orderNum} at Operix is still unpaid. Please settle your payment to proceed with your order.`);
      }

      // B. Notify Admins via internal notification system
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          title: 'Unpaid Order Warning',
          message: `Order ${orderNum} (${order.guest_name || 'Registered User'}) has been unpaid for over 3 days.`,
          related_module: 'orders',
          related_id: order.id
        }));
        await supabase.from('notifications').insert(notifications);
      }

      // C. Mark as notified so we don't spam them
      await supabase.from('orders').update({ unpaid_notification_sent: true }).eq('id', order.id);

      console.log(`[Reminder Job] Processed notifications for Order: ${orderNum}`);
    }
  } catch (err) {
    console.error('[Reminder Job] Error:', err.message);
  }
}

/**
 * Placeholder for SMS Integration
 * Replace this logic with your actual SMS provider (e.g. Twilio, Semaphore, etc.)
 */
async function sendSMS(phone, message) {
  console.log(`[SMS SIMULATOR] To: ${phone} | Content: ${message}`);
}

// Run check on server startup and then every 4 hours
setTimeout(checkUnpaidOrders, 5000); // Wait 5s for DB to be ready
setInterval(checkUnpaidOrders, 4 * 60 * 60 * 1000);
