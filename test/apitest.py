# Using jwcrypto for verification and jwt for decoding JWT headers
from jwcrypto.jwk import JWK
from jwcrypto.jwt import JWT
from jwt import get_unverified_header
import requests
import random
import string
import traceback
import os
import json


class State:
    def __init__(self):
        self.username = randomString()
        self.password = randomString()
        self.refresh_token = None
        self.access_token = None
        self.jwks = None


def getEndpoint(path):
    return f"{os.environ['IDENTECO_API_ADDRESS']}{path}"


def randomString():
    return ''.join(random.choices(string.ascii_letters, k = 10))


def gethttpStatus(res):
    return f"HTTP {res.status_code} {res.reason}"


def verifyToken(token, expected_token_use, expected_token_username):
    # Lookup jwk by token's kid
    header = get_unverified_header(token)
    jwk = next(filter(lambda k: k["kid"] == header["kid"], state.jwks["keys"]))

    # Verify token signature
    decoded_token = JWT(key = JWK(**jwk), jwt = token)

    claims = json.loads(decoded_token.claims)

    # Verify token claims
    if claims["token_use"] != expected_token_use:
        raise Exception(f"verifyToken {decoded_token.claims} FAILED: unexpected token_use")

    if claims["username"] != expected_token_username:
        raise Exception(f"verifyToken {decoded_token.claims} FAILED: unexpected username")

    print(f"token {decoded_token.claims} => VERIFIED")


def testJwks():
    print()
    print("*** testJwks ***")
    res = requests.get(
            url = getEndpoint("/.well-known/jwks.json"),
    )

    print(gethttpStatus(res))
    if res.status_code != 200:
        raise Exception(f"testJwks returned unexpected status code: {gethttpStatus(res)}")

    body = res.json()
    print("jwks.json:", body)
    state.jwks = body

    print("*** PASSED ***")
    print()


def testRegister(should_pass):
    print()
    print("*** testRegister ***")
    print("username:", state.username)
    print("password:", state.password)
    res = requests.post(
            url = getEndpoint("/register"),
            json = {
                "username": state.username,
                "password": state.password
            }
    )

    print(gethttpStatus(res))
    if should_pass:
        if res.status_code != 200: 
            raise Exception(f"testRegister returned unexpected status code: {gethttpStatus(res)}")
    else:
        if res.status_code == 200: 
            raise Exception(f"testRegister returned unexpected status code: {gethttpStatus(res)}")

    print("*** PASSED ***")
    print()


def testLogin(should_pass):
    print()
    print("*** testLogin ***")
    print("username:", state.username)
    print("password:", state.password)
    res = requests.post(
            url = getEndpoint("/login"),
            json = {
                "username": state.username,
                "password": state.password
            }
    )

    print(gethttpStatus(res))

    if should_pass:
        if res.status_code != 200: 
            raise Exception(f"testLogin returned unexpected status code: {gethttpStatus(res)}")
    else:
        if res.status_code == 200: 
            raise Exception(f"testLogin returned unexpected status code: {gethttpStatus(res)}")

    if should_pass:
        body = res.json()
        print("tokens:", body)
        state.refresh_token = body["refreshToken"]
        state.access_token = body["accessToken"]

        verifyToken(body["accessToken"], "access", state.username)
        verifyToken(body["refreshToken"], "refresh", state.username)

    print("*** PASSED ***")
    print()


def testRefresh(should_pass, token_name):
    print()
    print(f"*** testRefresh, shuld_pass: {should_pass}, token_name: {token_name} ***")
    print("username:", state.username)
    print("password:", state.password)
    token = getattr(state, token_name)
    res = requests.get(
            url = getEndpoint("/refresh"),
            headers = {
                "Authorization": f"Bearer {token}"
            }
    )

    print(gethttpStatus(res))

    if should_pass:
        if res.status_code != 200: 
            raise Exception(f"testRefresh returned unexpected status code: {gethttpStatus(res)}")
    else:
        if res.status_code == 200: 
            raise Exception(f"testRefresh returned unexpected status code: {gethttpStatus(res)}")


    if should_pass:
        body = res.json()
        print("tokens:", body)

        # Verify issued access token
        verifyToken(body["accessToken"], "access", state.username)

    print("*** PASSED ***")
    print()


state = State()

def main():
    try:
        print("...Testing myid-aws-lambda API...")

        testJwks()
        testRegister(should_pass = True)
        testLogin(should_pass = True)
        testRefresh(should_pass = True, token_name = "refresh_token")

        testRefresh(should_pass = False, token_name = "access_token")
        state.password = "wrong"
        testRegister(should_pass = False)
        testLogin(should_pass = False)

        print("****** PASSED *********")

    except Exception as e:
        print("ERROR :::", e)
        traceback.print_exc()
        print("****** FAILED *********")


if __name__ == "__main__":
    main()
