
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fundamufa_secret_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function handleLogin(usuario, password) {
  if (usuario === 'admin' && password === 'fundamufa2026') return { usuario: { id: 'admin', usuario: 'admin', nombre: 'Administrador' } };
  if (usuario === 'jorge' && password === 'jorge123') return { usuario: { id: 'jorge', usuario: 'jorge', nombre: 'Jorge' } };
  return null;
}

app.post('/api/login', (req, res) => {
  const body = req.body || {};
  const r = handleLogin(body.usuario, body.password);
  if (!r) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ usuario: r.usuario }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, usuario: r.usuario });
});
app.post('/api/auth/login', (req, res) => {
  const body = req.body || {};
  const r = handleLogin(body.usuario, body.password);
  if (!r) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ usuario: r.usuario }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, usuario: r.usuario });
});
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try { const d = jwt.verify(token, JWT_SECRET); return res.json({ usuario: d.usuario }); } catch { return res.status(401).json({ error: 'Token inválido' }); }
});
app.get('/api/auth/users', (req, res) => {
  res.json([{ id: 'admin', usuario: 'admin', nombre: 'Administrador' }, { id: 'jorge', usuario: 'jorge', nombre: 'Jorge' }]);
});

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try { jwt.verify(token, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Token inválido' }); }
}

async function safeFind(modelNames, orderBy, include) {
  for (const name of modelNames) {
    try {
      if (prisma[name]) {
        await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
        const data = await prisma[name].findMany({ orderBy, include }).catch(async () => await prisma[name].findMany({ orderBy }));
        return data;
      }
    } catch (e) {}
  }
  return [];
}

app.get('/api/pacientes', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const data = await safeFind(['cliente','Cliente','paciente','Paciente'], { createdAt: 'desc' });
  res.json(data);
});
app.get('/api/clientes', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const data = await safeFind(['cliente','Cliente','paciente','Paciente'], { createdAt: 'desc' });
  res.json(data);
});

app.post('/api/pacientes', auth, async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    const b = req.body || {};
    const nombreFinal = b.nombre || b.nombreCompleto || b.nombre_completo || 'Sin nombre';
    const cedulaFinal = b.cedula || b.documento || '';
    const telefonoFinal = b.telefono || '';
    const direccionFinal = b.direccion || '';
    const emailFinal = b.email || b.correo || '';
    let created;
    if (prisma.cliente) {
      created = await prisma.cliente.create({ data: { nombre: String(nombreFinal), cedula: String(cedulaFinal), telefono: String(telefonoFinal), direccion: String(direccionFinal), email: String(emailFinal) } });
    } else if (prisma.paciente) {
      created = await prisma.paciente.create({ data: { nombre: String(nombreFinal), cedula: String(cedulaFinal), telefono: String(telefonoFinal), direccion: String(direccionFinal) } });
    }
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar cliente: ' + e.message });
  }
});

app.post('/api/clientes', auth, async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    const b = req.body || {};
    const nombreFinal = b.nombre || b.nombreCompleto || b.nombre_completo || 'Sin nombre';
    const cedulaFinal = b.cedula || b.documento || '';
    const telefonoFinal = b.telefono || '';
    const direccionFinal = b.direccion || '';
    const emailFinal = b.email || b.correo || '';
    let created;
    if (prisma.cliente) {
      created = await prisma.cliente.create({ data: { nombre: String(nombreFinal), cedula: String(cedulaFinal), telefono: String(telefonoFinal), direccion: String(direccionFinal), email: String(emailFinal) } });
    } else if (prisma.paciente) {
      created = await prisma.paciente.create({ data: { nombre: String(nombreFinal), cedula: String(cedulaFinal), telefono: String(telefonoFinal), direccion: String(direccionFinal) } });
    }
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar cliente: ' + e.message });
  }
});

app.put('/api/pacientes/:id', auth, async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    const data = req.body || {};
    let updated;
    if (prisma.cliente) updated = await prisma.cliente.update({ where: { id: req.params.id }, data });
    else if (prisma.paciente) updated = await prisma.paciente.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/agenda', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.agenda) data = await prisma.agenda.findMany({ include: { paciente: true, cliente: true }, orderBy: { fecha: 'desc' } }).catch(()=> prisma.agenda.findMany({ orderBy: { fecha: 'desc' } }));
    else if (prisma.cita) data = await prisma.cita.findMany({ include: { paciente: true, cliente: true }, orderBy: { fecha: 'desc' } }).catch(()=> prisma.cita.findMany({ orderBy: { fecha: 'desc' } }));
    res.json(data);
  } catch { res.json([]); }
});
app.get('/api/citas', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.cita) data = await prisma.cita.findMany({ include: { paciente: true, cliente: true }, orderBy: { fecha: 'desc' } }).catch(()=> prisma.cita.findMany({ orderBy: { fecha: 'desc' } }));
    else if (prisma.agenda) data = await prisma.agenda.findMany({ include: { paciente: true, cliente: true }, orderBy: { fecha: 'desc' } }).catch(()=> prisma.agenda.findMany({ orderBy: { fecha: 'desc' } }));
    res.json(data);
  } catch { res.json([]); }
});
app.get('/api/historias', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.historia) data = await prisma.historia.findMany({ include: { cliente: true }, orderBy: { createdAt: 'desc' } }).catch(()=> prisma.historia.findMany({ orderBy: { createdAt: 'desc' } }));
    res.json(data);
  } catch { res.json([]); }
});
app.get('/api/formulas', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.formula) data = await prisma.formula.findMany({ include: { cliente: true, items: true }, orderBy: { createdAt: 'desc' } }).catch(async () => await prisma.formula.findMany({ orderBy: { createdAt: 'desc' } }));
    res.json(data);
  } catch { res.json([]); }
});
app.get('/api/facturas', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$executeRawUnsafe('DEALLOCATE ALL').catch(()=>{});
    let data = [];
    if (prisma.factura) data = await prisma.factura.findMany({ include: { cliente: true }, orderBy: { createdAt: 'desc' } }).catch(()=> prisma.factura.findMany({ orderBy: { createdAt: 'desc' } }));
    res.json(data);
  } catch { res.json([]); }
});

app.get('/api/health', (req, res) => res.json({ ok: true, version: 'V7-BLANCO-FIX', auth: 'admin/fundamufa2026' }));
module.exports = app;
