# Интеграция OpenCode agent через GitHub Actions

**Статус:** accepted

## Контекст и мотивация

Нужно запускать OpenCode из issue и pull request без локальной настройки, сохраняя контроль над кодом, секретами и
правами доступа.

## Решение

- Агент запускается командами `/oc` и `/opencode` только от `OWNER`, `MEMBER` и `COLLABORATOR`.
- Workflow `opencode.yml` использует OIDC и GitHub App `opencode-agent`. `GITHUB_TOKEN` получает только
  `contents: read` и `id-token: write`; режим `use_github_token: true` отклонён, поскольку для полного сценария
  потребовал бы широких прав на запись.
- Workflow `opencode-review.yml` запускается на `pull_request` (`opened`, `synchronize`, `reopened`,
  `ready_for_review`) от имени любого актора, включая бота `opencode-agent[bot]`. Он использует `GITHUB_TOKEN` с
  правами `contents: read` и `pull-requests: write`, а также `use_github_token: true`. Для PR от людей это позволяет
  публиковать review comments. Для PR, автором которых является `opencode-agent[bot]`, action `v1.19.6` всё равно
  проверяет права актора через API коллабораторов; бота нельзя добавить вручную как collaborator, поэтому такие run'ы
  завершаются ошибкой прав. Это известное ограничение текущей версии action.
- API-ключ передаётся через секрет, публикация сессий отключена, код PR через checkout не выполняется.
- Actions закреплены полными commit SHA; timeout и concurrency по issue/PR ограничивают ресурсы и конкурирующие запуски.
- Workflow проверяются командой `mise run check`, которая запускает `jactionlint` локально и в CI.

## Model choice

Оба OpenCode workflow (`opencode.yml` и `opencode-review.yml`) используют одну модель: `opencode/deepseek-v4.1-flash`.

## OpenCode GitHub Action

- Репозиторий action: https://github.com/anomalyco/opencode
- Используемая закреплённая версия: `anomalyco/opencode/github@f4e363c8295fa90a03dddc451882fffe8fbce357` (`v1.19.6`).
- Код action для этой версии: https://github.com/anomalyco/opencode/blob/f4e363c8295fa90a03dddc451882fffe8fbce357/github/index.ts.
  Именно там находятся логика `assertPermissions`, `getAccessToken` и выбор между `GITHUB_TOKEN` и OIDC.
- В `v1.19.6` проверка прав актора выполняется через API коллабораторов репозитория, из-за чего PR, созданные
  `opencode-agent[bot]`, не проходят автоматический review.

## Исключение `dangerous-triggers`

`issue_comment` является обязательным интерфейсом агента, но `jactionlint` сообщает о риске: workflow default branch
получает `id-token: write` и доступ к `OPENCODE_API_KEY`. Ограничение доверенных ролей снижает риск, но не устраняет
prompt injection или компрометацию доверенной учётной записи.

Поэтому допускается одно исключение правила `dangerous-triggers` только непосредственно над `issue_comment` в
`.github/workflows/opencode.yml`; глобальные подавления запрещены. Исключение пересмотреть до **2027-02-15**, а также
при изменении триггеров или схемы аутентификации.

## Последствия

Права GitHub App управляются отдельно от workflow. Workflow `opencode.yml` остаётся на OIDC + GitHub App,
а `opencode-review.yml` использует ограниченный `GITHUB_TOKEN` для публикации review comments. Оба workflow
по-прежнему используют одну модель, закрепленные версии action, timeout и concurrency. Остальные диагностики
корректности и безопасности остаются активными.
