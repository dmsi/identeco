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

function getCredentials(event) {
    const body = JSON.parse(event.body)
    if (
        typeof body.username !== 'string' ||
        typeof body.password !== 'string'
    ) {
        throw new helpers.BackendError({
            message: 'missing username or password',
            status: 400,
        })
    }

    return {
        username: body.username,
        password: body.password,
    }
}

function getRefreshToken(event) {
    const auth = event.headers['Authorization']
    if (!auth) {
        throw new helpers.BackendError({
            message: 'missing authorization token',
            status: 403,
        })
    }
    return auth.split(' ')[1]
}

function error(err) {
    return {
        statusCode: getStatusCode(err),
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: err.message }),
    }
}

// TODO make it non-default
export default {
    getStatusCode,
    BackendError,
    getCredentials,
    getRefreshToken,
    error,
}
