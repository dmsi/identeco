import bcrypt from 'bcryptjs'

function newController(config) {
    const { userStorage } = config

    return async function (username, password) {
        await userStorage.writeUser({
            username,
            hash: await bcrypt.hash(password, 10),
        })
    }
}

export default {
    newController,
}
