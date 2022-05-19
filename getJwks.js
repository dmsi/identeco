'use strict'
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const helpers = require('./helpers')

const s3 = new S3Client({ region: process.env.REGION })

module.exports.handler = async (event) => {
  try {
    const jwks = await helpers.readS3File(
      s3,
      process.env.KEY_BUCKET_NAME,
      'jwks.json'
    )

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: jwks,
    }
  } catch (err) {
    // Error
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}
