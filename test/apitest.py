# Using jwcrypto for verification and jwt for decoding JWT headers
from jwcrypto.jwk import JWK
from jwcrypto.jwt import JWT
from jwt import get_unverified_header
import requests
import random
import string
import traceback


class State:
    def __init__(self):
        self.username = randomString()
        self.password = randomString()
        self.refresh_token = None
        self.jwks = None


def getEndpoint(path):
    return f"https://3yhosi5j8l.execute-api.eu-west-1.amazonaws.com/dev{path}"


def randomString():
    return ''.join(random.choices(string.ascii_letters, k = 10))


def gethttpStatus(res):
    return f"HTTP {res.status_code} {res.reason}"


def verifyToken(token_name, token):
    # Lookup jwk by token's kid
    header = get_unverified_header(token)
    jwk = next((k for k in state.jwks["keys"] if k["kid"] == header["kid"]), None)

    # Verify token
    JWT(key = JWK(**jwk), jwt = token)

    print(f"{token_name}: verified")


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

        verifyToken("accessToken", body["accessToken"])
        verifyToken("refreshToken", body["refreshToken"])



    print("*** PASSED ***")
    print()


def testRefresh():
    print()
    print("*** testRefresh ***")
    print("username:", state.username)
    print("password:", state.password)
    res = requests.get(
            url = getEndpoint("/refresh"),
            headers = {
                "Authorization": f"Bearer {state.refresh_token}"
            }
    )

    print(gethttpStatus(res))

    if res.status_code != 200: 
        raise Exception(f"testRefresh returned unexpected status code: {gethttpStatus(res)}")

    body = res.json()
    print("tokens:", body)

    # Verify access_token
    verifyToken("accessToken", body["accessToken"])

    print("*** PASSED ***")
    print()


state = State()


def main():
    try:
        print("...Testing myid-aws-lambda API...")

        testJwks()
        testRegister(should_pass = True)
        testLogin(should_pass = True)
        testRefresh()

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
