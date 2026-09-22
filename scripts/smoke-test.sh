#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-3101}"
PORT="$PORT" npm run dev:backend >/tmp/kanban-margin-smoke.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
python3 - "$PORT" <<'PY'
import json, sys, time
from urllib.request import Request, urlopen
base = f"http://127.0.0.1:{sys.argv[1]}"
for _ in range(40):
    try:
        if urlopen(base + "/health/", timeout=1).status == 200: break
    except Exception: time.sleep(0.25)
else: raise SystemExit("backend did not become ready")
def call(path, method="GET", body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    request = Request(base + path, method=method, headers=headers, data=json.dumps(body).encode() if body is not None else None)
    with urlopen(request, timeout=5) as response:
        assert 200 <= response.status < 300, response.status
        return json.load(response)
login = call("/api/auth/login", "POST", {"email": "employee@demo.local", "password": "demo-kanban"})
token = login["token"]
before = call("/api/dashboard/summary", token=token)
manager = call("/api/managers", "POST", {"name": "Smoke Manager", "email": "smoke@example.com", "dailyCapacity": 2}, token)
run = call("/api/optimization-runs", "POST", {}, token)
assert run["assignedCount"] <= sum(item["dailyCapacity"] for item in before["managers"]) + manager["dailyCapacity"]
lead = before["leads"][0]
after = call("/api/dashboard/summary", token=token)
occupied = next((item for item in after["assignments"] if item["managerId"] == manager["id"] and item["leadId"] != lead["id"]), None)
if occupied:
    call(f"/api/leads/{occupied['leadId']}/assignment", "PATCH", {"managerId": None}, token)
assignment = call(f"/api/leads/{lead['id']}/assignment", "PATCH", {"managerId": manager["id"]}, token)
assert isinstance(assignment["expectedGmDelta"], (int, float))
print(f"smoke ok: {run['assignedCount']} assignments, manual delta {assignment['expectedGmDelta']}")
PY
