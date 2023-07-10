//
// Keys service
//

import crypto from 'crypto'
import { pem2jwk } from 'pem-jwk'

export function newKeyService(keyLength) {
    function getKid(publicKey) {
        return crypto.createHash('sha256').update(publicKey).digest('hex')
    }

    function generateKeys() {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: keyLength,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        })

        const jwk = {
            ...pem2jwk(publicKey),
            kid: getKid(publicKey),
            alg: 'RS256',
            use: 'sig',
        }
        const jwks = {
            keys: [jwk],
        }

        return {
            privateKeyPem: privateKey,
            jwks,
        }
    }

    return {
        generateKeys,
    }
}

export default { newKeyService }
