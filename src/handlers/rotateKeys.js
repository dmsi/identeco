'use strict'

//
// Rotate RSA keys
//
// Generates new keys and uploads private key PEM file and JWKS json
// to s3 bucket.
// Keeps the previous JWK keys as jwks.keys[1].
//

const { S3Client } = require('@aws-sdk/client-s3')
const crypto = require('crypto')
const { pem2jwk } = require('pem-jwk')
const helpers = require('../helpers')

const s3 = new S3Client({ region: process.env.REGION })

function generateKeys() {
  // Generate RSA keypair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
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

async function rotateKeys(privateKeyPem, jwks) {
  //
  // The result jwks will have up to two keys, where
  //  - jwks.keys[0] => current public key
  //  - jwks.keys[1] => previous public key
  //

  // Retreive current key and append to jwks as the previous key
  try {
    const current = JSON.parse(
      await helpers.readS3File(
        s3,
        process.env.BUCKET_NAME,
        process.env.JWKS_JSON_NAME
      )
    )
    if (current.keys.length > 0) {
      jwks.keys.push(current.keys[0])
    }
  } catch {}

  console.log('****jwks:', jwks)

  // Upload private key and jwks to s3
  await Promise.all([
    helpers.writeS3File(
      s3,
      process.env.BUCKET_NAME,
      process.env.PRIVATE_KEY_NAME,
      privateKeyPem
    ),
    helpers.writeS3File(
      s3,
      process.env.BUCKET_NAME,
      process.env.JWKS_JSON_NAME,
      JSON.stringify(jwks)
    ),
  ])
}

module.exports.handler = async (event) => {
  try {
    console.log('Rotating Keys...')
    const { privateKeyPem, jwks } = generateKeys()
    await rotateKeys(privateKeyPem, jwks)

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
