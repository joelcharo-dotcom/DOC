
// CITAS - SINCRONIZADO PC + CELULAR - FUNDAMUFA - FIX DEFINITIVO
app.get('/api/citas', authMiddleware, async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({ orderBy: [{ fecha: 'asc' }, { hora: 'asc' }] });
    res.json(citas);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener citas' }); }
});
app.post('/api/citas', async (req, res) => {
  try {
    const { fecha, hora, nombre, cedula, celular, motivo, estado } = req.body;
    if (!fecha || !hora) return res.status(400).json({ error: 'Fecha y hora requeridas' });
    const fechaISO = new Date(fecha);
    const inicioDia = new Date(fechaISO.setHours(0,0,0,0));
    const finDia = new Date(fechaISO.setHours(23,59,59,999));
    const existente = await prisma.cita.findFirst({ where: { fecha: { gte: inicioDia, lte: finDia }, hora } });
    if (existente) {
      const actualizada = await prisma.cita.update({ where: { id: existente.id }, data: { nombre, cedula, celular, motivo, estado } });
      return res.json(actualizada);
    }
    const cita = await prisma.cita.create({ data: { fecha: new Date(fecha), hora, nombre: nombre || 'BLOQUEADO', cedula: cedula || null, celular: celular || '-', motivo: motivo || null, estado: estado || 'ocupada' } });
    res.json(cita);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error citas', details: e.message }); }
});
app.delete('/api/citas/:id', authMiddleware, async (req, res) => {
  try { await prisma.cita.delete({ where: { id: parseInt(req.params.id) } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: 'Error al eliminar cita' }); }
});
app.delete('/api/citas-publicas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });
    await prisma.cita.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar cita publica', details: e.message });
  }
});
app.get('/api/citas-publicas', async (req, res) => {
  try {
    const { fecha } = req.query;
    let where = {};
    if (fecha) {
      const fechaISO = new Date(fecha);
      const inicioDia = new Date(fechaISO.setHours(0,0,0,0));
      const finDia = new Date(fechaISO.setHours(23,59,59,999));
      where.fecha = { gte: inicioDia, lte: finDia };
    }
    const citas = await prisma.cita.findMany({ where, orderBy: { hora: 'asc' } });
    const citasNormalizadas = citas.map(c => ({
      ...c,
      fecha: new Date(c.fecha).toISOString().split('T')[0]
    }));
    res.json(citasNormalizadas);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});
app.post('/api/citas-publicas', async (req, res) => {
  try {
    const { fecha, hora, nombre, cedula, celular, motivo, estado } = req.body;
    if (!fecha || !hora || !nombre) return res.status(400).json({ error: 'Faltan datos: fecha, hora y nombre' });
    const fechaISO = new Date(fecha);
    const inicioDia = new Date(fechaISO.setHours(0,0,0,0));
    const finDia = new Date(fechaISO.setHours(23,59,59,999));
    const existente = await prisma.cita.findFirst({ where: { fecha: { gte: inicioDia, lte: finDia }, hora } });
    if (existente) {
      const actualizada = await prisma.cita.update({
        where: { id: existente.id },
        data: { nombre, cedula: cedula || null, celular: celular || '-', motivo: motivo || null, estado: estado || 'ocupada' }
      });
      return res.json(actualizada);
    }
    const cita = await prisma.cita.create({
      data: { fecha: new Date(fecha), hora, nombre, cedula: cedula || null, celular: celular || '-', motivo: motivo || null, estado: estado || 'ocupada' }
    });
    const citaNormalizada = { ...cita, fecha: new Date(cita.fecha).toISOString().split('T')[0] };
    res.json(citaNormalizada);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al agendar', details: e.message }); }
});
