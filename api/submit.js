/* =========================================================
   Vercel Serverless Function: POST /api/submit
   Принимает заявку с формы и записывает её в Supabase.
   Ключи берутся ТОЛЬКО из переменных окружения Vercel:
     SUPABASE_URL              — https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY — секретный ключ (service_role или sb_secret_…)
   В браузер ключи не попадают.
   ========================================================= */

const ALLOWED = ['name', 'contact', 'email', 'message', 'theme', 'page_url', 'user_agent'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Supabase не настроен: добавьте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Vercel → Environment Variables' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // валидация
  const name = String(body.name || '').trim();
  const contact = String(body.contact || '').trim();
  const message = String(body.message || '').trim();
  if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Укажите имя' });
  if (contact.length < 5 || contact.length > 200) return res.status(400).json({ error: 'Укажите телефон, Telegram или email' });
  if (message.length < 5 || message.length > 4000) return res.status(400).json({ error: 'Опишите задачу (от 5 до 4000 символов)' });
  if (body.website) return res.status(200).json({ ok: true }); // honeypot для ботов — молча игнорируем

  const row = {};
  ALLOWED.forEach(k => { if (body[k] != null) row[k] = String(body[k]).slice(0, 4000); });
  row.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : null;
  row.ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;

  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error('Supabase error', r.status, txt);
      return res.status(502).json({ error: 'Не удалось сохранить заявку' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};
