'use strict'
const { DynamoDB } = require('@aws-sdk/client-dynamodb')
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb')
const { S3Client } = require('@aws-sdk/client-s3')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const helpers = require('../helpers')

const ddb = new DynamoDB({ region: process.env.REGION })
const s3 = new S3Client({ region: process.env.REGION })

module.exports.handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body)

    // Check request parameters
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new helpers.BackendError({
        message: 'missing username or password',
        status: 400,
      })
    }

    // Query user by username
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: marshall({ username }),
    }
    const { Item } = await ddb.getItem(params)
    const user = unmarshall(Item)

    const pwdOk = await bcrypt.compare(password, user.password)
    if (pwdOk !== true) {
      throw new helpers.BackendError({
        message: `invalid login or password for ${username}`,
        status: 401,
      })
    }

    // Read keys
    const privateKeyPem = await helpers.readS3File(
      s3,
      process.env.BUCKET_NAME,
      process.env.PRIVATE_KEY_NAME
    )
    const jwks = JSON.parse(
      await helpers.readS3File(
        s3,
        process.env.BUCKET_NAME,
        process.env.JWKS_JSON_NAME
      )
    )

    // Issue JWT tokens
    const claims = {
      username,
    }
    const options = {
      algorithm: 'RS256',
      expiresIn: '60m',
      keyid: jwks.keys[0].kid,
    }
    const accessToken = jwt.sign(claims, privateKeyPem, options)
    const refreshToken = jwt.sign(claims, privateKeyPem, {
      ...options,
      expiresIn: '10d',
    })

    // Send the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        refreshToken,
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
