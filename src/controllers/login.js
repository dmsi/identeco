import bcrypt from 'bcryptjs'

function newController(config) {
    const { userStorage, keyStorage, tokenService } = config

    return async function (username, password) {
        const user = await userStorage.readUser(username)
        const ok = await bcrypt.compare(password, user.hash)
        if (!ok) {
            throw Error(`invalid username or password for ${username}`)
        }

        const privateKey = await keyStorage.readPrivateKey()
        const jwkSets = JSON.parse(await keyStorage.readJwkSets())

        const tokens = await tokenService.issue(username, privateKey, jwkSets)

        return JSON.stringify({ ...tokens })
    }
}

export default {
    newController,
}
