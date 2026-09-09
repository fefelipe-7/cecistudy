# Architecture Quality Rubric

Use this reference when a greenfield architecture has meaningful trade-offs, high risk, or ambiguous constraints. It is a review aid, not a second output template.

## Decision Quality

Score the proposed architecture against these questions before finalizing:

| Dimension | Strong Plan | Warning Sign |
| --- | --- | --- |
| Product fit | Architecture supports the MVP and first vertical slice directly. | Design optimizes for speculative future features. |
| Context fit | Decisions reflect personal working style, organization standards, project realities, and workspace tooling. | The plan recommends generic best practices that ignore the user, team, governance, or repository environment. |
| Simplicity | Few deployables, clear boundaries, low operational burden. | Multiple services, queues, caches, or platforms without a concrete driver. |
| Evolvability | Modules and contracts can change independently where change is likely. | Initial shortcuts make likely future changes expensive or risky. |
| Data integrity | Source of truth, ownership, lifecycle, retention, and migrations are explicit. | Entities, ownership, or consistency rules are vague. |
| Security and privacy | Identity, authorization, secrets, auditability, and sensitive-data handling are tied to the domain. | Generic "secure by default" language without concrete controls. |
| Operability | Logging, metrics, tracing, backups, rollout, rollback, and support workflows are right-sized. | Production support depends on manual database inspection or ad hoc logs. |
| Validation | Test layers map to actual risks and acceptance criteria. | Test strategy is a generic list not connected to architecture decisions. |
| Delivery | Team skills, timeline, deployment target, and maintenance burden are considered. | Plan assumes expertise, budget, or platform maturity the team does not have. |

## Common Decision Heuristics

### Context Alignment Before Stack Selection

Identify context before choosing the architecture:

- Personal context: the user's goals, experience, preferred working style, available time, maintenance tolerance, and collaboration needs.
- Organization context: approved technologies, security and compliance expectations, ownership model, support process, governance, procurement, and platform standards.
- Project context: maturity, funding, deadlines, team size, risk appetite, likely change rate, success metrics, and stakeholder expectations.
- Workspace context: existing repo conventions, package managers, CI/CD, deployment environments, docs style, local tooling, secrets handling, and downstream agent skills.

Prefer architecture that fits this context over architecture that is theoretically elegant but hard for the user or organization to operate. When context is missing, label assumptions and ask only the questions that materially affect the recommendation.

### Modular Monolith vs. Services

Default to a modular monolith or single deployable when:

- The team is small or early in product discovery.
- Domain boundaries are still changing.
- Independent deployment or scaling is not yet needed.
- Operational maturity is limited.

Consider services when:

- Teams own clearly independent domains.
- Regulatory, data-residency, or security boundaries require separation.
- One capability has materially different scale, availability, or release cadence.
- Integration needs require independently deployable adapters.

### Synchronous APIs vs. Asynchronous Work

Use synchronous APIs for user-visible commands and queries that need immediate feedback.

Use asynchronous work for:

- Long-running jobs.
- Retries around unreliable integrations.
- Notifications, exports, imports, and batch processing.
- Workflows where eventual consistency is acceptable and useful.

Do not introduce event streaming when a simple queue or scheduled job is enough.

### Relational vs. Non-Relational Storage

Favor relational storage for:

- Transactions, permissions, reporting, and business entities with relationships.
- Data that needs strong integrity and migrations.

Consider specialized storage when:

- Search relevance, graph traversal, time-series metrics, document flexibility, or append-only events are primary product needs.
- A secondary index or projection is clearly simpler than overloading the primary database.

### Frontend Architecture

Tie frontend choices to workflows:

- Complex forms need validation strategy, draft state, error recovery, and accessibility treatment.
- Authorization-sensitive screens need both server-side enforcement and UI-level affordances.
- Realtime interfaces need connection state, conflict handling, stale data behavior, and fallbacks.
- Offline-first interfaces need local persistence, synchronization, conflict resolution, and user-visible sync status.

## Stop And Clarify

Ask targeted questions before recommending the architecture when any of these are unknown and material:

- Sensitive or regulated data is involved, but classification and retention are unclear.
- Money movement, safety, health, legal, or employment decisions are core workflows.
- The user asks for a specific compliance outcome.
- Availability, latency, offline, or data-loss tolerance could change the topology.
- Required vendors, identity providers, or deployment environments are not known.
- The requested stack conflicts with team skills or enterprise standards.
- Personal, organization, project, or workspace context is likely to change the stack, topology, governance model, or delivery path.

## Final Review Checklist

- The recommendation is traceable to the top architecture drivers.
- The recommendation explicitly reflects the user's personal context, organization standards, project realities, and workspace constraints.
- The plan distinguishes current MVP decisions from later evolution paths.
- Every added infrastructure component has a job.
- The plan includes at least one implementation-ready vertical slice.
- Open questions are specific enough for a product owner, architect, or security stakeholder to answer.
