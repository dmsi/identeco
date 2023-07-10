//
// Keys service
//

import crypto from 'crypto'
import { pem2jwk } from 'pem-jwk'

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
        // TODO use date instead of random() or compute has based on publicKey
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

/*
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
    // await keysStorage.writeJwkSets(JSON.stringify(jwks))
    // await keysStorage.writePrivateKey(privateKeyPem)
    await Promise.all([
        keysStorage.writeJwkSets(JSON.stringify(jwks)),
        keysStorage.writePrivateKey(privateKeyPem),
    ])
}
*/

export default { generateKeys }
