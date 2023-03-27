//
// Get/Add user from/to DynamoDB
//

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import helpers from '../helpers.js'

const ddb = new DynamoDB({ region: process.env.REGION })

async function addUser(user) {
    try {
        const params = {
            TableName: process.env.TABLE_NAME,
            Item: marshall({
                username: user.username,
                hashedPassword: user.hashedPassword,
            }),
            ConditionExpression: 'attribute_not_exists(username)',
        }
        await ddb.putItem(params)
    } catch (err) {
        console.error(err)
        let message = 'internal DB error'
        let status = 500

        if (err instanceof ConditionalCheckFailedException) {
            message = `user already exists ${user.username}`
            status = 400
        }

        throw new helpers.BackendError({
            message,
            status,
        })
    }
}

async function getUser(username) {
    try {
        const params = {
            TableName: process.env.TABLE_NAME,
            Key: marshall({ username }),
        }
        const { Item } = await ddb.getItem(params)
        const user = unmarshall(Item)

        return user
    } catch (err) {
        console.error(err)
        // TODO treat everyghing as user not found
        throw new helpers.BackendError({
            message: `user not found ${user.username}`,
            status: 404,
        })
    }
}

export default { addUser, getUser }
