# Architecture Plan: Lightweight Grant Management Portal

## Executive Summary

Build a low-operational-burden TypeScript application that uses the organization's existing Azure AD, GitHub Actions, PostgreSQL, and documentation conventions. Avoid new vendors for the first release because the solo maintainer, eight-week deadline, and slow procurement process make boring, debuggable choices more valuable than novelty.

## Inputs Reviewed

- Personal context: solo maintainer for six months; prefers boring, debuggable tools.
- Organization context: Microsoft 365, Azure AD, GitHub Actions, PostgreSQL; slow procurement for new vendors.
- Project context: eight-week first release, 12 internal reviewers, about 200 applicants.
- Workspace context: adjacent TypeScript tools, docs under `docs/`, downstream agents should turn the plan into tasks.

## Assumptions And Non-Goals

| Type | Statement | Impact If Wrong |
| --- | --- | --- |
| Assumption | Applicant volume stays near 200 for the first release. | Higher volume may change file upload, email, and reporting design. |
| Assumption | Azure AD can cover internal reviewer authentication. | If external applicants need AD accounts, auth design must change. |
| Non-goal | A custom workflow engine is out of scope for the first release. | Approval flow should be implemented directly and refactored later if needed. |

## Context Alignment

| Context Dimension | Evidence Reviewed | Architecture Impact | Assumptions / Open Questions |
| --- | --- | --- | --- |
| Personal | Solo maintainer, boring/debuggable preference. | Choose familiar, minimal moving parts and strong docs. | Confirm preferred TypeScript framework. |
| Organization | Azure AD, GitHub Actions, PostgreSQL, slow procurement. | Reuse existing identity, CI, and database; avoid new vendors. | Confirm approved hosting target. |
| Project | Eight weeks, 12 reviewers, 200 applicants. | Single deployable, straightforward review workflow, relational model. | Confirm applicant authentication and file needs. |
| Workspace | TypeScript adjacency, `docs/`, downstream task agents. | Use TypeScript conventions, save architecture docs under `docs/architecture/`, include explicit handoff. | Inspect repo package manager before implementation. |

## Architecture Drivers

| Priority | Driver | Why It Matters | Architectural Response |
| --- | --- | --- | --- |
| 1 | Maintainability | One maintainer must operate the system. | Minimal services, clear logs, simple deployment. |
| 2 | Organization fit | Existing standards reduce approval friction. | Azure AD, GitHub Actions, PostgreSQL. |
| 3 | Deadline | Eight weeks to first release. | Build a narrow vertical slice before advanced workflow features. |

## Recommended Architecture

- Application: TypeScript web application with server-rendered or full-stack framework selected according to existing workspace conventions.
- Identity: Azure AD for internal reviewers and administrators; decide applicant auth separately.
- Database: PostgreSQL for applications, reviews, reviewer assignments, decisions, comments, and audit history.
- CI/CD: GitHub Actions using existing organization patterns.
- Documentation: save plan, context brief, and ADRs under `docs/architecture/`.

## Alternatives Considered

| Option | Fit | Trade-Off | Decision |
| --- | --- | --- | --- |
| Existing TypeScript stack + PostgreSQL | Strong context fit. | Must confirm hosting and applicant auth. | Choose. |
| New SaaS workflow platform | Could accelerate some workflow features. | Procurement friction and vendor learning curve. | Reject for first release. |
| Microservices | No scale or ownership driver. | Unnecessary operational burden. | Reject. |

## System Boundaries

- Applicant boundary: application form, submission confirmation, optional document upload.
- Reviewer boundary: review queue, scoring/decision, comments.
- Administration boundary: grant cycle setup, reviewer assignment, export.
- Identity boundary: Azure AD for internal roles; applicant identity remains open.
- Persistence boundary: PostgreSQL for workflow and audit records.

## Data Model

| Entity | Purpose | Key Relationships | Notes |
| --- | --- | --- | --- |
| GrantCycle | Defines a funding round. | Applications, reviewers. | Supports future cycles. |
| Applicant | Submitter profile. | Applications. | Confirm identity model. |
| Application | Grant request. | Applicant, cycle, reviews, attachments. | Core workflow entity. |
| ReviewAssignment | Reviewer ownership. | Application, reviewer. | Enables workload tracking. |
| Review | Scores, comments, recommendation. | Assignment, application. | Keep decision history. |
| AuditEvent | Change and access log. | Actor, resource. | Useful for nonprofit governance. |

## API And Integration Contracts

| Contract | Type | Producer | Consumer | Notes |
| --- | --- | --- | --- | --- |
| Submit application | Command | Applicant UI | Application module | Validate required fields. |
| Assign reviewer | Command | Admin UI | Review module | Internal role required. |
| Submit review | Command | Reviewer UI | Review module | Persist score and comments. |
| Export cycle report | Query/export | Admin UI | Reporting module | CSV or spreadsheet export. |
| Authenticate reviewer | Integration | Azure AD | Application | Internal users only. |

## Security, Privacy, And Compliance Notes

- Use Azure AD for internal reviewer/admin authentication.
- Enforce reviewer and admin authorization server-side.
- Avoid storing secrets in repository; follow workspace environment conventions.
- Record audit events for application status changes, review submissions, assignment changes, and exports.
- Confirm applicant data classification and retention before implementation.

## Deployment And Local Development

- Use existing TypeScript package manager after inspecting the workspace.
- Use GitHub Actions for lint, test, build, and deployment.
- Prefer one deployable and one PostgreSQL database for the first release.
- Keep docs in `docs/architecture/` so downstream agents can find them.

## Validation Strategy

| Layer | Coverage | Example Checks |
| --- | --- | --- |
| Unit | Application and review rules. | Required fields, score validation, status transitions. |
| Integration/contract | Database and API. | Submit application and review persists expected records. |
| End-to-end | Main vertical slice. | Applicant submits; reviewer reviews; admin exports. |
| Security/privacy | Internal access control. | Reviewer cannot view unassigned application if policy requires it. |
| Smoke/release | Deploy health. | Login, dashboard, submit review, export. |

## Decision Log

| ID | Decision | Status | Context / Drivers | Rationale | Consequences |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | Use existing TypeScript workspace conventions. | Proposed | Workspace context, solo maintainer. | Reduces cognitive load and downstream task friction. | Must inspect package manager before implementation. |
| ADR-002 | Use Azure AD for internal users. | Proposed | Organization standard. | Avoids new identity vendor and procurement delay. | Applicant auth remains open. |
| ADR-003 | Use PostgreSQL as primary store. | Proposed | Organization standard, relational workflow. | Fits applications, reviews, assignments, and audit history. | Reporting should start simple. |

## Handoff To Implementation Planning

- First vertical slice: applicant submits application, reviewer sees assigned application, reviewer submits review, admin exports results.
- Source directories expected: follow existing TypeScript workspace; docs under `docs/architecture/`.
- Context facts downstream agents must preserve: solo maintainer, avoid new vendors, use Azure AD/GitHub Actions/PostgreSQL where feasible, keep implementation boring and debuggable.
