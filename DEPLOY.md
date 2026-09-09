# Публикация на Vercel + подключение Supabase

Занимает ~10 минут. Порядок: сначала база, потом Vercel.

---

## Шаг 1. База данных в Supabase

1. Откройте проект на [supabase.com/dashboard](https://supabase.com/dashboard).
2. Слева **SQL Editor → New query**.
3. Вставьте **весь** файл [`supabase/schema.sql`](supabase/schema.sql) и нажмите **Run**.
4. Проверка: **Table Editor** — должна появиться таблица `requests`.

## Шаг 2. Где взять ключи

**Settings → API** (или **Settings → API Keys**). Там два раздела:

| Что нужно | Где | Куда вставлять |
|---|---|---|
| **Project URL** — `https://<ref>.supabase.co` | Settings → API → Project URL | Vercel: `SUPABASE_URL` |
| **service_role** (длинный `eyJ…` с `"role":"service_role"`) **или** `sb_secret_…` | Settings → API Keys → *Secret keys* | Vercel: `SUPABASE_SERVICE_ROLE_KEY` |
| **anon** / `sb_publishable_…` | Settings → API Keys → *Publishable* | нигде — не нужен при работе через Vercel |

> Ваш `ref` из ключей — `izsfscbyqbxzsvpdiihh`, значит URL: `https://izsfscbyqbxzsvpdiihh.supabase.co`

### ⚠️ Секретные ключи
`sb_secret_…` и `service_role` дают **полный доступ** к базе. Их нельзя:
- вставлять в `js/supabase-config.js` или любой другой файл сайта;
- отправлять в чаты, письма, коммитить в git.

Они живут только в **Environment Variables** на Vercel. Если ключ где-то засветился — **Settings → API Keys → ⋯ → Rotate / Reset** и вставьте новый в Vercel.

## Шаг 3. Vercel

1. [vercel.com](https://vercel.com) → **Add New… → Project** → выберите репозиторий `Evil-Pinguin/lessons` → **Import**.
2. **Framework Preset:** `Other`. Build Command и Output Directory оставьте пустыми (сайт статический).
3. Разверните **Environment Variables** и добавьте две переменные:

   ```
   SUPABASE_URL               = https://izsfscbyqbxzsvpdiihh.supabase.co
   SUPABASE_SERVICE_ROLE_KEY  = <service_role или sb_secret_…>
   ```
   Отметьте окружения **Production, Preview, Development**.

4. **Deploy**. Через минуту сайт будет по адресу `https://<имя>.vercel.app`.

Если проект уже создан: **Project → Settings → Environment Variables → Add**, затем **Deployments → ⋯ → Redeploy** (переменные применяются только после передеплоя).

## Шаг 4. Проверка

1. Откройте сайт, заполните форму, нажмите «Отправить заявку» → должно появиться «Заявка отправлена!».
2. Supabase → **Table Editor → requests** — строка появилась.
3. Если ошибка — Vercel → **Deployments → последний → Functions → /api/submit → Logs**.

---

## Как это устроено

```
браузер ──POST /api/submit──▶ Vercel Function (api/submit.js) ──▶ Supabase REST
                                   │  ключи из process.env
                                   └─ валидация, honeypot, IP
```

- Секретные ключи есть только у функции на сервере.
- Если `/api/submit` недоступен (например, сайт открыт локально или на GitHub Pages),
  форма попробует прямую запись в Supabase публичным ключом из `js/supabase-config.js`
  (RLS разрешает анониму только `insert`).
- Если и это не сработало (или сеть блокирует Supabase) — заявка уходит
  **в WhatsApp** на 8 968 151-56-91 (с телефона открывается автоматически)
  или в почтовый клиент. Этот путь работает с любого телефона без VPN:
  браузер общается только с доменом сайта и WhatsApp, а не с Supabase напрямую.

## Просмотр заявок

- Supabase → **Table Editor → requests** (можно менять `status`, `price`, `notes`).
- Или SQL: `select * from requests_inbox;`
- Уведомления в Telegram/на почту: **Database → Webhooks** на событие `INSERT` в `requests`.

## Локальный запуск с функцией

```bash
npm i -g vercel
vercel dev          # спросит переменные или возьмёт из .env.local
```
`.env.local` (не коммитить!):
```
SUPABASE_URL=https://izsfscbyqbxzsvpdiihh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```
