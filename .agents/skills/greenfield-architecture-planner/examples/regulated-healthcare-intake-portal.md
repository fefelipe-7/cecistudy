# Architecture Plan: Healthcare Intake Portal

## Executive Summary

Use a cautious modular architecture with clear boundaries for patient submission, staff review, provider packet delivery, document storage, audit logging, and administration. Treat PHI, retention, audit, and hosting assumptions as open governance questions; the architecture can support compliance work, but it must not claim compliance until qualified stakeholders approve controls.

## Inputs Reviewed

- Product scope: patient intake forms and documents, staff review, provider packet delivery.
- Sensitive-data context: may contain PHI.
- Open questions: retention, audit requirements, deployment environment.

## Assumptions And Non-Goals

| Type | Statement | Impact If Wrong |
| --- | --- | --- |
| Assumption | PHI is in scope. | Drives identity, audit, encryption, retention, and access review. |
| Assumption | Staff and providers have different access needs. | Drives authorization model and packet delivery boundary. |
| Non-goal | Regulatory compliance certification is not asserted by this plan. | Requires legal/security review and control validation. |

## Context Alignment

| Context Dimension | Evidence Reviewed | Architecture Impact | Assumptions / Open Questions |
| --- | --- | --- | --- |
| Personal | Not specified. | Prefer explicit open questions and review checkpoints. | Confirm maintainer and support model. |
| Organization | PHI may be present; governance unsettled. | Require security review, auditability, and data lifecycle decisions before build. | Confirm hosting, retention, audit, identity provider, BAA/vendor requirements. |
| Project | Greenfield healthcare portal. | Start with clear modules and strict access boundaries. | Confirm first release workflow and document volume. |
| Workspace | Not specified. | Save architecture and ADRs under `docs/architecture/` if artifacts are requested. | Inspect repo conventions before writing. |

## Architecture Drivers

| Priority | Driver | Why It Matters | Architectural Response |
| --- | --- | --- | --- |
| 1 | Sensitive data | PHI handling changes every layer. | Encrypt data, minimize access, audit sensitive events. |
| 2 | Governance uncertainty | Unknown controls can invalidate architecture choices. | Record open questions and block implementation decisions where needed. |
| 3 | Workflow separation | Patients, staff, and providers have distinct permissions. | Separate modules and role-based policies. |

## Recommended Architecture

- Frontend: patient portal, staff review console, provider packet access flow.
- Backend: modular monolith or single service with strong module boundaries for intake, document management, review, packet delivery, identity/authorization, audit, and administration.
- Storage: relational database for workflow metadata; private object storage for documents; immutable audit log or append-only audit table.
- Deployment: use an approved environment capable of encryption, network controls, backups, logging, access review, and secrets management.

## System Boundaries

- Patient submission boundary: forms, uploads, status confirmation.
- Staff review boundary: queue, validation, packet approval.
- Provider packet boundary: secure access to approved packet only.
- Document boundary: object storage, malware scan if required, metadata in database.
- Audit boundary: record access, changes, approvals, delivery events.

## Data Model

| Entity | Purpose | Key Relationships | Notes |
| --- | --- | --- | --- |
| Patient | Intake subject. | Submissions, documents. | Minimize stored identifiers. |
| IntakeSubmission | Form workflow. | Patient, review, packet. | Track status and timestamps. |
| Document | Uploaded file metadata. | Submission, storage object. | Store content outside database. |
| Review | Staff decision. | Submission, reviewer. | Include reason and audit trail. |
| ProviderPacket | Approved package. | Submission, provider recipient. | Access should be time-bound if required. |
| UserRole | Access policy subject. | User, permission. | Support least privilege. |
| AuditEvent | Sensitive action log. | Actor, resource, event type. | Retention must be confirmed. |

## Security, Privacy, And Compliance Notes

- Identity: integrate approved identity provider before implementation.
- Authorization: role-based access with server-side enforcement for patient, staff, provider, and admin roles.
- Data protection: encrypt data in transit and at rest; isolate document storage; avoid secrets in code.
- Audit: record submission access, document view/download, review decision, packet delivery, and admin changes.
- Retention: unresolved; implementation should not proceed without retention and deletion requirements.
- Compliance: architecture supports control implementation but does not assert HIPAA or other compliance.

## Validation Strategy

| Layer | Coverage | Example Checks |
| --- | --- | --- |
| Unit | Authorization and workflow rules. | Staff cannot access unrelated submissions. |
| Integration/contract | APIs and storage. | Document metadata and object storage stay consistent. |
| End-to-end | Patient to review to provider packet. | Approved packet contains expected documents only. |
| Security/privacy | Access controls and audit. | Unauthorized document access is denied and logged. |
| Data lifecycle | Retention and deletion. | Deletion follows approved policy after it exists. |

## Decision Log

| ID | Decision | Status | Context / Drivers | Rationale | Consequences |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | Treat PHI as in scope until ruled out. | Proposed | Organization governance uncertainty, sensitive data. | Safer default for architecture. | Requires security and compliance review before build. |
| ADR-002 | Store documents in private object storage with metadata in relational DB. | Proposed | Large documents, audit, workflow metadata. | Separates binary storage from transactional workflow. | Requires object access policy and retention design. |

## Risks And Open Questions

| Risk / Question | Owner | Impact | Resolution Needed By |
| --- | --- | --- | --- |
| Required compliance framework and hosting controls. | Security/legal. | Can change deployment and vendor choices. | Before implementation. |
| Retention and deletion policy. | Product/legal. | Affects data model and jobs. | Before schema finalization. |
| Audit event requirements. | Compliance/security. | Affects storage and reporting. | Before implementation. |

## Handoff To Implementation Planning

- First vertical slice: patient submits intake form and document; staff reviews; audit events are recorded.
- Preserve context: do not claim compliance; confirm identity, retention, audit, and hosting requirements before build.
- Required tests: authorization, audit, document access, workflow, data lifecycle, e2e.
