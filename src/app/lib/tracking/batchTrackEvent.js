let eventQueue = [];
let timer = null;

export function batchTrackEvent(type, data = {}) {
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    // Ignore parse errors
  }
  eventQueue.push({ type, ...(user ? { user } : {}), ...data });
  if (!timer) {
    timer = setTimeout(() => {
      const events = eventQueue.slice();
      eventQueue = [];
      timer = null;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: events }) // send as batch
      });
    }, 2000);
  }
}
