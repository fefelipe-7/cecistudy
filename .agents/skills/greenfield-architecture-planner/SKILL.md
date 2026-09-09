---
name: greenfield-architecture-planner
description: Plan architecture for brand-new software products before bootstrap or implementation. Use when specs, acceptance criteria, personal/org/project/workspace context, constraints, stack preferences, or principles need decisions on stack, boundaries, data model, APIs, security, deployment, validation, ADRs, or handoff.
license: MIT
metadata:
  dispatcher-category: architecture
  dispatcher-layer: information
  dispatcher-lifecycle: active
  dispatcher-risk: medium
  dispatcher-writes-files: true
  dispatcher-capabilities: architecture-planning, context-alignment, stack-selection, adr, data-modeling, api-planning
  dispatcher-accepted-intents: plan_architecture, select_stack, prepare_handoff
  dispatcher-input-artifacts: spec, ac, context, constraints, stack
  dispatcher-output-artifacts: architecture_plan, adr_log, validation_plan, handoff
  dispatcher-stack-tags: architecture, greenfield, api, deployment
---

# Greenfield Architecture Planner

> Version: 1.0.0 | Status: active | License: MIT

Plan a right-sized architecture for a new software product before repository bootstrap or implementation. The output should help a team make confident initial technical decisions and give a downstream implementation planner enough structure to create executable work.

This skill is for architecture planning, not coding. It should turn product intent into explicit decisions, assumptions, trade-offs, risks, and a first vertical slice.

## Use This Skill When

- A user is starting a new product, platform, service, application, internal tool, or prototype.
- Product specs, user stories, acceptance criteria, constraints, or stack preferences exist and need technical shaping.
- The user asks for architecture, stack selection, module boundaries, service boundaries, data model, API outline, UI architecture, deployment shape, observability, security posture, ADRs, or validation strategy.
- Another planning skill needs an architecture handoff before backlog generation, bootstrapping, or implementation.

## Do Not Use This Skill For

- Implementing code, creating scaffolds, or installing dependencies. Hand off to a bootstrap or implementation skill.
- Producing full backlog packs or sprint plans. Hand off to a backlog or task-planning skill after the architecture plan is accepted.
- Auditing an existing production codebase. Use an audit or refactor skill instead.
- Creating detailed OpenAPI, AsyncAPI, database migration, infrastructure-as-code, or test files. Produce outlines and handoff notes unless the user explicitly invokes a specialist skill.

## Operating Principles

- Right-size the architecture to the product stage, team size, risk profile, likely change rate, and actual context of the people and workspace that will live with it.
- Prefer simple, observable, evolvable designs over speculative sophistication.
- Treat user constraints as first-class architecture drivers. If a preference conflicts with a requirement, name the conflict and recommend a path.
- Align decisions with personal, organization, project, and workspace context before optimizing for abstract best practices.
- Separate facts, assumptions, recommendations, alternatives, and open questions.
- Avoid version-specific claims unless verified from official or primary sources during the task.
- Do not invent requirements, scale numbers, compliance obligations, SLAs, or data-retention rules. Ask when those facts materially change the architecture.

## Intake

Read all available product and project inputs before recommending an architecture. Look for:

- Product goal, users, core workflows, and MVP boundary.
- Acceptance criteria and first release scope.
- Personal context: user goals, working style, skill level, time budget, maintenance tolerance, and collaboration preferences.
- Organization context: engineering standards, approved stacks, compliance expectations, governance, ownership model, procurement, support model, and platform constraints.
- Project context: maturity, deadlines, funding, team composition, expected change rate, risk appetite, and success metrics.
- Workspace context: existing repository layout, local tooling, package managers, CI/CD conventions, documentation style, deployment environments, secrets handling, and available skills or downstream agents.
- Project principles, engineering standards, budget, timeline, and team skills.
- Stack preferences, required vendors, deployment target, and integration constraints.
- Data classification, privacy expectations, audit needs, residency, retention, and regulatory context.
- Availability, latency, throughput, offline, realtime, accessibility, localization, and analytics needs.
- Existing systems, identity providers, APIs, events, files, imports, exports, and operational dependencies.

If critical information is missing, ask only the minimum questions needed to avoid a risky architecture decision. If the missing information is not blocking, proceed with explicit assumptions and mark the assumption as replaceable.

