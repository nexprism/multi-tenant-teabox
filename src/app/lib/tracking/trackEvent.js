import { batchTrackEvent } from "./batchTrackEvent";

export function getGuestId() {
  let guestId = localStorage.getItem("guestId");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("guestId", guestId);
  }
  return guestId;
}

export function trackEvent(type, data = {}) {
  const guestId = getGuestId();
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    // Ignore parse errors
  }
  batchTrackEvent(type, { guestId, ...(user ? { user } : {}), ...data });
}
