//
// Login using username and password issue accessToken and refreshToken
// upon the success.
//

import helpers from './lib/helpers.js'
import { newLoginController } from '../runtime.js'

async function handler(event) {
    try {
        const { username, password } = helpers.getCredentials(event)
        const controller = newLoginController()
        const body = await controller(username, password)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 401,
        }
    }
}

export { handler }
