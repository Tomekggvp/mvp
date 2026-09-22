from __future__ import annotations

from collections import defaultdict
from typing import Any


def prepare_features(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for item in history:
        grouped[(item["managerId"], item["region"], item["product"])].append(item)
    rows = []
    for (manager_id, region, product), items in grouped.items():
        held = [item for item in items if item.get("held")]
        sales = [item for item in held if item.get("sold")]
        rows.append({
            "managerId": manager_id,
            "region": region,
            "product": product,
            "meetings": len(held),
            "sales": len(sales),
            "conversion": len(sales) / len(held) if held else 0.0,
            "avgGm": sum(item.get("grossMargin", 0) for item in sales) / len(sales) if sales else 0.0,
            "avgCheck": sum(item.get("saleAmount", 0) for item in sales) / len(sales) if sales else 0.0,
        })
    return rows
