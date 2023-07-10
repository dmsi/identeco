//
// Refresh accessToken using refreshToken
//

import helpers from '../helpers.js'
import { newRefreshController } from '../runtime.js'

async function handler(event) {
    try {
        const refreshToken = helpers.getRefreshToken(event)
        const controller = newRefreshController()
        const body = await controller(refreshToken)

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
