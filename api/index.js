const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FUNDAMUFA - API funcionando' });
});

app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === 'admin' && password === 'admin123') {
    return res.json({ token: 'fake-token', usuario: 'admin', rol: 'admin' });
  }
  res.status(401).json({ error: 'Credenciales inválidas' });
});

app.get('/api/citas', async (req, res) => {
  try {
    const { fecha } = req.query;
    let where = {};
    if (fecha) {
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0,0,0,0);
      const finDia = new Date(fecha);
      finDia.setHours(23,59,59,999);
      where.fecha = { gte: inicioDia, lte: finDia };
    }
    const citas = await prisma.cita.findMany({ where, orderBy: { hora: 'asc' } });
    const normalizadas = citas.map(c => ({
      ...c,
      fecha: c.fecha instanceof Date ? c.fecha.toISOString().split('T')[0] : c.fecha
    }));
    res.json(normalizadas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/citas-publicas', async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.json([]);
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0,0,0,0);
    const finDia = new Date(fecha);
    finDia.setHours(23,59,59,999);
    const citas = await prisma.cita.findMany({
      where: { fecha: { gte: inicioDia, lte: finDia } },
      orderBy: { hora: 'asc' }
    });
    const normalizadas = citas.map(c => ({
      ...c,
      fecha: c.fecha instanceof Date ? c.fecha.toISOString().split('T')[0] : c.fecha
    }));
    res.json(normalizadas);
  } catch (e) {
    res.status(500).json({ error: e.message, details: e.toString() });
  }
});

app.post('/api/citas', async (req, res) => {
  try {
    const { fecha, hora, estado } = req.body;
    if (!fecha || !hora) return res.status(400).json({ error: 'Faltan datos' });
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0,0,0,0);
    const finDia = new Date(fecha);
    finDia.setHours(23,59,59,999);
    const existente = await prisma.cita.findFirst({
      where: { fecha: { gte: inicioDia, lte: finDia }, hora }
    });
    if (existente) {
      const actualizada = await prisma.cita.update({
        where: { id: existente.id },
        data: { estado: estado || 'bloqueada' }
      });
      return res.json(actualizada);
    }
    // SIN ID - deja que la base lo genere como Int
    const nueva = await prisma.cita.create({
      data: {
        fecha: new Date(fecha),
        hora,
        nombre: 'Bloqueada por Admin',
        cedula: '',
        celular: '-',
        motivo: 'Bloqueada',
        estado: estado || 'bloqueada'
      }
    });
    res.json(nueva);
  } catch (e) {
    res.status(500).json({ error: e.message, details: e.toString() });
  }
});

app.post('/api/citas-publicas', async (req, res) => {
  try {
    const { fecha, hora, nombre, cedula, celular, motivo, estado } = req.body;
    if (!fecha || !hora || !nombre) {
      return res.status(400).json({ error: 'Faltan datos: fecha, hora y nombre son obligatorios' });
    }
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0,0,0,0);
    const finDia = new Date(fecha);
    finDia.setHours(23,59,59,999);

    const existente = await prisma.cita.findFirst({
      where: { fecha: { gte: inicioDia, lte: finDia }, hora }
    });

    if (existente) {
      const actualizada = await prisma.cita.update({
        where: { id: existente.id },
        data: {
          nombre,
          cedula: cedula || existente.cedula || '',
          celular: celular || existente.celular || '-',
          motivo: motivo || existente.motivo || '',
          estado: estado || 'ocupada'
        }
      });
      return res.json(actualizada);
    }

    // SIN ID - la base genera Int automáticamente
    const nueva = await prisma.cita.create({
      data: {
        fecha: new Date(fecha),
        hora,
        nombre,
        cedula: cedula || '',
        celular: celular || '-',
        motivo: motivo || '',
        estado: estado || 'ocupada'
      }
    });
    res.json(nueva);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al agendar', details: e.message });
  }
});

app.delete('/api/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(id);
    await prisma.cita.delete({ where: { id: isNaN(idInt) ? id : idInt } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/historias', async (req, res) => {
  try {
    const historias = await prisma.historia.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(historias);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/historias', async (req, res) => {
  try {
    const data = req.body;
    const nueva = await prisma.historia.create({ data });
    res.json(nueva);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
