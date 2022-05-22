# Identeco

Minimalist authentication and authorization provider implemented using AWS Lambda.

# Principal design

```mermaid
flowchart LR
U((user)) <===> |HTTP| API([API Gateway])
API ----> |POST /register| F_REGISTER(register)
API ----> |POST /login| F_LOGIN(login)
API ----> |GET /refresh| F_REFRESH(refresh)
API ----> |GET<br/>/.well-known/jwks.json| F_GETJWKS(getJwks)

%% User data %%%
F_REGISTER --- DB[(DynamoDB<br/>users)]
F_LOGIN --- DB

%% Private and public keys %%
F_LOGIN --- S3[(S3<br/>keys)]
F_REFRESH --- S3
F_GETJWKS --- S3

EVENT((every<br/>30 days)) ---- |event| CW([CloudWatch])
CW ----> F_ROTATE(rotateKeys)
F_ROTATE --- S3
```

# Pre-reqs

- nodejs (tested on v16.15.0)
- serverless installed globally (tested on 3.16.0)

```sh
npm install -g serverless
```

# Operations

## Deploy

Deploy whole stack (default stage is 'dev')

```bash
serverless deploy
serverless invoke function -f rotateKeys
```

> **Note** rotateKeys function is trigerred periodically by CloudWatch events but in order to
> rotate keys the first time it needs to be triggered manually right after the deployment.

Serverless will create AWS `cloudformation` with all the resources specified in `serverless.yml`.
Example output

```
$ serverless deploy

Deploying identeco to stage dev (eu-west-1)

✔ Service deployed to stack identeco-dev (58s)

endpoints:
  GET - https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev/.well-known/jwks.json
  POST - https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev/register
  POST - https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev/login
  GET - https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev/refresh
functions:
  getJwks: identeco-dev-getJwks (17 MB)
  register: identeco-dev-register (17 MB)
  login: identeco-dev-login (17 MB)
  refresh: identeco-dev-refresh (17 MB)
  rotateKeys: identeco-dev-rotateKeys (17 MB)

Monitor all your API routes with Serverless Console: run "serverless --console"
```

### Run python test

> **Note** `python3.9` with module `venv` is required

The following snippet can be used in order to run the tests in `bash` environment

```bash
cd ./test

# Setup pyton venv and activate it
python -m venv myenv

# Setup python dependencies
source myenv/bin/activate
pip install -r requirements.txt

# Run the test
export IDENTECO_API_ADDRESS=https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev
python apitest.py
```

> **Note** `IDENTECO_API_ADDRESS` env variable must be set prior running the test.
> The value must be taken from the `serverless deploy` output including stage (i.e. `/dev`)
> but **excluding** the tailing `/` symbol.
> For example: `export IDENTECO_API_ADDRESS=https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev`

## Remove

Remove whole stack

> **Note** Manually remove all object from s3 bucket before stack deletion.
> i.e. `aws s3 rm s3://identeco-keys --recursive`

This will remove all underlying resources from the `cloudformation` stack.

```
serverless remove
```

## Deploy a single lambda function

The following will deploy `register` function

```
serverless deploy function -f register
```

# Features

- Registraion of username/password
- Using assymetric RS256 JWK algorithm
- Automatic keys rotation
- In jwks.json keeps the previous public key as well

# Known Issues and Limitations

- In case of errors it returns 500 status code (in some situations), but we want it to return some actual error code like 401, 400, etc
- Supports only authentication (`username` claim).
- No email confirmation
- No OpenID support

# Roadmap

## v0.1.0-alpha

- [x] Add dependencies for python tests
- [x] Replace API /rotate to cron-like scheduled event (CloudWatch)
- [x] Replace require to EC6-style import
- [x] Move towards all-camelCase (currently trying to keep variables / json fields in a snake_case, while functions are camelCase)

## v0.1.1-alpha

- [x] Add configurable key length (env vars)
- [x] Add configurable accessToken duration and keys rotation period (env vars)
- [x] Add individual IAM roles per function (sls plugin)
- [x] Split helpers to generic/s3/dynamodb modules

## v0.1.2-alpha

- [x] Add stage name to S3 bucket `identeco-<stage>-keys` and DynamoDB table `identeco-<stage>-users`
- [x] Implement CI/CD action when push to main branch (deploy stage `prod`)
- [ ] Fix CI/CD issue with the profile (conditional profile for `dev` stage in `serverless.yml`)
- [ ] GitHub action uses `npm ci` which also installs dev plugins, use `npm ci --production`
- [ ] Add token_use claim `access` and `refresh` and for refresh function do not accept `access` tokens
- [ ] Return appropriate HTTP status code in all cases instead of 500
- [ ] TBD
