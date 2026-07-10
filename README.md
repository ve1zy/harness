# OpenCode Harness

Готовая конфигурация для [opencode](https://opencode.ai) — агенты, скилы, хуки и dev-workflow.

## Что внутри

**Агенты** (`agents/`) — 15 специализированных агентов:
- Стек-специфичные: `react-ts`, `node-ts`, `python-fastapi`, `flutter`, `ios`, `android`, `terraform-yandex`
- Общие: `frontend`, `backend`, `mobile`, `devops`
- Dev-loop: `planner`, `reviewer`, `debugger`, `skeptic`

**Скилы** (`skills/`) — 15 скилов:
- Dev-workflow: `plan`, `build`, `review`, `debug`
- Контент: `anti-ai-slop-writing`, `design-process`
- Знание проекта: `memory-bank`, `memory-bank-defrag`
- Caveman-серия: `caveman`, `caveman-commit`, `caveman-compress`, `caveman-help`, `caveman-review`, `caveman-stats`, `cavecrew`

**Хуки** (`hooks/`) — `test-gate.sh`:
- Блокирует "done" если код редактировался, но тесты не запускались
- Автоопределение тестового фреймворка (npm test / pytest / go test / и т.д.)

**Конфигурация** — `settings.json`, `AGENTS.md`

## Установка

### Глобально (для всех проектов)

```bash
# Скопировать в глобальную директорию opencode
git clone https://github.com/ve1zy/harness
cp -r harness/* ~/.config/opencode/

# Убедиться что jq установлен
# macOS: brew install jq
# Linux: apt install jq / pacman -S jq
# Windows: скачать https://github.com/jqlang/jq/releases
```

### Локально (для конкретного проекта)

```bash
git clone https://github.com/ve1zy/harness
cp -r harness/* /path/to/your/project/.claude/
```

## Использование

Dev-workflow: `/plan "фича"` → `/build slug` → `/review slug`

При падении тестов: `/debug "ошибка"` → снова `/build slug`

## Требования

- `bash` (Git Bash на Windows)
- `jq` — для хука test-gate
