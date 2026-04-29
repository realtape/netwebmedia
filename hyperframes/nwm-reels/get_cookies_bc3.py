"""
Use browser_cookie3 to extract Chrome cookies for youtube.com
and write them to chrome_cookies.json
"""
import browser_cookie3, json, sys

OUT = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\chrome_cookies.json"
WANT = {"SAPISID", "APISID", "HSID", "SSID", "SID", "SIDCC",
        "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-3PSID",
        "__Secure-3PSIDCC", "NID", "LOGIN_INFO"}

try:
    cj = browser_cookie3.chrome(domain_name='.youtube.com')
    result = {}
    for cookie in cj:
        if cookie.name in WANT:
            result[cookie.name] = cookie.value
            print(f"  ✓ {cookie.name}: {cookie.value[:25]}...")

    # Also grab from google.com
    cj2 = browser_cookie3.chrome(domain_name='.google.com')
    for cookie in cj2:
        if cookie.name in WANT and cookie.name not in result:
            result[cookie.name] = cookie.value
            print(f"  ✓ {cookie.name} (google): {cookie.value[:25]}...")

    with open(OUT, "w") as f:
        json.dump(result, f)
    print(f"\nWrote {len(result)} cookies: {list(result.keys())}")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
