# Evaluation Guide

This directory follows the `skill-creator` eval conventions.

## Files

- `evals.json` contains output-quality evals. Each eval has a realistic prompt, expected output summary, input files, and verifiable `expectations`.
- `trigger-evals.json` contains description-trigger checks for should-trigger and should-not-trigger prompts.

## How To Use

1. Run each prompt with the current skill.
2. Save the generated architecture plan as the eval output.
3. Grade every expectation as pass or fail with concrete evidence from the output.
4. Review whether the expectations themselves are discriminating enough.
5. Improve the skill only when the finding generalizes beyond one prompt.

When using the full `skill-creator` workflow, compare the current skill with a baseline or previous version, then aggregate pass rates, timing, and qualitative notes in a benchmark workspace.

## Current Coverage

The output-quality evals cover:

- Lean MVP planning.
- Regulated or sensitive-data planning without compliance overclaiming.
- Offline-first field workflows.
- Over-engineering resistance for tiny internal tools.
- Personal, organization, project, and workspace context alignment.
