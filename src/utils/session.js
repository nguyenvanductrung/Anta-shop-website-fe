export function getSessionId() {
    let sid = null;
    try {
        sid = localStorage.getItem("sessionId");
    } catch (e) {
        // ignore localStorage errors in some envs
    }
    if (!sid) {
        sid = "sid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 12);
        try { localStorage.setItem("sessionId", sid); } catch (e) { }
    }
    return sid;
}

export function createNewSessionId() {
    const sid = "sid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 12);
    try {
        localStorage.setItem("sessionId", sid);
    } catch (e) {
        console.warn("createNewSessionId: localStorage set failed", e);
    }
    // notify other parts of app (useful for useCart listener)
    try {
        window.dispatchEvent(new CustomEvent("session:changed", { detail: { sessionId: sid } }));
    } catch (e) { /* ignore */ }
    return sid;
}