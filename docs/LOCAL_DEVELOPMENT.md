# Локальная разработка

Требования: Node.js 22+ и npm 10+. Python 3.11+ нужен только для опционального analytics-адаптера.

```bash
npm install
cp .env.example .env
npm test
npm run dev
```

Откройте `http://localhost:5173`. Демо-вход: `employee@demo.local` / `demo-kanban`.

Backend доступен на `http://localhost:3001`. Если frontend и backend запускаются отдельно: `npm run dev:backend` и `npm run dev:frontend`.

По умолчанию используется `DATA_SOURCE=demo`. Для Supabase задайте `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и `DATA_SOURCE=supabase`, примените SQL из `supabase/migrations`, затем seed из `supabase/seed.sql`.

Python-зависимости устанавливаются отдельно:

```bash
python3 -m pip install -r analytics/requirements.txt
python3 -m unittest discover -s analytics/tests -q
```
