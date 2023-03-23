//
// Get/Add user from/to DynamoDB
//

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

const ddb = new DynamoDB({ region: process.env.REGION })

async function addUser(user) {
    const params = {
        TableName: process.env.TABLE_NAME,
        Item: marshall({
            username: user.username,
            hashedPassword: user.hashedPassword,
        }),
        ConditionExpression: 'attribute_not_exists(username)',
    }
    await ddb.putItem(params)
}

async function getUser(username) {
    const params = {
        TableName: process.env.TABLE_NAME,
        Key: marshall({ username }),
    }
    const { Item } = await ddb.getItem(params)
    const user = unmarshall(Item)

    return user
}

export default { addUser, getUser }
