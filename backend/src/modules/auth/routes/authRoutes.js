// backend/src/modules/auth/routes/authRoutes.js
// Public routes — no JWT token required
 
const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { successResponse, errorResponse } = require('../../../utils/responseHelper');
 
// POST /auth/login
// Body: { email, password }
// Works for BOTH customers and employees
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return errorResponse(res, 'Email and password are required.', 400);
 
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
 
  if (error) {
    if (error.message.includes('Invalid login credentials'))
      return errorResponse(res, 'Incorrect email or password.', 401);
    if (error.message.includes('Email not confirmed'))
      return errorResponse(res, 'Please confirm your email before logging in.', 401);
    return errorResponse(res, error.message, 401);
  }
 
  return successResponse(res, {
    session: data.session,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'customer',
      firstName: data.user.user_metadata?.first_name || null,
      lastName: data.user.user_metadata?.last_name || null,
    }
  }, 'Login successful');
});
 
// POST /auth/register
// Body: { email, password, firstName, lastName, contactNumber }
// For CUSTOMERS only. Employees are created by Admin.
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, contactNumber } = req.body;
  if (!email || !password)
    return errorResponse(res, 'Email and password are required.', 400);
 
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        role: 'customer',
        first_name: firstName || '',
        last_name: lastName || '',
        contact_number: contactNumber || '',
      }
    }
  });
 
  if (error) {
    if (error.message.includes('already registered'))
      return errorResponse(res, 'An account with this email already exists.', 409);
    return errorResponse(res, error.message, 400);
  }
 
  // Insert profile row if user is confirmed immediately (email confirm OFF)
  if (data.user && data.user.identities?.length > 0) {
    await supabase.from('users').insert([{
      id: data.user.id,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email.trim().toLowerCase(),
      contact_number: contactNumber || null,
      role: 'customer',
      is_active: true,
    }]);
  }
 
  return successResponse(res, {
    user: data.user,
    needsEmailConfirm: !data.session,
  }, 'Account created successfully');
});
 
// POST /auth/logout
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    await supabase.auth.admin.signOut(authHeader.split(' ')[1]);
  }
  return successResponse(res, null, 'Logged out successfully');
});
 
// POST /auth/forgot-password
// Body: { email }
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return errorResponse(res, 'Email is required.', 400);
 
  await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password` }
  );
 
  // Always return success — never reveal if email exists
  return successResponse(res, null,
    'If an account exists with that email, a password reset link has been sent.');
});
 
module.exports = router;

