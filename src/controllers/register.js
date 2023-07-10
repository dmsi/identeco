import bcrypt from 'bcryptjs'

function newController(config) {
    const { usersStorage } = config

    return async function (username, password) {
        await usersStorage.writeUser({
            username,
            hash: await bcrypt.hash(password, 10),
        })
    }
}

export default {
    newController,
}
