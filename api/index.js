
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fundamufa_secret_2026';

app.use(cors());
app.use(express.json());

// Login
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  console.log('Intento login:', usuario);
  if (usuario === 'admin' && password === 'fundamufa2026') {
    const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, usuario });
  }
  return res.status(401).json({ error: 'Credenciales inválidas' });
});

// Middleware auth
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

// Pacientes, etc...
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
    const agenda = await prisma.agenda.findMany({ 
      include: { paciente: true },
      orderBy: { fecha: 'desc' }
    });
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

app.get('/api/health', (req, res) => res.json({ ok: true, version: 'fundamufa2026-fix' }));

module.exports = app;
