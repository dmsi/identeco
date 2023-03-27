//
// Refresh accessToken using refreshToken
//

import TokenService from '../services/token.js'
import helpers from '../helpers.js'

async function handler(event) {
    try {
        const refreshToken = helpers.getRefreshToken(event)
        const tokens = await TokenService.refresh(refreshToken)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tokens),
        }
    } catch (err) {
        console.error(err)
        return helpers.error(err)
    }
}

export { handler }
