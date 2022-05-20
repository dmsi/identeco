//
// Register new user.
//

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import bcrypt from 'bcryptjs'
import helpers from '../helpers.js'

const ddb = new DynamoDB({ region: process.env.REGION })

const handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body)

    console.log(event)
    console.log('username:', username)
    console.log('password:', password)

    // Check request parameters
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new helpers.BackendError({
        message: 'Missing username or password',
        status: 400,
      })
    }

    // In case of existing username, that will throw 500
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: marshall({
        username,
        password: await bcrypt.hash(password, 10),
      }),
      ConditionExpression: 'attribute_not_exists(username)',
    }
    await ddb.putItem(params)

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
