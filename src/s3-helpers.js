//
// Helper functions for dealing with S3
//
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html
//

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.REGION })

// Read s3 object as a string
async function readS3Object(bucket, key) {
  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = []
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })

  const data = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
  return await streamToString(data.Body)
}

// Write s3 object from string
async function writeS3Object(bucket, key, body) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    })
  )
}

export { readS3Object, writeS3Object }
