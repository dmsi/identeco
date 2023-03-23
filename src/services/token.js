//
// Token service
//

import jwkToPem from 'jwk-to-pem'
import jwt from 'jsonwebtoken'
import helpers from '../helpers.js'
import KeyService from './keys.js'

// NOTE name convention for token_use:
// snake_case to make it somewhat compatible with AWS Cognito
// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
function getAccessClaims(username) {
    return {
        username,
        token_use: 'access',
        iss: process.env.ISS_CLAIM,
    }
}

function getRefreshClaims(username) {
    return {
        username,
        token_use: 'refresh',
        iss: process.env.ISS_CLAIM,
    }
}

function getOptions(kid) {
    return {
        algorithm: 'RS256',
        expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
        keyid: kid,
    }
}

function issueTokens(username, privateKey, jwks) {
    const kid = jwks.keys[0].kid
    const refreshTokenOptions = {
        ...getOptions(kid),
        expiresIn: process.env.PRIVATE_KEY_LIFETIME, // sync refresh lifetime with key rotation
    }

    const accessToken = jwt.sign(
        getAccessClaims(username),
        privateKey,
        getOptions(kid)
    )

    const refreshToken = jwt.sign(
        getRefreshClaims(username),
        privateKey,
        refreshTokenOptions
    )

    return {
        accessToken,
        refreshToken,
    }
}

function verifyToken(jwks, token, use) {
    // Look up for the jwk
    const { kid, alg } = jwt.decode(token, { complete: true }).header
    const jwk = jwks.keys.find((j) => j.kid === kid)

    // Decode token and verify its signature
    const decodedToken = jwt.verify(token, jwkToPem(jwk), {
        algorithms: [alg],
    })

    // Verify use claim
    if (decodedToken.token_use !== use) {
        throw new helpers.BackendError({
            message: `unexpected token_use claim ${decodedToken.token_use}`,
            status: 403,
        })
    }

    // Verify iss claim
    if (decodedToken.iss !== process.env.ISS_CLAIM) {
        throw new helpers.BackendError({
            message: `unexpected iss claim ${decodedToken.token_iss}`,
            status: 403,
        })
    }

    return decodedToken
}

async function issue(username) {
    // Get public key id and the private key
    const privateKey = await KeyService.getPrivateKey()
    const jwks = await KeyService.getJwks()

    return issueTokens(username, privateKey, jwks)
}

async function refresh(refreshToken) {
    // Get public key id and the private key
    const privateKey = await KeyService.getPrivateKey()
    const jwks = await KeyService.getJwks()

    const decodedToken = verifyToken(jwks, refreshToken, 'refresh')
    return issueTokens(decodedToken.username, privateKey, jwks)
}

export default { issue, refresh }
