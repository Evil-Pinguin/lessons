/* =========================================================
   Настройки Supabase для формы заявок.
   1. Создайте проект на https://supabase.com
   2. В SQL Editor выполните скрипт из supabase/schema.sql
   3. Вставьте сюда Project URL и anon (public) key
      (Settings → API). Anon-ключ безопасно публиковать —
      доступ ограничен политиками RLS из schema.sql.
   Если поля пустые — форма откроет почтовый клиент
   (mailto) как запасной вариант.
   ========================================================= */
window.SUPABASE_CONFIG = {
  url: '',      // например: 'https://abcdefghijk.supabase.co'
  anonKey: '',  // например: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  table: 'requests',
};
