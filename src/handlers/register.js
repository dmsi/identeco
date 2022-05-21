//
// Register new user.
//

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import bcrypt from 'bcryptjs'
import { addUser, getUser } from '../user.js'
import helpers from '../helpers.js'

const handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body)

    // Check request parameters
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new helpers.BackendError({
        message: 'Missing username or password',
        status: 400,
      })
    }

    // Add user to the database
    await addUser({
      username,
      hashedPassword: await bcrypt.hash(password, 10),
    })

    return {
      statusCode: 200,
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
