function newController(config) {
    const { keysStorage } = config

    return async function () {
        const jwkSets = await keysStorage.readJwkSets()
        return jwkSets
    }
}

export default {
    newController,
}
