//
// Return public keys as jwks.json
//

import { newJwkSetsController } from '../runtime.js'

async function handler(event) {
    try {
        const controller = newJwkSetsController()
        const body = await controller()

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
            statusCode: 404,
        }
    }
}

export { handler }
