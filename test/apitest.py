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
import functools
import time
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

class State:
    def __init__(self):
        self.username = randomString()
        self.password = randomString()
        self.refresh_token = None
        self.access_token = None
        self.jwks = None
        self.verbose = 'VERBOSE' in os.environ
        self.refresh_token_mailformed = "must not work"
        self.total_time = 0

def getEndpoint(path):
    return f"{os.environ['IDENTECO_API_ENDPOINT']}{path}"


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

    if claims["iss"] != "https://github.com/dmsi/identeco":
        raise Exception(f"verifyToken {decoded_token.claims} FAILED: unexpected iss")

    if state.verbose:
        print(f"token {decoded_token.claims} => VERIFIED")


def generateBadTokens():
    # Generate refresh_token_bad and access_token_bad
    # Tokens which are signed with another private key but with the same `kid`
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=1024
    )
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    key = JWK.from_pem(private_key_pem)
    key.kid = state.jwks["keys"][0]["kid"]

    refresh_claims = {
        "username": state.username,
        "token_use": "refresh",
        "iss": "https://github.com/dmsi/identeco"
    }
    token = JWT(header={"alg": "RS256", "typ": "JWT", "kid": key.kid}, claims=refresh_claims)
    token.make_signed_token(key)
    state.refresh_token_bad = token.serialize()


def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        value = func(*args, **kwargs)
        end = time.perf_counter()
        ms = round((end - start) * 1000)
        state.total_time += ms
        print(f'{ms}ms')
        return value

    return wrapper


@timer
def testJwks(expected_status_code):
    print("\n--- testJwks ---")
    res = requests.get(
        url = getEndpoint("/.well-known/jwks.json"),
    )

    print(gethttpStatus(res))
    if res.status_code != expected_status_code:
        raise Exception(f"testJwks returned unexpected status code: got {res.status_code}, expected {expected_status_code}")

    body = res.json()
    if state.verbose:
        print("jwks.json:", body)

    state.jwks = body
    generateBadTokens()


@timer
def testRegister(expected_status_code, testcase):
    print(f"\n--- testRegister [{testcase}] ---")
    if state.verbose:
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
    if res.status_code != expected_status_code:
        raise Exception(f"testRegister returned unexpected status code: got {res.status_code}, expected {expected_status_code}")


@timer
def testLogin(expected_status_code, testcase):
    print(f"\n--- testLogin [{testcase}] ---")
    if state.verbose:
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
    if res.status_code != expected_status_code:
        raise Exception(f"testLogin returned unexpected status code: got {res.status_code}, expected {expected_status_code}")

    if res.status_code == 200:
        body = res.json()
        if state.verbose:
            print("tokens:", body)
        state.refresh_token = body["refresh"]
        state.access_token = body["access"]

        verifyToken(body["access"], "access", state.username)
        verifyToken(body["refresh"], "refresh", state.username)


@timer
def testRefresh(expected_status_code, test_case, token_name):
    print(f"\n--- testRefresh [{test_case}] ---")
    if state.verbose:
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
    if res.status_code != expected_status_code:
        raise Exception(f"testLogin returned unexpected status code: got {res.status_code}, expected {expected_status_code}")

    if res.status_code == 200:
        body = res.json()
        if state.verbose:
            print("tokens:", body)

        verifyToken(body["access"], "access", state.username)


state = State()

def main():
    try:
        print("...Testing identeco AWS Lambda API...")

        # Get JWKS
        testJwks(200)

        # Login non-registered user
        testLogin(401, "non-registered user")

        # Register new user
        testRegister(204, "new user")

        # Login registered user
        testLogin(200, "registered user")

        # Refresh tokens using 'refresh_token'
        testRefresh(200, "with refresh token", "refresh_token")

        # Refresh tokens using 'access_token'
        testRefresh(401, "with access token", "access_token")

        # Refresh tokens using 'refresh_token_bad'
        testRefresh(401, "with bad refresh token", "refresh_token_bad")

        # Refresh tokens using 'refresh_token_mailformed'
        testRefresh(401, "with mailformed refresh token", "refresh_token_mailformed")

        state.password = "wrong"

        # Login using wrong password
        testLogin(401, "wrong password")

        # Register existing user
        testRegister(400, "existing user")

        # Login using empty credentials
        state.username = ""
        state.password = ""
        testLogin(401, "empty credentials")

        # Register using empty credentials
        testRegister(400, "empty credentials")

        print("\n...PASSED...")
        print(f'{state.total_time}ms')

    except Exception as e:
        print("ERROR :::", e)
        traceback.print_exc()
        print("\n...FAILED...")
        print(f'{state.total_time}ms')


if __name__ == "__main__":
    main()
