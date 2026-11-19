const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'love-and-co-ultra-secure-apothecary-jwt-secret-2026';
const ADMIN_EMAILS = ['loveandcoadmin@gmail.com'];
const ADMIN_EMAIL = 'loveandcoadmin@gmail.com';
const isAdminEmail = (email) => (email || '').toLowerCase().trim() === 'loveandcoadmin@gmail.com';

async function resolveUserFromDecoded(decoded) {
  if (!decoded) return null;
  try {
    const User = mongoose.model('User');
    let user = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id);
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase().trim() });
    }
    if (user) {
      // Enforce DB role and ensure only authorized admin emails can be admin
      const email = (user.email || '').toLowerCase().trim();
      const actualRole = (isAdminEmail(email) && user.role === 'admin') ? 'admin' : 'customer';

      return {
        ...decoded,
        id: user._id.toString(),
        _id: user._id,
        email: user.email,
        role: actualRole,
        fullName: user.fullName,
      };
    }
  } catch (_) {}
  return decoded;
}

// protect: Verify valid JWT/session token, attach req.user from DB, reject unauthenticated with 401
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const resolvedUser = await resolveUserFromDecoded(decoded);
    if (!resolvedUser) {
      return res.status(401).json({ error: 'User account not found' });
    }
    req.user = resolvedUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

// optionalAuth: Attach req.user if a valid token is provided, without blocking unauthenticated calls
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await resolveUserFromDecoded(decoded);
    } catch (_) {
      // Ignore token failure for guest routes
    }
  }
  next();
}

// adminOnly: Allow access ONLY if req.user.role === 'admin' && req.user.email.toLowerCase() === 'loveandcosupport@gmail.com'; otherwise 403 Forbidden
async function adminOnly(req, res, next) {
  if (!req.user) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await resolveUserFromDecoded(decoded);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const email = (req.user.email || '').toLowerCase().trim();
  const role = req.user.role;

  if (role === 'admin' && isAdminEmail(email)) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
}

function requireSubRole(allowedRoles = []) {
  return (req, res, next) => {
    return adminOnly(req, res, next);
  };
}

module.exports = {
  protect,
  adminOnly,
  verifyAuth: protect,
  requireAdmin: adminOnly,
  adminOrDev: adminOnly,
  optionalAuth,
  requireSubRole,
  ADMIN_EMAIL,
  ADMIN_ROLES: ['admin'],
};
