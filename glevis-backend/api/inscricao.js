import { google } from 'googleapis';

const ALLOWED_ORIGINS = [
  'https://glevis.netlify.app',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveAllowedOrigin(originHeader) {
  if (!originHeader) return null;
  if (ALLOWED_ORIGINS.includes(originHeader)) return originHeader;
  if (/^http:\/\/localhost(:\d+)?$/.test(originHeader)) return originHeader;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(originHeader)) return originHeader;
  return null;
}

function applyCors(req, res) {
  const allowed = resolveAllowedOrigin(req.headers.origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function formatBrasiliaDate(date) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return {}; }
}

function validate(payload) {
  const nome = typeof payload.nome === 'string' ? payload.nome.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const whatsappRaw = typeof payload.whatsapp === 'string' ? payload.whatsapp : '';
  const whatsapp = whatsappRaw.replace(/\D/g, '');

  if (nome.length < 2) return { error: 'Nome inválido. Informe ao menos 2 caracteres.' };
  if (!EMAIL_REGEX.test(email)) return { error: 'Email inválido.' };

  return { data: { nome, email, whatsapp } };
}

async function appendToSheet({ nome, email, whatsapp }) {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const data = formatBrasiliaDate(new Date());

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'A:D',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[data, nome, email, whatsapp]],
    },
  });
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ ok: false, error: 'Método não permitido.' });
    return;
  }

  const payload = await readJsonBody(req);
  const { error, data } = validate(payload);
  if (error) {
    res.status(400).json({ ok: false, error });
    return;
  }

  try {
    await appendToSheet(data);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[inscricao] erro ao gravar na planilha:', err);
    res.status(500).json({ ok: false, error: 'Não foi possível registrar agora. Tente novamente em instantes.' });
  }
}
