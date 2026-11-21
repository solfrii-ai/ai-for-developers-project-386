# Календарь звонков


[![hexlet-check](https://github.com/solfrii-ai/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/solfrii-ai/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- GitHub Actions
- OpenCode
- mise и jactionlint

## Установка

```bash
git clone https://github.com/solfrii-ai/ai-for-developers-project-386.git
cd ai-for-developers-project-386
mise install
```

## Проверка workflow

```bash
mise run check
```

Команда запускает `jactionlint` для workflow OpenCode (`opencode.yml` и `opencode-review.yml`) и их проверки. Та же проверка выполняется в CI для push в `main` и pull request.

## OpenCode в issue и pull request

Участники с ролями `OWNER`, `MEMBER` или `COLLABORATOR` могут запустить агента комментарием `/opencode <задача>`. Для работы workflow в репозитории должен быть настроен GitHub App `opencode-agent` и Actions-секрет `OPENCODE_API_KEY`; его значение не требуется для локальной проверки workflow.

Workflow `opencode-review.yml` автоматически запускается при открытии и обновлении pull request. Для публикации review comments он использует `GITHUB_TOKEN` с правом `pull-requests: write` и `use_github_token: true`. Для PR, созданных ботом `opencode-agent[bot]`, в шаге переопределяется `GITHUB_ACTOR` на владельца репозитория, чтобы обойти проверку прав коллабораторов в action `v1.19.6`.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
