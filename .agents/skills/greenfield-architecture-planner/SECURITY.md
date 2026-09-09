# Security Policy

## Scope

This repository contains an AgentSkill: instructions, documentation, and evaluation prompts. It does not ship application runtime code, credentials, network services, or deployment automation.

Security issues in scope include:

- Prompt-injection patterns that would cause the skill to ignore user constraints or exfiltrate data.
- Instructions that encourage unsafe handling of secrets, sensitive data, compliance claims, or access controls.
- Malicious or surprising files added to the skill package.
- Documentation that would lead users to publish confidential architecture details.

## Reporting

If this repository is public, report security concerns using the repository owner's preferred private disclosure channel. If none is listed, open an issue with a minimal description and avoid posting secrets, exploit details, or sensitive customer information.

## Handling Sensitive Inputs

Users may provide product specs that include confidential business, security, or compliance details. The skill should:

- Treat sensitive inputs as task-local unless the user explicitly requests a saved artifact.
- Avoid persisting secrets or credentials.
- Label compliance and security assumptions clearly.
- Recommend review by qualified stakeholders for regulated domains.
