import unittest

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from prepare_features import prepare_features
from optimize_assignments import optimize


class FeatureTests(unittest.TestCase):
    def test_grouped_stats_are_finite(self):
        rows = prepare_features([{"managerId": "m1", "region": "Гродно", "product": "Столы", "held": True, "sold": True, "grossMargin": 200, "saleAmount": 1000}])
        self.assertEqual(rows[0]["meetings"], 1)
        self.assertEqual(rows[0]["conversion"], 1.0)

    def test_optimizer_returns_json_shape_and_capacity(self):
        result = optimize({"managers": [{"id": "m1", "active": True, "dailyCapacity": 1}], "leads": [{"id": "l1"}, {"id": "l2"}], "history": []})
        self.assertEqual(len(result["assigned"]), 1)
        self.assertEqual(result["unassigned"], ["l2"])


if __name__ == "__main__":
    unittest.main()
