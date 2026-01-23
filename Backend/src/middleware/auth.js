const User = require("../models/User");
const Session = require("../models/Session");
const { verifyAccessToken } = require("../utils/token");

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    
    if (!header) {
      return res.status(401).json({ 
        message: "Authorization header missing",
        code: "AUTH_HEADER_MISSING"
      });
    }

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "Invalid authorization header format",
        code: "AUTH_HEADER_INVALID"
      });
    }

    const token = header.slice(7); // Remove "Bearer " prefix
    
    if (!token || token.length === 0) {
      return res.status(401).json({ 
        message: "No token provided",
        code: "AUTH_TOKEN_MISSING"
      });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({ 
          message: "Token expired",
          code: "AUTH_TOKEN_EXPIRED",
          shouldRefresh: true,
        });
      }
      if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({ 
          message: "Invalid token",
          code: "AUTH_TOKEN_INVALID"
        });
      }
      throw tokenError;
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({ 
        message: "Invalid token payload",
        code: "AUTH_PAYLOAD_INVALID"
      });
    }

    const user = await User.findById(payload.sub).select("+roles +organization +status");
    
    if (!user) {
      return res.status(401).json({ 
        message: "User not found",
        code: "AUTH_USER_NOT_FOUND"
      });
    }

    if (user.status === "inactive" || user.status === "suspended") {
      return res.status(403).json({ 
        message: `User account is ${user.status}`,
        code: "AUTH_USER_INACTIVE"
      });
    }

    if (!user.roles || user.roles.length === 0) {
      return res.status(403).json({ 
        message: "User has no roles assigned",
        code: "AUTH_NO_ROLES"
      });
    }

    // Verify session if sessionId is provided in token
    if (payload.sessionId) {
      const session = await Session.findOne({ 
        _id: payload.sessionId, 
        user: user.id,
        revokedAt: null,
        expiresAt: { $gte: new Date() }
      });

      if (!session) {
        return res.status(401).json({ 
          message: "Session invalid or expired",
          code: "AUTH_SESSION_INVALID",
          shouldRefresh: true,
        });
      }

      req.session = session;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      roles: user.roles,
      organization: user.organization,
      data: user,
    };

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ 
      message: "Authentication error",
      code: "AUTH_ERROR"
    });
  }
};

module.exports = authMiddleware;
