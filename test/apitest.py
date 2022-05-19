from jwcrypto import jwk, jwt
import requests
import random
import string


class State:
    def __init__(self):
        self.username = randomString()
        self.password = randomString()
        self.refresh_token = None
        self.jwks = None


def getEndpoint(path):
    return f"https://hfbez7dpci.execute-api.eu-west-1.amazonaws.com/dev{path}"


def randomString():
    return ''.join(random.choices(string.ascii_lowercase + string.ascii_uppercase, k=10))


def gethttpStatus(res):
    return f"HTTP {res.status_code} {res.reason}"


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
        state.refresh_token = body["refresh_token"]

        # Verify access_token
        key = jwk.JWK(**state.jwks["keys"][0])
        jwt.JWT(key = key, jwt = body["access_token"])

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
    key = jwk.JWK(**state.jwks["keys"][0])
    jwt.JWT(key = key, jwt = body["access_token"])

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
        print("****** FAILED *********")


if __name__ == "__main__":
    main()
