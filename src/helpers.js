//
// Various helpers
//

class BackendError extends Error {
  constructor(e) {
    super(e.message)
    this.status = e.status
  }
}

function getStatusCode(err) {
  return err.status || 500
}

// TODO make it non-default
export default {
  getStatusCode,
  BackendError,
}
