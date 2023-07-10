//
// Token service
//

import jwkToPem from 'jwk-to-pem'
import jwt from 'jsonwebtoken'

export function newTokenService(
    issClaim,
    accessTokenLifetime,
    refreshTokenLifetime
) {
    // NOTE name convention for token_use:
    // snake_case to make it somewhat compatible with AWS Cognito
    // https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
    function getAccessClaims(username) {
        return {
            username,
            token_use: 'access',
            iss: issClaim,
        }
    }

    function getRefreshClaims(username) {
        return {
            username,
            token_use: 'refresh',
            iss: issClaim,
        }
    }

    function verifyToken(jwks, token, use) {
        let decodedToken

        // Verify token signature
        try {
            // Look up for the jwk
            const { kid, alg } = jwt.decode(token, { complete: true }).header
            const jwk = jwks.keys.find((j) => j.kid === kid)

            // Decode token and verify its signature
            decodedToken = jwt.verify(token, jwkToPem(jwk), {
                algorithms: [alg],
            })
        } catch (err) {
            console.error(err)
            throw new Error(`can't verify token ${token}`)
        }

        // Verify use claim
        if (decodedToken.token_use !== use) {
            throw new Error(
                `unexpected token_use claim ${decodedToken.token_use}`
            )
        }

        // Verify iss claim
        if (decodedToken.iss !== issClaim) {
            throw new Error(`unexpected iss claim ${decodedToken.token_iss}`)
        }

        return decodedToken
    }

    function getOptions(kid) {
        return {
            algorithm: 'RS256',
            expiresIn: accessTokenLifetime,
            keyid: kid,
        }
    }

    function issueTokens(username, privateKey, jwkSets) {
        const kid = jwkSets.keys[0].kid
        const refreshOptions = {
            ...getOptions(kid),
            expiresIn: refreshTokenLifetime,
        }

        const access = jwt.sign(
            getAccessClaims(username),
            privateKey,
            getOptions(kid)
        )

        const refresh = jwt.sign(
            getRefreshClaims(username),
            privateKey,
            refreshOptions
        )

        return {
            access,
            refresh,
        }
    }

    function refreshToken(token, privateKey, jwkSets) {
        const verified = verifyToken(jwkSets, token, 'refresh')
        return issueTokens(verified.username, privateKey, jwkSets)
    }

    return {
        issue: issueTokens,
        refresh: refreshToken,
    }
}

export default {
    newTokenService,
}
