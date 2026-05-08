export function debugLog({ runId = 'blank-screen-initial', hypothesisId, location, message, data = {} }) {
  fetch('http://127.0.0.1:7396/ingest/314182a0-e227-4f61-97c6-76f667d20d5f', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '120ad0',
    },
    body: JSON.stringify({
      sessionId: '120ad0',
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
