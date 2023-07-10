//
// Register new user.
//

import helpers from './lib/helpers.js'
import { newRegisterController } from '../runtime.js'

async function handler(event) {
    try {
        const { username, password } = helpers.getCredentials(event)
        const controller = newRegisterController()
        await controller(username, password)

        return {
            statusCode: 204,
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 400,
        }
    }
}

export { handler }
