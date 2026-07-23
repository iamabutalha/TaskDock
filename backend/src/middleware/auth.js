const { verifyToken } = require("../utils/jwt.js");
const ApiError = require("../utils/ApiError.js");

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new ApiError(401, "Unauthorized");

    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (error) {
    if (error.isApiError) return next(error);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};

module.exports = { requireAuth };
