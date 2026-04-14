// backend/src/server.js
// Express does ONLY what Supabase SDK can't do from the browser:
//   1. auth.admin.createUser()  — create accounts for other people
//   2. auth.admin.updateUserById() — change other people's email/password/role
//   3. auth.admin.deleteUser() — delete auth accounts
//
// ALL CRUD and deactivate/reactivate operations are handled directly
// from the frontend via Supabase JS SDK + RLS. Express is NOT involved.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json());

// ── Supabase admin client (service_role — bypasses RLS) ──────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Verify caller is admin ───────────────────────────────────────────────────
async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Check role from public.users
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  req.adminUser = user;
  next();
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'OK', purpose: 'Admin auth operations only' }));

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/admin/users — Create a new user account
// ═════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, username, contact_number } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Create in Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: (role || 'customer').toLowerCase(),
        first_name: first_name || '',
        last_name: last_name || '',
        contact_number: contact_number || '',
      },
    });

    if (authErr) {
      const status = authErr.message.includes('already') ? 409 : 400;
      return res.status(status).json({ error: authErr.message });
    }

    // Trigger auto-creates public.users row. Update extra fields:
    if (authData.user) {
      await supabase.from('users').update({
        username: username || null,
        role: (role || 'customer').toLowerCase(),
        contact_number: contact_number || null,
      }).eq('id', authData.user.id);
    }

    // Fetch the complete profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();

    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/admin/users/:id — Update another user's auth info
// ═════════════════════════════════════════════════════════════════════════════
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, first_name, last_name, contact_number, address, is_active } = req.body;

    // Sync to Supabase Auth (email, password, metadata)
    const authPayload = {};
    const metadata = {};
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

    // Sync to public.users table
    const dbPayload = {};
    if (first_name !== undefined) dbPayload.first_name = first_name;
    if (last_name !== undefined) dbPayload.last_name = last_name;
    if (email) dbPayload.email = email;
    if (role) dbPayload.role = role.toLowerCase();
    if (contact_number !== undefined) dbPayload.contact_number = contact_number;
    if (address !== undefined) dbPayload.address = address;
    if (is_active !== undefined) dbPayload.is_active = is_active;

    if (Object.keys(dbPayload).length) {
      await supabase.from('users').update(dbPayload).eq('id', id);
    }

    const { data: profile } = await supabase.from('users').select('*').eq('id', id).single();
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/users/:id — Delete auth account entirely
// ═════════════════════════════════════════════════════════════════════════════
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    // The trigger or cascade should handle the public.users row
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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