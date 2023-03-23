//
// Login using username and password issue accessToken and refreshToken
// upon the success.
//

import bcrypt from 'bcryptjs'
import helpers from '../helpers.js'
import TokenService from '../services/token.js'
import UserService from '../services/user.js'

// TODO controller
async function verifyPassword(username, password) {
    // Compared plain text password against hashed password stored in DB
    try {
        const user = await UserService.getUser(username)
        const pwdOk = await bcrypt.compare(password, user.hashedPassword)
        if (pwdOk !== true) {
            throw new Error()
        }
    } catch {
        throw new helpers.BackendError({
            message: `invalid login or password for ${username}`,
            status: 401,
        })
    }
}

async function handler(event) {
    try {
        const { username, password } = helpers.getCredentials(event)
        console.log('username =>', username, 'password =>', password)
        await verifyPassword(username, password)
        const tokens = await TokenService.issue(username)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...tokens }),
        }
    } catch (err) {
        console.error(err)
        return helpers.error(err)
    }
}

export { handler }
