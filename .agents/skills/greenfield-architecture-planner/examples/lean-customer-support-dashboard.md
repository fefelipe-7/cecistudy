# Architecture Plan: Customer Support Dashboard MVP

## Executive Summary

Build a lean Angular + Spring Boot modular monolith backed by PostgreSQL. This fits the four-person team, keeps the first release operable, and still creates clear domain boundaries for tickets, assignments, replies, notes, SLA status, and reporting.

## Inputs Reviewed

- Product scope: ticket intake, assignment, SLA status, canned replies, internal notes, manager reporting.
- Stack preference: Angular and Spring Boot.
- Project context: four-person team, lean first release, MVP before platform expansion.

## Assumptions And Non-Goals

| Type | Statement | Impact If Wrong |
| --- | --- | --- |
| Assumption | Ticket volume is moderate and does not require independent service scaling at launch. | High volume may justify async ingestion or reporting read models. |
| Assumption | Manager reporting can start with operational reports from the primary database. | Heavy analytics may need a warehouse or reporting replica later. |
| Non-goal | Omnichannel routing and AI-assisted support are out of MVP scope. | Keep the first slice focused and testable. |

## Context Alignment

| Context Dimension | Evidence Reviewed | Architecture Impact | Assumptions / Open Questions |
| --- | --- | --- | --- |
| Personal | Not specified. | Keep plan explicit and easy for downstream task planning. | Confirm maintainer preferences. |
| Organization | Angular and Spring Boot preferred. | Use familiar stack unless constraints conflict. | Confirm identity provider and deployment target. |
| Project | Four-person team, lean MVP. | Use a modular monolith, avoid microservices and event streaming. | Confirm target SLA and reporting freshness. |
| Workspace | Not specified. | Recommend conventional `frontend/`, `backend/`, and `docs/architecture/` layout. | Inspect repo before saving files. |

## Architecture Drivers

| Priority | Driver | Why It Matters | Architectural Response |
| --- | --- | --- | --- |
| 1 | Delivery speed | MVP should ship without platform overhead. | Single backend deployable with clear modules. |
| 2 | Operational simplicity | Small team must support production. | PostgreSQL, simple CI/CD, structured logs, smoke tests. |
| 3 | Workflow correctness | Ticket assignment and SLA state must be reliable. | Domain services and transaction boundaries around ticket mutations. |

## Recommended Architecture

- Frontend: Angular application with route groups for ticket queue, ticket detail, reply templates, and manager reports.
- Backend: Spring Boot modular monolith with modules for ticket intake, assignment, collaboration, SLA, templates, reporting, and administration.
- Persistence: PostgreSQL as source of truth.
- Integrations: email or form intake as an adapter module, not a separate service at MVP stage.
- Reporting: start with indexed relational queries and scheduled summary jobs only if needed.

## Alternatives Considered

| Option | Fit | Trade-Off | Decision |
| --- | --- | --- | --- |
| Modular monolith | Best fit for small team and MVP. | Requires discipline around module boundaries. | Choose. |
| Microservices | Useful for independently owned domains later. | Too much deployment and observability overhead now. | Reject for MVP. |
| Separate reporting store | Useful for heavy analytics. | Premature until report load is known. | Defer. |

## System Boundaries

- Frontend/interface layer: Angular screens, route guards, form validation, API clients.
- Backend/application layer: Spring Boot controllers, application services, domain modules.
- Persistence layer: PostgreSQL tables for tickets, users, assignments, notes, SLA policy, reply templates.
- Integration boundaries: ticket intake adapter and notification adapter.
- Background work: SLA recalculation and notification retries if synchronous handling becomes unreliable.

## Data Model

| Entity | Purpose | Key Relationships | Notes |
| --- | --- | --- | --- |
| Ticket | Support work item. | Customer, assignment, notes, SLA state. | Source of workflow state. |
| Customer | Person or account needing support. | Tickets. | May later sync from CRM. |
| Agent | Support user. | Assignments, notes. | Map to identity provider users. |
| Assignment | Current or historical ownership. | Ticket, agent. | Keep history for audit. |
| InternalNote | Collaboration record. | Ticket, author. | Internal visibility only. |
| ReplyTemplate | Reusable canned response. | Created/updated by staff. | Version later if audit requires. |
| SLAStatus | Computed or stored SLA state. | Ticket, policy. | Keep calculation transparent. |

## API And Integration Contracts

| Contract | Type | Producer | Consumer | Notes |
| --- | --- | --- | --- | --- |
| Create ticket | Command | Angular/intake adapter | Ticket module | Validate customer and initial content. |
| Assign ticket | Command | Angular | Assignment module | Enforce role and queue rules. |
| Add note | Command | Angular | Collaboration module | Internal-only note. |
| Update SLA status | Command/job | SLA module | Ticket module | Can start synchronous, move to job if needed. |
| Ticket report | Query | Reporting module | Angular | Filter by queue, SLA, agent, date. |

## Validation Strategy

| Layer | Coverage | Example Checks |
| --- | --- | --- |
| Unit | Domain rules. | Assignment eligibility, SLA calculations. |
| Integration/contract | API and persistence. | Ticket creation persists expected state. |
| End-to-end | Main workflows. | Intake to assignment to reply. |
| Accessibility | Angular UI. | Keyboard navigation and form errors. |
| Smoke/release | Deployment health. | Login, ticket list, create ticket. |

## Decision Log

| ID | Decision | Status | Context / Drivers | Rationale | Consequences |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | Use Angular + Spring Boot modular monolith. | Proposed | Team preference, lean MVP, small team. | Matches known stack and limits operational burden. | Module boundaries must be reviewed during implementation. |
| ADR-002 | Use PostgreSQL as primary store. | Proposed | Transactional workflow and reporting needs. | Fits relational entities and simple operations. | Reporting may need a projection later. |

## Handoff To Implementation Planning

- First vertical slice: create ticket, assign to agent, add internal note, show SLA status.
- Source directories expected: `frontend/`, `backend/`, `docs/architecture/`.
- Test layers required: backend unit/integration, Angular component/e2e, smoke tests.
- Context facts downstream agents must preserve: keep MVP lean; do not introduce distributed topology without a concrete driver.
