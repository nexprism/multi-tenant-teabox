export const getTenantFromURL = () => {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }
  const hostname = window.location.hostname;

  // Removed hardcoded bharat domain check
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length > 2) {
    if (parts[0] === "www") return parts[1];
    return parts[0];
  }

  if (parts.length === 2 && parts[0] !== "localhost" && parts[0] !== "www") {
    return parts[0];
  }

  return null; // Fallback to null when no subdomain is present
};
