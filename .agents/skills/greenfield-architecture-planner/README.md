# Greenfield Architecture Planner

[![Validate Skill](https://github.com/jovd83/greenfield-architecture-planner/actions/workflows/validate.yml/badge.svg)](https://github.com/jovd83/greenfield-architecture-planner/actions/workflows/validate.yml)
[![version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)
[![Agent Skill](https://img.shields.io/badge/Agent%20Skill-SKILL.md-0a7ea4)](SKILL.md)
[![status](https://img.shields.io/badge/status-active-2ea44f)](SKILL.md)
[![category](https://img.shields.io/badge/category-architecture-0a7ea4)](SKILL.md)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/jovd83)

`greenfield-architecture-planner` is an AgentSkill for planning the architecture of a brand-new software product before repository bootstrap or implementation.

It turns product specs, acceptance criteria, project principles, constraints, and stack preferences into a reviewable architecture plan with decisions, trade-offs, risks, and an implementation handoff.

## What This Skill Does

The skill produces:

- Architecture drivers and MVP boundary.
- Personal, organization, project, and workspace context alignment.
- Stack and deployment recommendations.
- System, module, service, data, API, and UI boundaries.
- Security, privacy, accessibility, observability, and operations considerations.
- Validation strategy by test layer.
- ADR-style decision log.
- Handoff notes for implementation planning.

## When To Use It

Use this skill when you are starting a new product, platform, service, application, internal tool, or prototype and need to make confident initial technical decisions before writing code.

Good trigger prompts:

```text
Plan the architecture for this new customer-support dashboard. We have product specs,
acceptance criteria, and a preference for Angular plus Spring Boot.
```

```text
Before we bootstrap the repo, help us choose the architecture, data model, API
boundaries, deployment shape, and validation strategy for this new internal tool.
```

```text
We are building an offline-first inspection app with photos, sync conflicts, and
role-based review. Create the architecture plan and ADRs.
```

Do not use this skill to write application code, scaffold repositories, produce full backlogs, or generate complete OpenAPI / AsyncAPI / infrastructure-as-code files.

## Install

Install from GitHub with `npx skills`:

```bash
npx skills install jovd83/greenfield-architecture-planner
```

For older Skills CLI versions that use `add`:

```bash
npx skills add https://github.com/jovd83/greenfield-architecture-planner --skill greenfield-architecture-planner
```

You can also copy this folder into any Agent Skills-compatible skills directory:

```text
~/.codex/skills/greenfield-architecture-planner
~/.agents/skills/greenfield-architecture-planner
```

The skill follows the Agent Skills `SKILL.md` format: a folder with `SKILL.md` frontmatter and Markdown instructions, plus optional `references/`, `templates/`, `examples/`, and `evals/` files.

## Usage

```text
Use $greenfield-architecture-planner to plan the architecture for this new project.
```

```text
Use $greenfield-architecture-planner to select a stack, define module boundaries,
and produce ADRs before we start the backlog.
```

## Repository Layout

```text
.
|-- SKILL.md                                  # Skill metadata and primary workflow
|-- references/
|   `-- architecture-quality-rubric.md        # Optional rubric for complex decisions
|-- templates/
|   |-- architecture-plan.md                  # Reusable architecture plan template
|   `-- context-brief.md                      # Context capture template
|-- examples/
|   |-- lean-customer-support-dashboard.md
|   |-- regulated-healthcare-intake-portal.md
|   `-- context-aligned-grant-portal.md
|-- evals/
|   |-- evals.json                            # Output-quality evaluation prompts
|   `-- trigger-evals.json                    # Description trigger checks
|-- docs/
|   `-- evaluation-results.md                 # Current eval readiness and gaps
|-- .github/
|   `-- workflows/
|       `-- validate.yml                      # Skill validation CI
|-- CONTRIBUTING.md
|-- CHANGELOG.md
|-- RELEASE.md
|-- SECURITY.md
|-- LICENSE
`-- README.md
```

## Output Contract

The main artifact is an architecture plan with this shape:

```text
Architecture Plan
Inputs Reviewed
Assumptions And Non-Goals
Context Alignment
Architecture Drivers
Recommended Architecture
Alternatives Considered
System Boundaries
Data Model
API And Integration Contracts
UI Architecture
Security, Privacy, And Compliance Notes
Accessibility And UX Constraints
Observability And Operations
Deployment And Local Development
Validation Strategy
Decision Log
Risks And Open Questions
Handoff To Implementation Planning
```

When file output is requested and no path is supplied, the skill prefers:

```text
docs/architecture/architecture-plan.md
docs/architecture/adr-log.md
```

The bundled templates in `templates/` provide the recommended structure for saved architecture plans and reusable context briefs.

## Memory Model

The skill uses explicit, auditable memory boundaries:

- Runtime memory: assumptions, context clues, and working notes for the current conversation only.
- Project-local memory: generated architecture plans, context briefs, and ADR logs saved in the user's project when requested.
- Shared memory: out of scope. Stable, reusable organization-level standards or personal preferences should be promoted only through an external shared-memory skill or knowledge-management process.

No runtime assumption is automatically persisted, and no project-specific decision is automatically promoted to shared memory.

## Optional Integrations

These are conceptual integration points, not bundled dependencies:

- OpenAPI or AsyncAPI generation after API boundaries are accepted.
- Backlog or implementation-task planning after the architecture handoff is accepted.
- Project bootstrapping after stack, source layout, and first vertical slice are confirmed.
- Shared-memory capture for organization-wide architecture principles, when explicitly requested.

Keeping these concerns separate prevents the architecture skill from becoming a hidden implementation framework.

## Evaluation Strategy

`evals/evals.json` contains realistic prompts with expected outputs and expectations. `evals/trigger-evals.json` contains should-trigger and should-not-trigger queries for description tuning. Together they check whether the skill:

- Right-sizes architecture to product stage and constraints.
- Aligns recommendations with personal, organization, project, and workspace context.
- Avoids unnecessary distributed systems.
- Handles regulated or sensitive-data contexts without overclaiming compliance.
- Produces usable boundaries, data model, contract outline, validation strategy, ADRs, and handoff.
- Flags assumptions and open questions instead of inventing requirements.

Recommended validation loop:

1. Run each eval with this skill and with a baseline or previous version.
2. Grade expectations against the generated outputs.
3. Review outputs qualitatively for clarity, usefulness, and over-engineering.
4. Revise the skill only when the change generalizes beyond a single test case.

See `docs/evaluation-results.md` for the current eval-readiness summary and remaining benchmark gaps.

## Packaging

See `RELEASE.md` for release validation and packaging commands. When Python packaging is unavailable, the release guide includes a PowerShell archive fallback.

## Development Notes

- Keep `SKILL.md` focused and readable. Move detailed heuristics to `references/`.
- Keep output examples in `examples/` aligned with the template sections.
- Prefer examples and decision rules that explain why, not rigid instructions that only fit one prompt.
- Add evals with clear expectations for new behavior before expanding the workflow.
- Do not add scripts unless a repeated deterministic task emerges from eval runs.
- Keep cross-agent memory, implementation scaffolding, and backlog generation outside this repository.

## License

MIT. See [LICENSE](LICENSE).
