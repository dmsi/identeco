'use strict'

const { S3Client } = require('@aws-sdk/client-s3')
const crypto = require('crypto')
const { pem2jwk } = require('pem-jwk')
const helpers = require('../helpers')

const s3 = new S3Client({ region: process.env.REGION })

// Generates RSA keypair with some hardcoded parameters
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

  // Make jwks.json from the public key pem
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
    private_key_pem: privateKey,
    jwks_json: JSON.stringify(jwks),
  }
}

module.exports.handler = async (event) => {
  try {
    // Generate keys
    const { private_key_pem, jwks_json } = generateKeys()

    // Upload keys to s3
    await helpers.writeS3File(
      s3,
      process.env.KEY_BUCKET_NAME,
      'keypair.pem',
      private_key_pem
    )
    await helpers.writeS3File(
      s3,
      process.env.KEY_BUCKET_NAME,
      'jwks.json',
      jwks_json
    )

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
