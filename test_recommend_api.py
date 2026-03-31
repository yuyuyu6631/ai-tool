#!/usr/bin/env python3
"""Test the recommend API endpoint with AI integration"""

import json
import urllib.request
import urllib.error

API_URL = "http://localhost:8000/api/recommend"

payload = {
    "query": "帮我找一个可以写代码的AI工具",
    "scenario": None,
    "tags": []
}

print("Testing POST %s" % API_URL)
print("Payload: %s" % json.dumps(payload, ensure_ascii=False))
print()

try:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    print("Sending request...")
    with urllib.request.urlopen(req, timeout=60) as response:
        status_code = response.getcode()
        print("Status: %d" % status_code)
        print()

        if status_code == 200:
            raw_text = response.read().decode("utf-8")
            print("Raw response:")
            print(raw_text)
            print()
            result = json.loads(raw_text)
            print("Parsed as JSON:")
            print("Type: %s" % type(result))
            print("Length/keys: %s" % (len(result) if hasattr(result, '__len__') else result.keys()))
            print()
            if isinstance(result, list):
                print("[OK] Success! Got %d recommended tools:" % len(result))
                print()
                for i, item in enumerate(result, 1):
                    print("%d. %s" % (i, item['name']))
                    print("   Slug: %s" % item['slug'])
                    print("   Reason: %s" % item['reason'])
                    print("   Score: %s" % item['score'])
                    print()

except urllib.error.URLError as e:
    print("[FAIL] Connection error: %s" % e)
    print("Is the backend server running on port 8000?")
    exit(1)
except Exception as e:
    print("[FAIL] Error: %s: %s" % (type(e).__name__, e))
    exit(1)
