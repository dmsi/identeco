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

    const pwd_ok = await bcrypt.compare(password, user.password)
    if (pwd_ok !== true) {
      throw new helpers.BackendError({
        message: `invalid login or password for ${username}`,
        status: 401,
      })
    }

    // Read keys
    const keypair_pem = await helpers.readS3File(
      s3,
      process.env.KEY_BUCKET_NAME,
      'keypair.pem'
    )
    const jwks = JSON.parse(
      await helpers.readS3File(s3, process.env.KEY_BUCKET_NAME, 'jwks.json')
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
    const access_token = jwt.sign(claims, keypair_pem, options)
    const refresh_token = jwt.sign(claims, keypair_pem, {
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
        access_token,
        refresh_token,
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
