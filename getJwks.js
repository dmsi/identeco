'use strict'
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const helpers = require('./helpers')

const s3Client = new S3Client({ region: process.env.REGION })

const bucketParams = {
  Bucket: process.env.KEY_BUCKET_NAME,
  Key: 'jwks.json',
}

module.exports.handler = async (event) => {
  try {
    helpers.allowMethods(event, ['GET'])

    // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = []
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      })

    const data = await s3Client.send(new GetObjectCommand(bucketParams))
    const bodyContents = await streamToString(data.Body)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: bodyContents,
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}
