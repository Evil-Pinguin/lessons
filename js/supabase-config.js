/* =========================================================
   Настройки отправки заявок.

   ВАРИАНТ A (рекомендуется, для Vercel) — ничего здесь не менять.
     Форма шлёт POST на /api/submit (файл api/submit.js), а ключи
     Supabase лежат в переменных окружения Vercel:
       SUPABASE_URL
       SUPABASE_SERVICE_ROLE_KEY
     Секретные ключи в браузер не попадают.

   ВАРИАНТ B (без Vercel: GitHub Pages, просто открыть файл и т. п.)
     Заполните url и anonKey. Сюда можно вставлять ТОЛЬКО
     публичный ключ: anon (JWT с "role":"anon") или sb_publishable_…
     НИКОГДА не вставляйте сюда service_role или sb_secret_… —
     этот файл виден всем посетителям сайта.

   Если ни один вариант не настроен — кнопка «Отправить»
   открывает почтовый клиент с готовым письмом.
   ========================================================= */
window.SUPABASE_CONFIG = {
  url: '',      // например: 'https://izsfscbyqbxzsvpdiihh.supabase.co'
  anonKey: '',  // например: 'sb_publishable_…'  или  'eyJhbGciOi…' (anon)
  table: 'requests',
  useApi: true, // сначала пробовать /api/submit (Vercel)
};
