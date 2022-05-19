# Prereqs

Once stack is deployed the _keypair.pem_ and _jwks.json_ needs to be uploaded to the s3 bucket.

# How to deploy / remove

Deploy whole stack

```
sls deploy
```

Remove whole stack

```
sls remove
```

Deploy a single function (register)

```
sls deploy function -f register
```

# Known Issues
- In case of errors it returns 500 status code (in some situations), but we want it to return some actual error code like 401, 400, etc
- _keypair.pem_ and _jwks.json_ needs to be pre-created and manually uploaded to s3 bucket
