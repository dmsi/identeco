import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

export function newDynamoDbUsersStorage(tableName, config) {
    const ddb = new DynamoDB(config)

    async function readUser(username) {
        console.log(`[ddb] readUser username: ${username}, table: ${tableName}`)

        const input = {
            TableName: tableName,
            Key: marshall({ username }),
        }
        const { Item } = await ddb.getItem(input)
        return unmarshall(Item)
    }

    async function writeUser(user) {
        console.log(
            `[ddb] writeUser username: ${user.username}, table: ${tableName}`
        )

        const input = {
            TableName: tableName,
            Item: marshall({
                username: user.username,
                hash: user.hash,
            }),
            ConditionExpression: 'attribute_not_exists(username)',
        }
        await ddb.putItem(input)
    }

    return {
        readUser,
        writeUser,
    }
}
