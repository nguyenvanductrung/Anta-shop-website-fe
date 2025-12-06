export function getSessionId() {
    let sid = localStorage.getItem("sessionId");
    if (!sid) {
        sid = "sid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 12);
        localStorage.setItem("sessionId", sid);
    }
    return sid;
}