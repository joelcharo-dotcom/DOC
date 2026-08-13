const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Helper para generar ID
const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FUNDAMUFA - API funcionando' });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === 'admin' && password === 'admin123') {
    return res.json({ token: 'fake-token', usuario: 'admin', rol: 'admin' });
  }
  res.status(401).json({ error: 'Credenciales inválidas' });
});

// OBTENER CITAS POR FECHA
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

// CITAS PUBLICAS - GET SINCRONIZADO
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

// BLOQUEAR HORA DESDE PC
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
    const nueva = await prisma.cita.create({
      data: {
        id: genId(),
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

// CITAS PUBLICAS - POST SINCRONIZADO PC + CELULAR - FIX DEFINITIVO CON ID
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
      // Si ya existe y está ocupada, actualizar datos del paciente
      if (existente.estado === 'ocupada' || existente.estado === 'bloqueada') {
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
    }

    const nueva = await prisma.cita.create({
      data: {
        id: genId(),
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

// LIBERAR / ELIMINAR CITA
app.delete('/api/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cita.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// HISTORIAS
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
    data.id = genId();
    const nueva = await prisma.historia.create({ data });
    res.json(nueva);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
