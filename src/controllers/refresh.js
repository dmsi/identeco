function newController(config) {
    const { keyStorage, tokenService } = config

    return async function (refreshToken) {
        const privateKey = await keyStorage.readPrivateKey()
        const jwkSets = JSON.parse(await keyStorage.readJwkSets())
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
