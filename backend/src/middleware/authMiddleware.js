// backend/src/middleware/authMiddleware.js
// REFACTORED: Kept verifyToken + requireRole (still needed for /api/* protection)
// ADDED: createAuthenticatedClient — creates a per-request Supabase client that
//        respects RLS using the user's JWT. Use this when you want RLS enforcement
//        instead of the service_role bypass.

const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config/supabase');
const { errorResponse } = require('../utils/responseHelper');

/**
 * verifyToken — validates the Supabase JWT on every /api request.
 * Attaches req.user = { id, email, role } for use in controllers.
 *
 * HOW IT WORKS:
 * 1. Reads the Authorization: Bearer <token> header
 * 2. Calls supabase.auth.getUser(token) to validate with Supabase
 * 3. Extracts role from user_metadata
 * 4. Attaches user info to req.user for downstream middleware/controllers
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return errorResponse(res, 'Invalid or expired session. Please log in again.', 401);
    }

    // Attach user info for downstream use
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'customer',
    };

    // Store the raw token so createAuthenticatedClient can use it if needed
    req.accessToken = token;

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

/**
 * requireRole — use AFTER verifyToken to restrict by role.
 *
 * USAGE:
 *   router.get('/users', requireRole('admin'), controller.getAllUsers)
 *   router.get('/inventory', requireRole('admin', 'cashier', 'production'), controller.getAll)
 *
 * Pass one or more role strings. If the user's role is not in the list, returns 403.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required.', 401);
  }

  if (!roles.includes(req.user.role)) {
    return errorResponse(
      res,
      `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      403
    );
  }

  next();
};

/**
 * createAuthenticatedClient — creates a Supabase client using the user's JWT.
 *
 * Unlike the service_role client in config/supabase.js which BYPASSES RLS,
 * this client RESPECTS RLS policies. Use it when you want the database to
 * enforce per-user access rules.
 *
 * USAGE in a controller:
 *   const userClient = createAuthenticatedClient(req.accessToken);
 *   const { data } = await userClient.from('users').select('*');
 *   // ^ This will only return rows the user's RLS policies allow
 *
 * WHEN TO USE:
 *   - Customer-facing reads (profile, orders, etc.)
 *   - Any operation where the user should only see their own data
 *
 * WHEN NOT TO USE:
 *   - Admin operations that need full access (use service_role client)
 *   - Multi-table transactions that cross RLS boundaries
 */
const createAuthenticatedClient = (accessToken) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY, // Uses the anon key, not service_role
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

module.exports = { verifyToken, requireRole, createAuthenticatedClient };