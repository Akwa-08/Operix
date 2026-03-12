// backend/src/middleware/authMiddleware.js
 
const { supabase } = require('../config/supabase');
const { errorResponse } = require('../utils/responseHelper');
 
/**
 * verifyToken — validates the Supabase JWT on every /api request.
 * Attaches req.user = { id, email, role } for use in controllers.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required. Please log in.', 401);
  }
 
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
 
  if (error || !user) {
    return errorResponse(res, 'Invalid or expired session. Please log in again.', 401);
  }
 
  req.user = {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'customer',
  };
 
  next();
};
 
/**
 * requireRole — use AFTER verifyToken to restrict by role.
 * Example: router.delete('/users/:id', verifyToken, requireRole('admin'), ctrl)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Authentication required.', 401);
 
  if (!roles.includes(req.user.role)) {
    return errorResponse(
      res,
      `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      403
    );
  }
  next();
};
 
module.exports = { verifyToken, requireRole };

