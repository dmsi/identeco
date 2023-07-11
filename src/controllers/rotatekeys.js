function newController(config) {
    const { keyStorage, keyService } = config

    return async function () {
        //
        // The result jwks will have up to two keys, where
        //  - jwks.keys[0] => current public key
        //  - jwks.keys[1] => previous public key
        //

        // Generate new keys
        const { privateKeyPem, jwks } = keyService.generateKeys()

        // Retreive current key and append to jwks as the previous key
        try {
            const current = JSON.parse(await keyStorage.readJwkSets())
            jwks.keys.push(current.keys[0])
        } catch {}

        // Write new keys
        await Promise.all([
            keyStorage.writeJwkSets(JSON.stringify(jwks)),
            keyStorage.writePrivateKey(privateKeyPem),
        ])
    }
}

export default {
    newController,
}
