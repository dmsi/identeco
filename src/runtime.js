// All dependency injection
import { newDynamoDbUsersStorage } from './storage/dynamodb/users.js'
import { newS3KeysStorage } from './storage/s3/keys.js'
import jwksets from './controllers/jwksets.js'
import register from './controllers/register.js'
import login from './controllers/login.js'
import refresh from './controllers/refresh.js'
import rotatekeys from './controllers/rotatekeys.js'
import tokenService from './services/token.js'
import keyService from './services/keys.js'

function newKeysStorage() {
    return newS3KeysStorage(
        process.env.BUCKET_NAME,
        process.env.PRIVATE_KEY_NAME,
        process.env.JWKS_JSON_NAME
    )
}

function newUsersStorage() {
    return newDynamoDbUsersStorage(process.env.TABLE_NAME)
}

function newTokenService() {
    return tokenService.newTokenService(
        process.env.ISS_CLAIM,
        process.env.ACCESS_TOKEN_LIFETIME,
        process.env.PRIVATE_KEY_LIFETIME
    )
}

function newKeyService() {
    return keyService.newKeyService(parseInt(process.env.PRIVATE_KEY_LENGTH))
}

export function newJwkSetsController() {
    return jwksets.newController({
        keysStorage: newKeysStorage(),
    })
}

export function newRegisterController() {
    return register.newController({
        usersStorage: newUsersStorage(),
    })
}

export function newLoginController() {
    return login.newController({
        keysStorage: newKeysStorage(),
        usersStorage: newUsersStorage(),
        tokenService: newTokenService(),
    })
}

export function newRefreshController() {
    return refresh.newController({
        keysStorage: newKeysStorage(),
        tokenService: newTokenService(),
    })
}

export function newRotateKeysController() {
    return rotatekeys.newController({
        keysStorage: newKeysStorage(),
        keyService: newKeyService(),
    })
}
