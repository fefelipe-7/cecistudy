# Architecture Plan: <project-name>

## Executive Summary

<State the recommended architecture, why it fits now, and the most important trade-off.>

## Inputs Reviewed

- Product scope:
- Acceptance criteria:
- Personal context:
- Organization context:
- Project context:
- Workspace context:
- Constraints and preferences:

## Assumptions And Non-Goals

| Type | Statement | Impact If Wrong |
| --- | --- | --- |
| Assumption | <What is assumed for this plan> | <How the architecture may change> |
| Non-goal | <What is deliberately out of scope> | <Why this is excluded now> |

## Context Alignment

| Context Dimension | Evidence Reviewed | Architecture Impact | Assumptions / Open Questions |
| --- | --- | --- | --- |
| Personal | <Maintainer goals, skill level, workflow, time budget> | <How this changes the design> | <What remains unknown> |
| Organization | <Standards, governance, vendors, compliance, support model> | <How this constrains choices> | <What must be confirmed> |
| Project | <Timeline, maturity, team, funding, risk, success metrics> | <How this shapes scope and topology> | <What may change> |
| Workspace | <Repo layout, tooling, CI/CD, docs, downstream agents> | <How this affects artifacts and handoff> | <What to inspect later> |

## Architecture Drivers

| Priority | Driver | Why It Matters | Architectural Response |
| --- | --- | --- | --- |
| 1 | <driver> | <impact> | <response> |

## Recommended Architecture

<Describe the deployable shape, stack, ownership model, and evolution path.>

## Alternatives Considered

| Option | Fit | Trade-Off | Decision |
| --- | --- | --- | --- |
| <option> | <where it works> | <cost or risk> | <choose/defer/reject> |

## System Boundaries

- Frontend/interface layer:
- Backend/application layer:
- Domain modules:
- Persistence layer:
- Integrations:
- Asynchronous/background work:
- Operations boundary:

## Data Model

| Entity | Purpose | Key Relationships | Notes |
| --- | --- | --- | --- |
| <entity> | <why it exists> | <relationships> | <lifecycle/privacy/reporting notes> |

## API And Integration Contracts

| Contract | Type | Producer | Consumer | Notes |
| --- | --- | --- | --- | --- |
| <contract> | <command/query/event/import/export> | <source> | <target> | <outline> |

## UI Architecture

- Application shell:
- Routes/views:
- State boundaries:
- Forms and validation:
- Authorization-aware UI:
- Accessibility constraints:

## Security, Privacy, And Compliance Notes

- Identity and authentication:
- Authorization model:
- Data protection:
- Secrets and configuration:
- Audit logging:
- Retention and deletion:
- Compliance review needs:

## Accessibility And UX Constraints

<Call out accessibility requirements, workflow ergonomics, localization, offline/realtime states, and user error recovery.>

## Observability And Operations

- Logs:
- Metrics:
- Tracing:
- Alerts:
- Backups:
- Release and rollback:
- Support workflow:

## Deployment And Local Development

- Environments:
- Runtime:
- Package manager:
- Configuration:
- CI/CD:
- Local development:

## Validation Strategy

| Layer | Coverage | Example Checks |
| --- | --- | --- |
| Unit | <scope> | <checks> |
| Integration/contract | <scope> | <checks> |
| End-to-end | <scope> | <checks> |
| Accessibility | <scope> | <checks> |
| Security/privacy | <scope> | <checks> |
| Smoke/release | <scope> | <checks> |

## Decision Log

| ID | Decision | Status | Context / Drivers | Rationale | Consequences |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | <decision> | Proposed | <personal/org/project/workspace drivers> | <why it fits> | <trade-offs and follow-up work> |

## Risks And Open Questions

| Risk / Question | Owner | Impact | Resolution Needed By |
| --- | --- | --- | --- |
| <risk or question> | <role> | <impact> | <date or milestone> |

## Handoff To Implementation Planning

- Recommended stack and package manager:
- Source directories expected:
- Major modules to create:
- Contracts to implement:
- Test layers required:
- First vertical slice:
- Validation commands when known:
- Context facts downstream agents must preserve:
