const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fundamufa_secret_2026';

app.use(cors());
app.use(express.json());

function handleLogin(usuario, password) {
  if (usuario === 'admin' && password === 'fundamufa2026') {
    return { usuario: { id: 'admin', usuario: 'admin', nombre: 'Administrador' } };
  }
  if (usuario === 'jorge' && password === 'jorge123') {
    return { usuario: { id: 'jorge', usuario: 'jorge', nombre: 'Jorge' } };
  }
  return null;
}

// ========== AUTH ==========
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const result = handleLogin(usuario, password);
  if (!result) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ usuario: result.usuario }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, usuario: result.usuario });
});
app.post('/api/auth/login', (req, res) => {
  const { usuario, password } = req.body;
  const result = handleLogin(usuario, password);
  if (!result) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ usuario: result.usuario }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, usuario: result.usuario });
});
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ usuario: decoded.usuario });
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
});
app.get('/api/auth/users', (req, res) => {
  res.json([
    { id: 'admin', usuario: 'admin', nombre: 'Administrador' },
    { id: 'jorge', usuario: 'jorge', nombre: 'Jorge' }
  ]);
});

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try { jwt.verify(token, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Token inválido' }); }
}

async function safeFind(modelNames, orderBy) {
  for (const name of modelNames) {
    try {
      if (prisma[name]) {
        await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
        const data = await prisma[name].findMany({ orderBy });
        return data;
      }
    } catch (e) { console.log('safeFind', name, e.message); }
  }
  return [];
}

// ========== PACIENTES / CLIENTES ==========
app.get('/api/pacientes', auth, async (req, res) => {
  const data = await safeFind(['paciente','cliente','Paciente','Cliente'], { createdAt: 'desc' });
  res.json(data);
});
app.get('/api/clientes', auth, async (req, res) => {
  const data = await safeFind(['paciente','cliente','Paciente','Cliente'], { createdAt: 'desc' });
  res.json(data);
});

// ========== AGENDA / CITAS ==========
app.get('/api/agenda', auth, async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.agenda) data = await prisma.agenda.findMany({ include: { paciente: true }, orderBy: { fecha: 'desc' } }).catch(async () => await prisma.agenda.findMany({ orderBy: { fecha: 'desc' } }));
    else if (prisma.cita) data = await prisma.cita.findMany({ include: { paciente: true }, orderBy: { fecha: 'desc' } }).catch(()=>[]);
    res.json(data);
  } catch (e) { res.json([]); }
});
app.get('/api/citas', auth, async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.cita) data = await prisma.cita.findMany({ include: { paciente: true }, orderBy: { fecha: 'desc' } }).catch(async () => await prisma.cita.findMany({ orderBy: { fecha: 'desc' } }));
    else if (prisma.agenda) data = await prisma.agenda.findMany({ include: { paciente: true }, orderBy: { fecha: 'desc' } }).catch(()=>[]);
    res.json(data);
  } catch (e) { res.json([]); }
});
app.post('/api/agenda', auth, async (req, res) => {
  try { await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{}); } catch {}
  try {
    const { fecha, hora, pacienteId, motivo, paciente_id, fecha: f } = req.body;
    const pid = pacienteId || paciente_id;
    const data = { fecha: new Date(fecha || f), hora, pacienteId: pid, motivo, estado: 'PENDIENTE' };
    const model = prisma.agenda ? prisma.agenda : prisma.cita;
    const nueva = await model.create({ data, include: { paciente: true } }).catch(async () => await model.create({ data }));
    res.json(nueva);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/citas', auth, async (req, res) => {
  try { await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{}); } catch {}
  try {
    const { fecha, hora, pacienteId, motivo, paciente_id } = req.body;
    const pid = pacienteId || paciente_id;
    const data = { fecha: new Date(fecha), hora, pacienteId: pid, motivo, estado: 'PENDIENTE' };
    const model = prisma.cita ? prisma.cita : prisma.agenda;
    const nueva = await model.create({ data, include: { paciente: true } }).catch(async () => await model.create({ data }));
    res.json(nueva);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ========== HISTORIAS / FORMULAS / FACTURAS ==========
app.get('/api/historias', auth, async (req, res) => {
  const data = await safeFind(['historia','historiaClinica','Historia','HistoriaClinica'], { createdAt: 'desc' });
  res.json(data);
});
app.get('/api/formulas', auth, async (req, res) => {
  const data = await safeFind(['formula','Formula','receta','Receta'], { createdAt: 'desc' });
  res.json(data);
});
app.get('/api/facturas', auth, async (req, res) => {
  const data = await safeFind(['factura','Factura'], { createdAt: 'desc' });
  res.json(data);
});

app.get('/api/health', (req, res) => res.json({ ok: true, version: 'FINAL-COMPLETO-TODO', auth: 'admin/fundamufa2026' }));
module.exports = app;
