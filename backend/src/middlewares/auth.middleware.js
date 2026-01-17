// Authentication bypass middleware
// This intentionally bypasses token checks and injects a default user.
// Use only when authentication is removed; revert for production.
const authMiddleware = async (req, res, next) => {
  req.user = {
    id: 1,
    username: "admin",
    email: "admin@fishmarket.com",
    full_name: "Admin User",
    role: "admin",
    is_active: 1,
  };
  next();
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // Allow all when authentication is disabled
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
