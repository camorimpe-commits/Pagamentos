// Lê a planilha publicada no Google Sheets e devolve JSON limpo.
// Para trocar de planilha sem mexer no código, defina SHEET_CSV_URL em Vercel > Settings > Environment Variables.
const CSV_URL = process.env.SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?gid=507908437&single=true&output=csv';

function parseCSV(t) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// aceita "150.758,56" (pt-BR) e "150758.56"
function num(s) {
  s = String(s || '').replace(/[R$\s]/g, '');
  if (!s || s === '-') return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// "10835932000108 - COMPANHIA ENERGETICA" -> "COMPANHIA ENERGETICA"
const credor = s => String(s || '').replace(/^\d+\s*-\s*/, '').trim();
const dash = s => (s && s.trim() !== '-' ? s.trim() : '');

const MAP = {
  ano: 'ano', mes: 'mes', empenho: 'emp', liquidacao: 'liq', pagamento: 'pag',
  fonte: 'fonte', subfuncao: 'funcao', grupo: 'grupo', elemento: 'elemento', credor: 'credor',
  subelemento: 'sub', dataemissao: 'dt', documentone: 'ne', documentonl: 'nl',
  documentopd: 'pd', documentoob: 'ob', status: 'status', ndocfiscal: 'nf',
  datapagamento: 'dp', tema: 'tema',
};

module.exports = async (req, res) => {
  try {
    const resp = await fetch(CSV_URL, { redirect: 'follow' });
    const text = await resp.text();
    if (!resp.ok || text.trim().startsWith('<')) {
      throw new Error('Planilha inacessível. Confirme em Arquivo > Compartilhar > Publicar na Web que a aba está publicada como CSV.');
    }
    const [head, ...body] = parseCSV(text);
    const keys = head.map(h => MAP[norm(h)] || null);
    const rows = [];
    for (const line of body) {
      const o = {};
      keys.forEach((k, i) => { if (k) o[k] = (line[i] || '').trim(); });
      if (!o.ano) continue;
      o.emp = num(o.emp); o.liq = num(o.liq); o.pag = num(o.pag);
      o.credor = credor(o.credor);
      o.nf = dash(o.nf); o.dp = dash(o.dp); o.pd = dash(o.pd); o.ob = dash(o.ob);
      o.mes = (o.mes || '').toLowerCase().slice(0, 3);
      o.status = o.status || 'Sem status'; o.tema = o.tema || 'Sem tema';
      rows.push(o);
    }
    // cache de borda: a Vercel serve a mesma resposta por 2 min e atualiza em segundo plano
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    res.status(200).json({ updated: new Date().toISOString(), count: rows.length, rows });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: e.message });
  }
};

