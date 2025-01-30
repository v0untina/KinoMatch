## И так, для работы требуется Bun (более быстрая и удобная альтернатива Node.js, команды все аналогичны ноде)

### Установка Linux/MacOS:
`curl -fsSL https://bun.sh/install | bash`

### Установка Windows (PowerShell)
`powershell -c "irm bun.sh/install.ps1 | iex"`
или
`irm bun.sh/install.ps1 | iex`

### Установка куда угодно, если уже есть нода
`npm install -g bun`

# Запуск проекта
- Переходим в главную папку проекта
- ```bun install```
- Переходим в папку /backend
- ```bun install```
- Переходим в папку /frontend
- ```bun install```

Далее вся работа происходит из главной папки проекта
- ```bun run dev``` - запуск фронт + бэк
- ```bun run dev:frontend``` - запуск онли фронт
- ```bun run dev:backend``` - запуск онли бэк