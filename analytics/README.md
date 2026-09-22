# Analytics adapter

The analytics CLI accepts a JSON document on stdin and prints JSON on stdout. It is optional for local development; Node's deterministic optimizer is the default.

```bash
python3 -m unittest discover -s analytics/tests
printf '%s' '{"history": [], "leads": [], "managers": []}' | python3 analytics/src/optimize_assignments.py
```
