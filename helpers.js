'use strict'
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')

class BackendError extends Error {
  constructor(e) {
    super(e.message)
    this.status = e.status
  }
}

function getStatusCode(err) {
  return err.status || 500
}

// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html
async function readS3File(client, bucket, key) {
  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = []
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })

  const data = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
  return await streamToString(data.Body)
}

module.exports = {
  readS3File,
  getStatusCode,
  BackendError,
}
