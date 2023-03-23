//
// Register new user.
//

import bcrypt from 'bcryptjs'
import UserService from '../services/user.js'
import helpers from '../helpers.js'

async function handler(event) {
    try {
        const { username, password } = helpers.getCredentials(event)

        await UserService.addUser({
            username,
            hashedPassword: await bcrypt.hash(password, 10),
        })

        return {
            statusCode: 200,
        }
    } catch (err) {
        console.error(err)
        return helpers.error(err)
    }
}

export { handler }
