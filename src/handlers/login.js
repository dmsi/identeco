'use strict'
const { DynamoDB } = require('@aws-sdk/client-dynamodb')
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb')
const { S3Client } = require('@aws-sdk/client-s3')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const helpers = require('../helpers')

const ddb = new DynamoDB({ region: process.env.REGION })
const s3 = new S3Client({ region: process.env.REGION })

function getInput(event) {
  const body = JSON.parse(event.body)
  if (typeof body.username !== 'string' || typeof body.password !== 'string') {
    throw new helpers.BackendError({
      message: 'missing username or password',
      status: 400,
    })
  }

  return {
    username: body.username,
    password: body.password,
  }
}

async function verifyPassword(username, password) {
  // Query user by username from DynamoDB
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
}

async function issueTokens(username) {
  // Read public and private keys
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

  // Return tokens
  return {
    accessToken,
    refreshToken,
  }
}

module.exports.handler = async (event) => {
  try {
    const { username, password } = getInput(event)
    await verifyPassword(username, password)
    const tokens = await issueTokens(username)

    // Send the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...tokens }),
    }
  } catch (err) {
    // Error
    console.error(err)
    return {
      statusCode: helpers.getStatusCode(err),
    }
  }
}
