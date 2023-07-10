import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

export function newDynamoDbUsersStorage(tableName, config) {
    const ddb = new DynamoDB(config)

    return {
        readUser: async function (username) {
            console.log(`[ddb] read user ${username}`)

            const input = {
                TableName: tableName,
                Key: marshall({ username }),
            }
            const { Item } = await ddb.getItem(input)
            return unmarshall(Item)
        },

        writeUser: async function (user) {
            console.log(`[ddb] write user ${user.username}`)

            const input = {
                TableName: tableName,
                Item: marshall({
                    username: user.username,
                    hash: user.hash,
                }),
                ConditionExpression: 'attribute_not_exists(username)',
            }
            await ddb.putItem(input)
        },
    }
}
