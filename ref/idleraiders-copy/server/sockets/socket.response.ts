/**
 * Socket Response Helpers
 * Standardized response format for all socket events
 */

function sendResponse(socket, eventName, data = {}) {
  const payload = {
    success: true,
    message: data.message || 'Success',
    ...data,
  }
  socket.emit(eventName, payload)
  socket.emit('action_response', { event: eventName, ...payload })
}

function sendError(socket, eventName, message = 'An error occurred') {
  const payload = { success: false, message }
  socket.emit(eventName, payload)
  socket.emit('action_response', { event: eventName, ...payload })
}

function emitUserStateDelta(socket, delta = {}) {
  if (!delta || typeof delta !== 'object' || Array.isArray(delta)) {
    console.warn('[SocketResponse] Skipping updated_user_state emit: invalid delta payload')
    return
  }

  if ('playerState' in delta) {
    console.warn('[SocketResponse] Skipping updated_user_state emit: delta must not contain playerState')
    return
  }

  socket.emit('updated_user_state', { delta })
}

export { sendResponse, sendError, emitUserStateDelta }