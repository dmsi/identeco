//
// Return public keys as jwks.json
//

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import helpers from '../helpers.js'

const s3 = new S3Client({ region: process.env.REGION })

const handler = async (event) => {
  try {
    const jwks = await helpers.readS3File(
      s3,
      process.env.BUCKET_NAME,
      process.env.JWKS_JSON_NAME
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

export { handler }
