//
// Refresh accessToken using refreshToken
//

import jwkToPem from 'jwk-to-pem'
import jwt from 'jsonwebtoken'
import { readS3Object } from '../s3-helpers.js'
import helpers from '../helpers.js'

function verifyRefreshToken(jwks, token) {
  const { kid, alg } = jwt.decode(token, { complete: true }).header
  const jwk = jwks.keys.find((j) => j.kid === kid)

  // Decode token and verify its signature
  const decodedToken = jwt.verify(token, jwkToPem(jwk), {
    algorithms: [alg],
  })

  // Verify token claims
  if (decodedToken.token_use !== 'refresh') {
    throw new helpers.BackendError({
      message: `unexpected token_use claim ${decodedToken.token_use}`,
      status: 403,
    })
  }

  if (decodedToken.iss !== process.env.ISS_CLAIM) {
    throw new helpers.BackendError({
      message: `unexpected iss claim ${decodedToken.token_use}`,
      status: 403,
    })
  }

  return decodedToken
}

const handler = async (event) => {
  try {
    const auth = event.headers['Authorization']
    if (!auth) {
      throw new helpers.BackendError({
        message: 'missing authorization token',
        status: 403,
      })
    }
    const refreshToken = auth.split(' ')[1]

    // Read keys
    const privateKeyPem = await readS3Object(
      process.env.BUCKET_NAME,
      process.env.PRIVATE_KEY_NAME
    )
    const jwks = JSON.parse(
      await readS3Object(process.env.BUCKET_NAME, process.env.JWKS_JSON_NAME)
    )

    // Verify refresh token's signature and claims
    const decodedToken = verifyRefreshToken(jwks, refreshToken)

    // Issue new access token
    const claims = {
      username: decodedToken.username,
      token_use: 'access',
      iss: decodedToken.iss,
    }
    const options = {
      algorithm: 'RS256',
      expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
      keyid: jwks.keys[0].kid,
    }
    const accessToken = jwt.sign(claims, privateKeyPem, options)

    // Send the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
      }),
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
