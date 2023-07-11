//
// Rotate RSA keys
//
// Generates new keys and uploads private key PEM file and JWKS json to s3 bucket.
// Keeps the previous JWK keys as jwks.keys[1].
//

import { newRotateKeysController } from '../runtime.js'

const handler = async (event) => {
    try {
        const controller = newRotateKeysController()
        await controller()

        return {
            statusCode: 200,
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 500,
        }
    }
}

export { handler }
