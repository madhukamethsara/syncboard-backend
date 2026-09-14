// Cross-site HTTPS deployments require SameSite=None AND Secure.
// Local HTTP uses Lax so the browser accepts and returns the cookie.
const getAuthCookieOptions = () => {
  const secure = process.env.NODE_ENV === "production" ||
    /^https:\/\//i.test(process.env.BASE_URL || "");

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
};

module.exports = getAuthCookieOptions;