When workspace context matters, inspect available project-local files before making workspace-sensitive recommendations. Useful signals include README files, package manifests, build files, CI configuration, deployment docs, existing `docs/` structure, ADRs, environment examples, and repository conventions. Do not inspect unrelated private files outside the task workspace.

## Context Alignment

Architecture must fit the context that will operate it. Capture context explicitly using this matrix when enough information is available:

```markdown
| Context Dimension | Evidence Reviewed | Architecture Impact | Assumptions / Open Questions |
| --- | --- | --- | --- |
| Personal | <maintainer goals, skill level, workflow, time budget> | <how this changes the design> | <what remains unknown> |
| Organization | <standards, governance, vendors, compliance, support model> | <how this constrains choices> | <what must be confirmed> |
| Project | <timeline, maturity, team, funding, risk, success metrics> | <how this shapes scope and topology> | <what may change> |
| Workspace | <repo layout, tooling, CI/CD, docs, downstream agents> | <how this affects artifacts and handoff> | <what to inspect later> |
```

Context precedence:

- Organization security, compliance, data, and platform constraints override personal preference.
- Explicit project delivery constraints can justify temporary compromises, but record them as risks or ADR consequences.
- Workspace conventions should shape file locations, package manager choices, documentation style, and handoff details unless they conflict with stronger organization or project constraints.
- Personal preferences matter most when they affect maintainability, implementation speed, cognitive load, or long-term ownership.

## Workflow

1. Frame the problem.
   - Summarize the product, MVP boundary, first vertical slice, users, and most important constraints.
   - State assumptions and non-goals early so the plan can be reviewed.

2. Establish context alignment.
   - Identify personal, organization, project, and workspace context that should shape architecture decisions.
   - Separate explicit context from inferred context. Do not treat inferred preferences as durable facts.
   - Explain how the context changes the recommendation. If the technically fashionable choice conflicts with context, prefer the contextual fit and document the trade-off.
   - Use the context matrix for any plan where context materially affects stack, topology, vendors, delivery approach, or handoff.

3. Extract architecture drivers.
   - Identify the forces that should shape the design: delivery speed, simplicity, compliance, data sensitivity, integration complexity, offline mode, realtime needs, scale, team capability, cost, and operations.
   - Rank the top drivers instead of treating every concern as equal.

4. Choose the planning depth.
   - For small MVPs, favor a concise plan with a modular monolith or single deployable unless a driver requires more.
   - For enterprise or regulated systems, include stronger treatment of identity, auditability, data lifecycle, deployment environments, observability, incident response, and validation.

5. Consider alternatives only where there is a real decision.
   - Compare two or three viable options when trade-offs matter.
   - Skip performative alternatives that no reasonable team would choose.
   - Explain why the recommended option fits the current constraints and how it can evolve.

6. Define boundaries.
   - Identify the frontend/interface layer, backend/application layer, domain modules, persistence layer, integrations, asynchronous work, and operational boundaries.
   - Explain ownership and data flow across boundaries.

7. Define the data model.
   - Provide conceptual entities and relationships first.
   - Add implementation-level guidance only as far as needed for initial build decisions.
   - Call out lifecycle, retention, privacy, search, reporting, and migration implications when relevant.

8. Outline APIs and integrations.
   - Describe primary commands, queries, events, imports, exports, webhooks, and third-party dependencies.
   - Keep contracts at outline level unless the user asks for a full contract artifact.
   - Recommend a downstream OpenAPI or AsyncAPI skill when exact schemas are needed.

9. Shape the user interface architecture.
   - Define application shell, routes/views, state boundaries, form handling, authorization-aware UI, accessibility requirements, and client/server data-fetching patterns.
   - Keep UI decisions tied to workflows and acceptance criteria, not generic framework advice.

10. Address security, privacy, and compliance.
    - Cover identity, authorization, secrets, data protection, audit logging, abuse prevention, and secure defaults.
    - Do not claim compliance. Say what the architecture supports and what must be verified by qualified stakeholders.

11. Define deployment and operations.
    - Cover local development, environments, configuration, CI/CD expectations, observability, backups, release strategy, and rollback.
    - Prefer operational simplicity for early-stage projects.

12. Define validation strategy.
    - Map tests to risk: unit, integration, contract, end-to-end, accessibility, security, performance, data migration, and smoke tests.
    - Include validation commands only when the stack is known.

13. Produce a decision log and implementation handoff.
    - Capture major choices as ADR-style decisions with rationale and consequences.
    - End with a handoff section that another skill or engineer can use to create implementation tasks.

