// All dependency injection
import { newDynamoDbUserStorage } from './storage/dynamodb/users.js'
import { newS3KeyStorage } from './storage/s3/keys.js'
import jwksets from './controllers/jwksets.js'
import register from './controllers/register.js'
import login from './controllers/login.js'
import refresh from './controllers/refresh.js'
import rotatekeys from './controllers/rotatekeys.js'
import tokenService from './services/tokens.js'
import keyService from './services/keys.js'

function newKeyStorage() {
    return newS3KeyStorage(
        process.env.BUCKET_NAME,
        process.env.PRIVATE_KEY_NAME,
        process.env.JWKS_JSON_NAME
    )
}

function newUserStorage() {
    return newDynamoDbUserStorage(process.env.TABLE_NAME)
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
        keyStorage: newKeyStorage(),
    })
}

export function newRegisterController() {
    return register.newController({
        userStorage: newUserStorage(),
    })
}

export function newLoginController() {
    return login.newController({
        keyStorage: newKeyStorage(),
        userStorage: newUserStorage(),
        tokenService: newTokenService(),
    })
}

export function newRefreshController() {
    return refresh.newController({
        keyStorage: newKeyStorage(),
        tokenService: newTokenService(),
    })
}

export function newRotateKeysController() {
    return rotatekeys.newController({
        keyStorage: newKeyStorage(),
        keyService: newKeyService(),
    })
}
