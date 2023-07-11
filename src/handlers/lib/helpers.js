//
// Various helpers
//

function getCredentials(event) {
    const body = JSON.parse(event.body)
    if (
        typeof body.username !== 'string' ||
        body.username === '' ||
        typeof body.password !== 'string' ||
        body.password === ''
    ) {
        throw new Error('missing username or password')
    }

    return {
        username: body.username,
        password: body.password,
    }
}

function getRefreshToken(event) {
    const auth = event.headers['Authorization']
    if (!auth) {
        throw new Error('missing authorization token')
    }
    return auth.split(' ')[1]
}

export default {
    getCredentials,
    getRefreshToken,
}
