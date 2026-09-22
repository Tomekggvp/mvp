from __future__ import annotations

import json
import sys
from typing import Any

from prepare_features import prepare_features


def optimize(payload: dict[str, Any]) -> dict[str, Any]:
    managers = [item for item in payload.get("managers", []) if item.get("active", True)]
    leads = payload.get("leads", [])
    _ = prepare_features(payload.get("history", []))
    capacity = {item["id"]: int(item.get("dailyCapacity", 0)) for item in managers}
    assignments = []
    for lead in leads:
        target = next((manager for manager in managers if capacity[manager["id"]] > 0), None)
        if target is None:
            break
        capacity[target["id"]] -= 1
        assignments.append({"leadId": lead["id"], "managerId": target["id"], "expectedGm": 0})
    assigned_ids = {item["leadId"] for item in assignments}
    return {"assigned": assignments, "unassigned": [item["id"] for item in leads if item["id"] not in assigned_ids], "expectedTotalGm": 0}


if __name__ == "__main__":
    print(json.dumps(optimize(json.load(sys.stdin)), ensure_ascii=False))
