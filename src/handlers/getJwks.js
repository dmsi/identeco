//
// Return public keys as jwks.json
//

import KeyService from '../services/keys.js'
import helpers from '../helpers.js'

async function handler(event) {
    try {
        console.log('getting jwks')
        const jwks = await KeyService.getJwks()
        console.log('jwks =>', jwks)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jwks),
        }
    } catch (err) {
        console.error(err)
        return helpers.error(err)
    }
}

export { handler }
