//
// Refresh accessToken using refreshToken
//

import jwkToPem from 'jwk-to-pem'
import jwt from 'jsonwebtoken'
import { readS3Object } from '../s3-helpers.js'
import helpers from '../helpers.js'

function verifyToken(jwks, token) {
  const { kid, alg } = jwt.decode(token, { complete: true }).header
  const jwk = jwks.keys.find((j) => j.kid === kid)
  const decodedToken = jwt.verify(token, jwkToPem(jwk), {
    algorithms: [alg],
  })

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

    // Verify refresh token's signature
    const decodedToken = verifyToken(jwks, refreshToken)

    // Issue new access token
    const claims = {
      username: decodedToken.username,
    }
    const options = {
      algorithm: 'RS256',
      expiresIn: '60m',
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
