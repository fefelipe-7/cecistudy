# Release Guide

Use this guide to prepare a publishable AgentSkill release.

## Pre-Release Checklist

1. Confirm `SKILL.md` frontmatter:
   - `name` matches the folder name.
   - `description` clearly states when to use the skill.
   - Frontmatter stays compact enough for preloading.
2. Validate eval JSON:

   ```powershell
   Get-Content -Raw evals\evals.json | ConvertFrom-Json | Out-Null
   Get-Content -Raw evals\trigger-evals.json | ConvertFrom-Json | Out-Null
   ```

3. If available, run Agent Skills validation:

   ```bash
   skills-ref validate .
   ```

4. Run or refresh the `skill-creator` benchmark workspace.
5. Update `CHANGELOG.md`.

## Package With skill-creator

When Python is available:

```bash
python C:/Users/jochi/.agents/skills/skill-creator/scripts/package_skill.py .
```

The expected output is a `.skill` archive for installation in compatible agent clients.

## Package With PowerShell

If Python packaging is unavailable, create a reviewable archive from the repository contents:

```powershell
$version = "1.0.0"
$out = "dist/greenfield-architecture-planner-$version.skill"
New-Item -ItemType Directory -Force dist | Out-Null
Compress-Archive -Path SKILL.md,README.md,LICENSE,CHANGELOG.md,CONTRIBUTING.md,SECURITY.md,RELEASE.md,evals,references,templates,examples -DestinationPath $out -Force
```

Verify the archive contains `SKILL.md` at the package root.

## Release Notes Template

```markdown
## greenfield-architecture-planner <version>

### Highlights

- <major improvement>

### Validation

- <eval pass rate or validation evidence>

### Known Limitations

- <remaining limitation>
```
