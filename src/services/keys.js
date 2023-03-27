//
// Keys service
//

import crypto from 'crypto'
import { pem2jwk } from 'pem-jwk'
import { readS3Object, writeS3Object } from '../s3-helpers.js'
import helpers from '../helpers.js'

// Generate RSA keypair in PEM format and convert public part to JWKS format
function generateKeys() {
    // Generate RSA keypair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: parseInt(process.env.PRIVATE_KEY_LENGTH),
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    })

    // Make jwks from the public key pem
    const jwk = {
        ...pem2jwk(publicKey),
        kid: crypto.createHash('md5').update(`${Math.random()}`).digest('hex'),
        alg: 'RS256',
        use: 'sig',
    }
    const jwks = {
        keys: [jwk],
    }

    // Return public and private keys
    return {
        privateKeyPem: privateKey,
        jwks,
    }
}

// Reads current public key in JWKS format from S3
async function getJwks() {
    try {
        return JSON.parse(
            await readS3Object(
                process.env.BUCKET_NAME,
                process.env.JWKS_JSON_NAME
            )
        )
    } catch {
        throw new helpers.BackendError({
            message: 'JWKS not found',
            status: 500,
        })
    }
}

async function getPrivateKey() {
    try {
        return await readS3Object(
            process.env.BUCKET_NAME,
            process.env.PRIVATE_KEY_NAME
        )
    } catch {
        throw new helpers.BackendError({
            message: 'Private key not found',
            status: 500,
        })
    }
}

// Key rotation
async function rotate() {
    //
    // The result jwks will have up to two keys, where
    //  - jwks.keys[0] => current public key
    //  - jwks.keys[1] => previous public key
    //

    // Generate new keys
    const { privateKeyPem, jwks } = generateKeys()

    // Retreive current key and append to jwks as the previous key
    try {
        const current = await getJwks()
        jwks.keys.push(current.keys[0])
    } catch {}

    // Upload rotated keys
    await Promise.all([
        writeS3Object(
            process.env.BUCKET_NAME,
            process.env.PRIVATE_KEY_NAME,
            privateKeyPem
        ),
        writeS3Object(
            process.env.BUCKET_NAME,
            process.env.JWKS_JSON_NAME,
            JSON.stringify(jwks)
        ),
    ])
}

export default { rotate, getJwks, getPrivateKey }