## Architecture Decision Defaults

Use these as defaults, not dogma:

- Start with a modular monolith or single deployable for MVPs unless independent scaling, ownership, compliance boundaries, or reliability needs justify services.
- Prefer a relational database for transactional business data with meaningful relationships unless document, graph, time-series, or event storage is clearly better.
- Add queues, event streams, caches, search indexes, and workflow engines when a concrete workflow requires them, not as default decoration.
- Favor managed platform capabilities when they reduce operational burden and do not create unacceptable lock-in.
- Keep contracts and boundaries stable enough to evolve into services later if needed.
- Prefer the simplest stack that satisfies the user's personal maintainability needs, organization standards, project constraints, and workspace conventions.

For complex trade-offs, consult `references/architecture-quality-rubric.md`.

For saved artifacts, prefer the reusable templates in `templates/architecture-plan.md` and `templates/context-brief.md` rather than inventing a new structure.

## Memory And Artifact Boundaries

- Runtime memory is the working context for the current conversation: assumptions, trade-offs, and draft decisions. Do not treat it as durable.
- Project or skill-local persistent memory should be explicit artifacts such as an architecture plan, ADR log, context brief, or validation plan saved in the user's repository when requested.
- Shared memory is out of scope for this skill. If the user wants reusable cross-agent architecture principles or organization-wide standards captured, hand off to an installed shared-memory skill or external knowledge-management workflow.
- Do not automatically promote runtime notes into project files, and do not promote project-specific decisions into shared memory without explicit user direction.

## File Output Rules

- Save files only when the user asks, when another skill in the chain requested artifacts, or when the current workspace clearly expects generated documentation.
- If the user requests files but gives no path, prefer `docs/architecture/architecture-plan.md` and `docs/architecture/adr-log.md`.
- When saving a plan, follow `templates/architecture-plan.md`. When context is complex or will be reused by downstream agents, also create or update a context brief based on `templates/context-brief.md`.
- Before overwriting existing architecture docs, read them and preserve useful user-authored content.
- Keep generated artifacts reviewable: clear headings, decision tables, assumptions, and open questions.

## Output Contract

Use this structure for the main architecture plan. Omit sections only when clearly irrelevant, and explain notable omissions.

```markdown
# Architecture Plan: <project-name>

## Executive Summary
## Inputs Reviewed
## Assumptions And Non-Goals
## Context Alignment
## Architecture Drivers
## Recommended Architecture
## Alternatives Considered
## System Boundaries
## Data Model
## API And Integration Contracts
## UI Architecture
## Security, Privacy, And Compliance Notes
## Accessibility And UX Constraints
## Observability And Operations
## Deployment And Local Development
## Validation Strategy
## Decision Log
## Risks And Open Questions
## Handoff To Implementation Planning
```

### Decision Log Format

```markdown
| ID | Decision | Status | Context / Drivers | Rationale | Consequences |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | Use <architecture or stack decision> | Proposed | <personal/org/project/workspace drivers> | <why it fits> | <trade-offs and follow-up work> |
```

### Handoff Requirements

The final handoff must include:

- Recommended stack, package manager, and runtime assumptions.
- Personal, organization, project, and workspace context that materially shaped the plan.
- Context facts and assumptions downstream agents must preserve.
- Expected source directories and major modules.
- Contracts, entities, and integrations to implement first.
- First vertical slice.
- Required test layers and initial validation commands when known.
- Open decisions that must be resolved before implementation.

## Quality Gate

Before finalizing, check that the plan:

- Ties recommendations to product drivers and constraints.
- Shows how personal, organization, project, and workspace context shaped the recommendation.
- Includes enough context evidence that a reviewer can tell whether the recommendation is contextual or generic.
- Avoids unnecessary distributed systems or vendor complexity.
- Names meaningful alternatives and trade-offs where decisions are uncertain.
- Covers security, privacy, accessibility, observability, operations, and validation at a level appropriate to risk.
- Contains enough implementation handoff detail for a task-planning skill or engineer to proceed.
- Clearly labels assumptions and open questions.

## Final Response

When responding to the user after completing the plan, include:

- Architecture plan path if a file was saved.
- Recommended architecture and stack in one or two sentences.
- Most important decisions and trade-offs.
- Unresolved questions that could change the design.
- Recommended next step or downstream skill, if useful.
