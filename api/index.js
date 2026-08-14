const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fundamufa_secret_2026';

app.use(cors());
app.use(express.json());

// Función login reutilizable
function handleLogin(usuario, password) {
  if (usuario === 'admin' && password === 'fundamufa2026') {
    return { usuario: { id: 'admin', usuario: 'admin', nombre: 'Administrador' } };
  }
  if (usuario === 'jorge' && password === 'jorge123') {
    return { usuario: { id: 'jorge', usuario: 'jorge', nombre: 'Jorge' } };
  }
  return null;
}

// Login antiguo /api/login
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const result = handleLogin(usuario, password);
  if (!result) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ usuario: result.usuario }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, usuario: result.usuario });
});

// Login nuevo que usa el frontend /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { usuario, password } = req.body;
  console.log('Login intento:', usuario);
  const result = handleLogin(usuario, password);
  if (!result) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ usuario: result.usuario }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, usuario: result.usuario });
});

// Verificación de token /api/auth/me
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
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

app.get('/api/pacientes', auth, async (req, res) => {
  try { await prisma.$executeRawUnsafe('DEALLOCATE ALL'); } catch {}
  try {
    const pacientes = await prisma.paciente.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(pacientes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/agenda', auth, async (req, res) => {
  try { await prisma.$executeRawUnsafe('DEALLOCATE ALL'); } catch {}
  try {
    const agenda = await prisma.agenda.findMany({ include: { paciente: true }, orderBy: { fecha: 'desc' } });
    res.json(agenda);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agenda', auth, async (req, res) => {
  try { await prisma.$executeRawUnsafe('DEALLOCATE ALL'); } catch {}
  try {
    const { fecha, hora, pacienteId, motivo } = req.body;
    const nueva = await prisma.agenda.create({
      data: { fecha: new Date(fecha), hora, pacienteId, motivo, estado: 'PENDIENTE' },
      include: { paciente: true }
    });
    res.json(nueva);
  } catch (e) {
    console.error('Error agenda:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, version: 'fundamufa2026-final-auth-fix', login: 'admin/fundamufa2026 y jorge/jorge123' }));

module.exports = app;
