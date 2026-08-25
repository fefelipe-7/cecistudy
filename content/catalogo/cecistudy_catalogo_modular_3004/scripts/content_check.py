import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
files=list((ROOT/"content/questions").rglob("*.questions.json"))
ids=set(); errors=[]; total=0
for path in files:
 doc=json.loads(path.read_text(encoding="utf-8"))
 for q in doc.get("questions",[]):
  total+=1
  if q.get("id") in ids: errors.append(f"ID duplicado: {q.get("id")}")
  ids.add(q.get("id"))
  if not q.get("stem") or not q.get("categoryId") or not q.get("approachIds"): errors.append(f"Campos básicos ausentes: {q.get("id")}")
  correct=sum(1 for o in q.get("options",[]) if o.get("isCorrect"))
  if q.get("isScorable") and correct != 1: errors.append(f"Gabarito não único: {q.get("id")}")
manifest=json.loads((ROOT/"content/catalog.manifest.json").read_text(encoding="utf-8"))
if total != manifest["counts"]["questions"]: errors.append("Contagem do manifesto divergente")
print(json.dumps({"files":len(files),"questions":total,"errors":errors},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
