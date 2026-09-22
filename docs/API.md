# REST API

Все endpoint-ы `/api` кроме login требуют `Authorization: Bearer <token>`.

`POST /api/auth/login` принимает `{ "email": "employee@demo.local", "password": "demo-kanban" }` и возвращает token и пользователя.

- `GET /api/managers`
- `POST /api/managers` с `{ "name", "email", "dailyCapacity", "active"? }`
- `PATCH /api/managers/:id`
- `GET /api/leads`
- `POST /api/leads` с `{ "region", "product", "source", "potentialAmount", "plannedFor"?, "status"? }`
- `GET /api/leads/:id`
- `GET /api/dashboard/summary?plannedFor=YYYY-MM-DD`
- `POST /api/optimization-runs` с `{ "plannedFor": "YYYY-MM-DD" }`
- `PATCH /api/leads/:id/assignment` с `{ "managerId": "..." }` или `null`
- `PATCH /api/leads/:id/status` с `{ "status": "in_progress" }` или `assigned`

Ручное назначение возвращает `expectedGmDelta` для одной заявки. Значение не является изменением общей GM плана. `GET /api/leads/:id` отдаёт оценки всех активных менеджеров, размеры выборок, сглаживание, загрузку и расчёт формулы. Если ёмкость менеджера исчерпана, ручное назначение возвращает `409`. Ошибки имеют форму `{ "error": { "code": "...", "message": "..." } }`.
