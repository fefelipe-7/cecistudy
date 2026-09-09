# Evaluation Results

## Status

This repository now includes `skill-creator`-style eval artifacts, but a full old-vs-new delegated benchmark has not yet been executed in this workspace.

Reason: the current environment only permits subagent execution after an explicit user request for delegated agents. The eval suite is ready for that run.

## Static Eval Readiness

Validated on 2026-05-24:

| Check | Result |
| --- | --- |
| Output-quality evals parse as JSON | Pass |
| Trigger evals parse as JSON | Pass |
| Output-quality eval count | 5 |
| Total expectations | 39 |
| Trigger eval count | 12 |
| Trigger eval balance | 6 should-trigger / 6 should-not-trigger |
| Frontmatter size | Under 1,000 characters at last check |
| Whitespace check | Pass |
| ASCII check | Pass |

## Coverage

The eval suite covers:

- Lean customer-support dashboard MVP planning.
- Regulated healthcare intake planning without compliance overclaiming.
- Offline-first field inspection planning.
- Over-engineering resistance for a tiny internal approval tool.
- Personal, organization, project, and workspace context alignment.

## Expected Benchmark Procedure

Use the `skill-creator` improve-mode workflow:

1. Snapshot the previous skill version.
2. Run each eval with the current skill and the baseline.
3. Save outputs under a benchmark workspace.
4. Grade each expectation with concrete evidence.
5. Aggregate pass rate, timing, and token usage.
6. Review qualitative differences before changing the skill again.

## Current Qualitative Findings

The latest improvement pass strengthened areas that were likely to be weak in benchmark outputs:

- Context alignment is now a required matrix rather than a loose heading.
- ADRs now include `Context / Drivers`, making it easier to verify why decisions were made.
- Workspace inspection guidance was added for repo-sensitive recommendations.
- Evals now use `expectations`, matching the `skill-creator` schema.

## Known Remaining Test Gaps

- No benchmark outputs have been generated yet.
- No evaluator has compared old-skill and new-skill responses.
- No quantitative pass rate is available.
- Trigger evals have not been run through an automated description optimizer.
