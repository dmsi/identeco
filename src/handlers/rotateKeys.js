//
// Rotate RSA keys
//
// Generates new keys and uploads private key PEM file and JWKS json to s3 bucket.
// Keeps the previous JWK keys as jwks.keys[1].
//

import helpers from '../helpers.js'
import KeyService from '../services/keys.js'

const handler = async (event) => {
    try {
        console.log('updated version')
        console.log('Rotating Keys...')
        await KeyService.rotate()

        // Return OK
        return {
            statusCode: 200,
        }
    } catch (err) {
        // Error
        console.error(err)
        return {
            statusCode: helpers.getStatusCode(err),
        }
    }
}

export { handler }
