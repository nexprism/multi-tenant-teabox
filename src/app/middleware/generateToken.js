import jwt from "jsonwebtoken";

export const Token = {
  generateTokens(user) {
    const payload = {
      id: user._id.toString(),
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenant || null,
      role: user.role || null,
    };
    // Do NOT add `exp` claims: tokens will not carry an expiration timestamp
    // (This prevents automatic logout caused by token expiry on the client)
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      process.env.REFRESH_TOKEN_SECRET
    );

    // Keep return shape backwards-compatible: callers expecting these fields
    // will receive `null`. Primary fields are the tokens themselves.
    return {
      accessToken,
      refreshToken,
      accessTokenExp: null,
      refreshTokenExp: null,
    };
  },

  setTokensCookies(
    res,
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp
  ) {
    // Set session cookies without explicit Max-Age/Expires so they do not
    // automatically expire on the client side. This helps prevent logouts
    // due to cookie expiry. If you prefer persistent cookies, change to
    // include `Max-Age` or `Expires` here.
    if (accessToken) {
      res.headers.append(
        "Set-Cookie",
        `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=Strict; Secure`
      );
    }

    if (refreshToken) {
      res.headers.append(
        "Set-Cookie",
        `refreshToken=${refreshToken}; Path=/; HttpOnly; SameSite=Strict; Secure`
      );
    }
  },

  /**
   * Extract account info from access token (acc)
   * Returns user info if valid, otherwise null
   */
  async acc(accessToken) {
    try {
      if (!accessToken) return null;
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      // You may want to fetch user from DB here if needed
      return decoded;
    } catch (err) {
      //consolle.error("Token verification failed:", err.message);
      return null;
    }
  },

  /**
   * Verify refresh token and return user ID if valid
   */
  async verifyRefreshToken(refreshToken) {
    try {
      if (!refreshToken) return null;
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      return decoded;
    } catch (err) {
      //consolle.error("Refresh token verification failed:", err.message);
      return null;
    }
  },

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  isTokenExpiringSoon(token) {
    try {
      const decoded = jwt.decode(token);
      // If token or exp is missing, treat it as NOT expiring soon so
      // callers don't attempt unnecessary refreshes.
      if (!decoded || !decoded.exp) return false;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;

      // Return true if token expires within 5 minutes (300 seconds)
      return timeUntilExpiry < 300;
    } catch (err) {
      return false;
    }
  },
};
