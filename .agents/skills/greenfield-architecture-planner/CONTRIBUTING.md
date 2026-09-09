# Contributing

Thanks for improving `greenfield-architecture-planner`. This repository is intentionally small: the skill should remain easy to audit, install, and adapt.

## Contribution Principles

- Preserve the skill name unless the repository is intentionally renamed.
- Keep `SKILL.md` focused on the workflow an agent needs at activation time.
- Put detailed heuristics in `references/` when they are useful but not always needed.
- Keep `templates/` stable enough for downstream skills and update examples when template sections change.
- Add evaluation prompts for meaningful behavior changes.
- Avoid implementation scaffolding, backlog generation, or shared-memory infrastructure inside this skill.

## Local Checks

Run these before opening a pull request:

```bash
python -m json.tool evals/evals.json
python -m json.tool evals/trigger-evals.json
```

On PowerShell-only systems:

```powershell
Get-Content -Raw evals\evals.json | ConvertFrom-Json | Out-Null
Get-Content -Raw evals\trigger-evals.json | ConvertFrom-Json | Out-Null
```

If `skills-ref` is installed:

```bash
skills-ref validate .
```

## Evaluation Guidelines

Good eval prompts should be realistic and specific. Include:

- Product context and constraints.
- Stack preference or uncertainty.
- Expected output description.
- Expectations that can be verified from the produced plan.

Prefer expectations that test the skill's actual value, such as right-sizing, context alignment, explicit assumptions, ADR quality, validation coverage, security treatment, and implementation handoff usefulness.

## Pull Request Checklist

- The skill still follows the Agent Skills `SKILL.md` structure.
- The `description` remains concise and includes when to use the skill.
- New behavior is covered by evals or documented as intentionally manual.
- Optional integrations are labeled as optional and out of scope unless implemented.
- No secrets, proprietary customer details, or sensitive architecture documents are committed.
