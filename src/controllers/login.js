import bcrypt from 'bcryptjs'

function newController(config) {
    const { usersStorage, keysStorage, tokenService } = config

    return async function (username, password) {
        const user = await usersStorage.readUser(username)
        const ok = await bcrypt.compare(password, user.hash)
        if (!ok) {
            throw Error(`invalid username or password for ${username}`)
        }

        const privateKey = await keysStorage.readPrivateKey()
        const jwkSets = JSON.parse(await keysStorage.readJwkSets())

        const tokens = await tokenService.issue(username, privateKey, jwkSets)

        return JSON.stringify({ ...tokens })
    }
}

export default {
    newController,
}
