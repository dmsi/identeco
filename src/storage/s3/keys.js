import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3'

// Read s3 object as a string
async function readS3Object(s3, bucket, key) {
    const streamToString = (stream) =>
        new Promise((resolve, reject) => {
            const chunks = []
            stream.on('data', (chunk) => chunks.push(chunk))
            stream.on('error', reject)
            stream.on('end', () =>
                resolve(Buffer.concat(chunks).toString('utf8'))
            )
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
async function writeS3Object(s3, bucket, key, body) {
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        })
    )
}

export function newS3KeysStorage(bucket, privateKeyName, jwkSetsName, config) {
    const s3 = new S3Client(config)

    return {
        readPrivateKey: async function () {
            console.log('[s3] readPrivateKey')
            return await readS3Object(s3, bucket, privateKeyName)
        },

        writePrivateKey: async function (privateKey) {
            console.log('[s3] writePrivateKey')
            writeS3Object(s3, bucket, privateKeyName, privateKey)
        },

        readJwkSets: async function () {
            console.log(
                `[s3] readJwkSets bucket: ${bucket}, jwks: ${jwkSetsName}`
            )
            return await readS3Object(s3, bucket, jwkSetsName)
        },

        writeJwkSets: async function (jwkSets) {
            console.log('[s3] writeJwkSets')
            writeS3Object(s3, bucket, jwkSetsName, jwkSets)
        },
    }
}
