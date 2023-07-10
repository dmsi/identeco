function newController(config) {
    const { keysStorage } = config

    console.log('config:', config)

    return async function () {
        const jwkSets = await keysStorage.readJwkSets()
        console.log('jwkSets:', jwkSets)
        return jwkSets
    }
}

export default {
    newController,
}
