//
// Return public keys as jwks.json
//

import { readS3Object } from '../s3-helpers.js'
import helpers from '../helpers.js'

const handler = async (event) => {
  try {
    const jwks = await readS3Object(
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
