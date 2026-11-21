# AGENTS.md

## Product
- Build a simplified Cal.com-style service for scheduling and booking calls; do not target full Cal.com feature parity.

## Learning workflow
- This is an educational project. At every substantial step, stop before acting and explain why the step is needed and what it will accomplish; proceed only after the user's confirmation.

## Contributing
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) when contributing to this repository.

## Current state
- This is a greenfield repository with no application code or selected application toolchain.
- Run `mise install` to install workflow-checking tools and `mise run check` to lint the OpenCode workflows. No application install, development, build, typecheck, or test commands are defined yet.
- OpenCode runs from `/opencode` comments through `.github/workflows/opencode.yml`; its security exception is documented in `docs/adr/0001-opencode-via-github-actions.md`.
- When introducing the stack, document exact setup, environment variables, startup, and verification commands in `README.md`; update this file with non-obvious workflows.

## Hexlet checks
- Do not edit, delete, or rename `.github/workflows/hexlet-check.yml`, and do not rename the repository. The generated workflow runs Hexlet checks on every push using the `HEXLET_ID` secret.
- Hexlet tests become available as project steps are completed; there is no repository-local test suite yet.

## Agent skills

### Issue tracker

Issues are tracked in `solfrii-ai/ai-for-developers-project-386` using GitHub Issues and the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Domain docs use a single-context layout: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

### Research

Web research follows `docs/agents/research.md`. When dispatching a research subagent, pass that file in its prompt.
