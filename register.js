'use strict'
const { DynamoDB } = require('@aws-sdk/client-dynamodb')
const { marshall } = require('@aws-sdk/util-dynamodb')
const bcrypt = require('bcryptjs')
const helpers = require('./helpers')

const ddb = new DynamoDB({ region: process.env.REGION })

module.exports.handler = async (event) => {
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
