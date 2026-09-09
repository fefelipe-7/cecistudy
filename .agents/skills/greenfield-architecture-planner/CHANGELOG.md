# Changelog

All notable changes to this AgentSkill are documented here.

## 1.0.0 - 2026-05-25

### Changed

- Promoted the skill from draft to active.
- Rewrote the core workflow around intake, architecture drivers, decision framing, memory boundaries, artifacts, and handoff quality.
- Added context alignment as a first-class planning concern across personal, organization, project, and workspace dimensions.
- Tightened context alignment with a required context matrix, precedence rules, workspace inspection guidance, and context-aware ADR format.
- Added a reusable architecture quality rubric for complex trade-offs.
- Expanded evaluation coverage with realistic prompts and expectations.
- Rebuilt README with badges, What This Skill Does, When To Use It, and `npx skills install` instructions.

### Added

- Reusable architecture plan and context brief templates.
- Example architecture plans for common usage modes.
- Evaluation guide and release packaging guidance.
- Static evaluation-results document capturing current readiness and known benchmark gaps.
- `references/architecture-quality-rubric.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `.gitignore`
- GitHub Actions workflow `.github/workflows/validate.yml` for required-file and frontmatter validation on push and pull request.

## 0.1.0 - 2026-05-24

### Added

- Initial skill package with `SKILL.md`, README, license, and one eval prompt.
