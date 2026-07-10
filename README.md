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

## Лабораторные работы (`labs/`)

**Lab 27: Интеграция локальной LLM в CLI-утилиту**
- `lab27_cli_llm.py` — интерактивный CLI для работы с локальной LLM
- `demo27.py` — демонстрация работы
- Модель: TinyLlama 1.1B через ctransformers
- Работает офлайн, без Ollama

**Lab 28: Локальная LLM + RAG**
- `lab28.py` — RAG-система с TF-IDF retrieval + локальная генерация
- `lab28_report.md` — отчет с результатами
- Использует индекс из lab21 (8 чанков, 626 слов)
- Сравнение с облачной моделью (если есть API ключ)

**Lab 29: Оптимизация локальной LLM**
- `lab29.py` — тестирование параметров (temperature, квантование, prompt)
- `lab29_report.md` — отчет с результатами
- Сравнение: до/после оптимизации
- Улучшение: скорость -14%, качество +30%

**Lab 30: Локальная LLM как приватный сервис**
- `lab30_server.py` — HTTP API сервер (FastAPI)
- `lab30_client.py` — клиент для тестирования
- `lab30_report.md` — отчет с результатами
- Rate limiting, потокобезопасность, мониторинг
- Результат: 7/8 тестов пройдено

### Запуск лабораторных

```bash
# Lab 27: CLI утилита
python labs/lab27_cli_llm.py

# Lab 28: RAG система
python labs/lab28.py

# Lab 29: Оптимизация
python labs/lab29.py

# Lab 30: Сервис
python labs/lab30_server.py    # Сервер
python labs/lab30_client.py    # Тесты
```

### Требования для лабораторных

- Python 3.7+
- `ctransformers` — для локальной LLM
- `fastapi`, `uvicorn` — для lab30
- `requests` — для HTTP запросов
