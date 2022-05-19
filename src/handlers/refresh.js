'use strict'
const jwkToPem = require('jwk-to-pem')
const { S3Client } = require('@aws-sdk/client-s3')
const jwt = require('jsonwebtoken')
const helpers = require('../helpers')

const s3 = new S3Client({ region: process.env.REGION })

module.exports.handler = async (event) => {
  try {
    const auth_hdr = event.headers['Authorization']
    if (!auth_hdr) {
      throw helpers.BackendError({
        message: 'missing authorization token',
        status: 403,
      })
    }
    const refresh_token = auth_hdr.split(' ')[1]

    // Read keys
    const keypair_pem = await helpers.readS3File(
      s3,
      process.env.KEY_BUCKET_NAME,
      'keypair.pem'
    )
    const jwks = JSON.parse(
      await helpers.readS3File(s3, process.env.KEY_BUCKET_NAME, 'jwks.json')
    )

    // Verify refresh token's signature
    const decoded_token = jwt.verify(refresh_token, jwkToPem(jwks.keys[0]), {
      algorithms: ['RS256'],
    })

    // Issue new access token
    const claims = {
      username: decoded_token.username,
    }
    const options = {
      algorithm: 'RS256',
      expiresIn: '60m',
      keyid: jwks.keys[0].kid,
    }
    const access_token = jwt.sign(claims, keypair_pem, options)

    // Send the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token,
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
