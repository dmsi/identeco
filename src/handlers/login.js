//
// Login using username and password issue accessToken and refreshToken
// upon the success.
//

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { readS3Object } from '../s3-helpers.js'
import { addUser, getUser } from '../user.js'
import helpers from '../helpers.js'

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
  // Query user by username
  const user = await getUser(username)

  const pwdOk = await bcrypt.compare(password, user.hashedPassword)
  if (pwdOk !== true) {
    throw new helpers.BackendError({
      message: `invalid login or password for ${username}`,
      status: 401,
    })
  }
}

async function issueTokens(username) {
  // Read public and private keys
  const privateKeyPem = await readS3Object(
    process.env.BUCKET_NAME,
    process.env.PRIVATE_KEY_NAME
  )
  const jwks = JSON.parse(
    await readS3Object(process.env.BUCKET_NAME, process.env.JWKS_JSON_NAME)
  )

  // Issue JWT tokens
  const claims = {
    username,
  }
  const options = {
    algorithm: 'RS256',
    expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
    keyid: jwks.keys[0].kid,
  }
  const accessToken = jwt.sign(claims, privateKeyPem, options)
  const refreshToken = jwt.sign(claims, privateKeyPem, {
    ...options,
    expiresIn: process.env.PRIVATE_KEY_LIFETIME, // sync refresh lifetime with key rotation interval
  })

  // Return tokens
  return {
    accessToken,
    refreshToken,
  }
}

const handler = async (event) => {
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

export { handler }
