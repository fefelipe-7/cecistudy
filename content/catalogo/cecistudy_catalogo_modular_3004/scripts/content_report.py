import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
r=json.loads((ROOT/"build/content-report.json").read_text(encoding="utf-8"))
print(json.dumps(r,ensure_ascii=False,indent=2))
