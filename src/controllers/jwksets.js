function newController(config) {
    const { keyStorage } = config

    return async function () {
        const jwkSets = await keyStorage.readJwkSets()
        return jwkSets
    }
}

export default {
    newController,
}
