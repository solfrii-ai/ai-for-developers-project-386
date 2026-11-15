# Интеграция OpenCode agent через GitHub Actions

**Статус:** proposed

## Контекст и мотивация

Нужно запускать OpenCode из issue и pull request без локальной настройки, сохраняя контроль над кодом, секретами и
правами доступа.

## Решение

- Агент запускается командами `/oc` и `/opencode` только от `OWNER`, `MEMBER` и `COLLABORATOR`.
- Используются OIDC и GitHub App `opencode-agent`. `GITHUB_TOKEN` получает только `contents: read` и `id-token: write`;
  режим `use_github_token: true` отклонён, поскольку для полного сценария потребовал бы широких прав на запись.
- API-ключ передаётся через секрет, публикация сессий отключена, код PR через checkout не выполняется.
- Actions закреплены полными commit SHA; timeout и concurrency по issue/PR ограничивают ресурсы и конкурирующие запуски.
- Workflow проверяются командой `mise run check`, которая запускает `jactionlint` локально и в CI.

## Исключение `dangerous-triggers`

`issue_comment` является обязательным интерфейсом агента, но `jactionlint` сообщает о риске: workflow default branch
получает `id-token: write` и доступ к `OPENCODE_API_KEY`. Ограничение доверенных ролей снижает риск, но не устраняет
prompt injection или компрометацию доверенной учётной записи.

Поэтому допускается одно исключение правила `dangerous-triggers` только непосредственно над `issue_comment` в
`.github/workflows/opencode.yml`; глобальные подавления запрещены. Исключение пересмотреть до **2027-02-15**, а также
при изменении триггеров или схемы аутентификации.

## Последствия

Права GitHub App управляются отдельно от workflow. Остальные диагностики корректности и безопасности остаются активными.
