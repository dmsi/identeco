function newController(config) {
    const { keysStorage, tokenService } = config

    return async function (refreshToken) {
        const privateKey = await keysStorage.readPrivateKey()
        const jwkSets = JSON.parse(await keysStorage.readJwkSets())
        const tokens = await tokenService.refresh(
            refreshToken,
            privateKey,
            jwkSets
        )

        return JSON.stringify(tokens)
    }
}

export default {
    newController,
}
