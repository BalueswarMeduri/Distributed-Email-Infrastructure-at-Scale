import jwt from "jsonwebtoken";

export const verifyAuth = (req, res, next) => {
  // Public routes that bypass auth verification
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/health",
    "/metrics"
  ];

  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  let token = null;

  // 1. Check Authorization header (Bearer <token>)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Check cookies if token not found in header
  if (!token && req.cookies) {
    token = req.cookies.accesstoken || req.cookies.refreshtoken;
  }

  if (!token) {
    return res.status(401).json({
      message: "Access Denied: No authentication token provided."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "balumeduri6_db_user");
    req.user = decoded;

    // Inject user identity headers for downstream microservices
    if (decoded.id) {
      req.headers["x-user-id"] = decoded.id;
    }
    if (decoded.email) {
      req.headers["x-user-email"] = decoded.email;
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
      error: error.message
    });
  }
};
