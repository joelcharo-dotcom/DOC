const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token mal formateado' });
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token mal formateado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// AUTH ROUTES (igual)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { usuario, password, nombre } = req.body;
    if (!usuario || !password || !nombre) return res.status(400).json({ error: 'Todos los campos son requeridos' });
    const existingUser = await prisma.usuario.findUnique({ where: { usuario } });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya está registrado' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({ data: { usuario, password: hashedPassword, nombre } });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre }, token });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al registrar usuario' }); }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    const user = await prisma.usuario.findUnique({ where: { usuario } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre }, token });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al iniciar sesión' }); }
});
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.usuario.findUnique({ where: { id: decoded.id }, select: { id: true, usuario: true, nombre: true } });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: user });
  } catch (error) { res.status(401).json({ error: 'Token inválido' }); }
});
app.get('/api/auth/usuarios', async (req, res) => { try { const usuarios = await prisma.usuario.findMany({ select: { id: true, usuario: true, nombre: true, createdAt: true } }); res.json(usuarios); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.get('/api/auth/usuarios/:id', async (req, res) => { try { const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(req.params.id) }, select: { id: true, usuario: true, nombre: true } }); if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' }); res.json(usuario); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/auth/usuarios/:id', async (req, res) => { try { const { id } = req.params; const { usuario, nombre } = req.body; if (usuario) { const existingUser = await prisma.usuario.findFirst({ where: { usuario, NOT: { id: parseInt(id) } } }); if (existingUser) return res.status(400).json({ error: 'El nombre de usuario ya está en uso' }); } const updatedUser = await prisma.usuario.update({ where: { id: parseInt(id) }, data: { ...(usuario && { usuario }), ...(nombre && { nombre }) }, select: { id: true, usuario: true, nombre: true } }); res.json(updatedUser); } catch (e) { res.status(500).json({ error: 'Error al actualizar usuario' }); } });
app.put('/api/auth/usuarios/:id/password', async (req, res) => { try { const { id } = req.params; const { passwordActual, passwordNueva } = req.body; if (!passwordNueva) return res.status(400).json({ error: 'La nueva contraseña es requerida' }); const user = await prisma.usuario.findUnique({ where: { id: parseInt(id) } }); if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); if (passwordActual) { const validPassword = await bcrypt.compare(passwordActual, user.password); if (!validPassword) return res.status(401).json({ error: 'Contraseña actual incorrecta' }); } const hashedPassword = await bcrypt.hash(passwordNueva, 10); await prisma.usuario.update({ where: { id: parseInt(id) }, data: { password: hashedPassword } }); res.json({ message: 'Contraseña actualizada correctamente' }); } catch (e) { res.status(500).json({ error: 'Error al cambiar contraseña' }); } });
app.delete('/api/auth/usuarios/:id', async (req, res) => { try { const count = await prisma.usuario.count(); if (count <= 1) return res.status(400).json({ error: 'No se puede eliminar el único usuario del sistema' }); await prisma.usuario.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Usuario eliminado correctamente' }); } catch (e) { res.status(500).json({ error: 'Error al eliminar usuario' }); } });

// CLIENTES
app.get('/api/clientes', authMiddleware, async (req, res) => { try { const { search } = req.query; let where = {}; if (search) where = { OR: [{ nombre: { contains: search, mode: 'insensitive' } }, { cedula: { contains: search, mode: 'insensitive' } }] }; const clientes = await prisma.cliente.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { historias: true, formulas: true } } } }); res.json(clientes); } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener clientes' }); } });
app.get('/api/clientes/:id', authMiddleware, async (req, res) => { try { const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(req.params.id) }, include: { historias: { orderBy: { fecha: 'desc' } }, formulas: { orderBy: { fecha: 'desc' }, include: { items: true } } } }); if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' }); res.json(cliente); } catch (e) { res.status(500).json({ error: 'Error al obtener cliente' }); } });
app.post('/api/clientes', authMiddleware, upload.single('foto'), async (req, res) => { try { const { nombre, cedula, telefono, direccion } = req.body; if (!nombre || !cedula) return res.status(400).json({ error: 'Nombre y cédula son requeridos' }); const existingCliente = await prisma.cliente.findUnique({ where: { cedula } }); if (existingCliente) return res.status(400).json({ error: 'Ya existe un cliente con esa cédula' }); const cliente = await prisma.cliente.create({ data: { nombre, cedula, telefono: telefono || null, direccion: direccion || null, foto: null } }); res.status(201).json(cliente); } catch (e) { console.error(e); res.status(500).json({ error: 'Error al crear cliente' }); } });
app.put('/api/clientes/:id', authMiddleware, upload.single('foto'), async (req, res) => { try { const cliente = await prisma.cliente.update({ where: { id: parseInt(req.params.id) }, data: { nombre: req.body.nombre, cedula: req.body.cedula, telefono: req.body.telefono, direccion: req.body.direccion } }); res.json(cliente); } catch (e) { res.status(500).json({ error: 'Error al actualizar cliente' }); } });
app.delete('/api/clientes/:id', authMiddleware, async (req, res) => { try { await prisma.cliente.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Cliente eliminado correctamente' }); } catch (e) { res.status(500).json({ error: 'Error al eliminar cliente' }); } });

// ============ HISTORIAS - ARREGLADO PARA FUNDAMUFA ============
app.get('/api/historias', authMiddleware, async (req, res) => {
  try {
    const { search, clienteId } = req.query;
    let where = {};
    if (clienteId) where.clienteId = parseInt(clienteId);
    if (search) {
      where.OR = [
        { observaciones: { contains: search, mode: 'insensitive' } },
        { diagnostico: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { cedula: { contains: search, mode: 'insensitive' } } }
      ];
    }
    const historias = await prisma.historia.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { select: { id: true, nombre: true, cedula: true, telefono: true, direccion: true } },
        examenes: true
      }
    });
    res.json(historias);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener historias' }); }
});

app.get('/api/historias/:id', authMiddleware, async (req, res) => {
  try {
    const historia = await prisma.historia.findUnique({ where: { id: parseInt(req.params.id) }, include: { cliente: true, examenes: true } });
    if (!historia) return res.status(404).json({ error: 'Historia no encontrada' });
    res.json(historia);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener historia' }); }
});

// POST ARREGLADO - ACEPTA CONSULTAS Y HISTORIAS
app.post('/api/historias', authMiddleware, async (req, res) => {
  try {
    const body = req.body;
    console.log("=== NUEVA HISTORIA/CONSULTA ===", body);

    if (!body.clienteId) {
      return res.status(400).json({ error: 'Cliente es requerido' });
    }

    const clienteId = parseInt(body.clienteId);
    
    // FIX PRINCIPAL: observaciones ya no es obligatorio, tomamos cualquier campo
    let observaciones = body.observaciones;
    if (!observaciones || observaciones.trim() === '') {
      observaciones = body.diagnostico || body.notasMedico || body.detalleMedicamentos || body.motivo || "Consulta FUNDAMUFA - Dr. Jorge Charrasquiel";
    }

    const data = {
      clienteId: clienteId,
      observaciones: observaciones,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      valor: body.valor ? parseFloat(body.valor) : body.valorConsulta ? parseFloat(body.valorConsulta) : null,
      tipoPago: body.tipoPago || body.formaPago || "pago",
      referido: body.referido || null,
      // Campos extendidos FUNDAMUFA
      edad: body.edad ? parseInt(body.edad) : null,
      diagnostico: body.diagnostico || null,
      presionSistolica: body.presionSistolica ? String(body.presionSistolica) : null,
      presionDiastolica: body.presionDiastolica ? String(body.presionDiastolica) : null,
      temperatura: body.temperatura ? String(body.temperatura) : null,
      frecuenciaCardiaca: body.frecuenciaCardiaca ? String(body.frecuenciaCardiaca) : null,
      sistemas: body.sistemas || null,
      tipoPaciente: body.tipoPaciente || null,
      acompanante: body.acompanante || null,
      acompananteTelefono: body.acompananteTelefono || null,
      actitudPaciente: body.actitudPaciente || null,
      notasMedico: body.notasMedico || null,
      proximaCita: body.proximaCita ? new Date(body.proximaCita) : null,
      tipoAtencion: body.tipoAtencion || null,
      formaPago: body.formaPago || null,
      valorConsulta: body.valorConsulta ? parseFloat(body.valorConsulta) : null,
      valorMedicamentos: body.valorMedicamentos ? parseFloat(body.valorMedicamentos) : null,
      detalleMedicamentos: body.detalleMedicamentos || null,
    };

    const historia = await prisma.historia.create({
      data: data,
      include: { cliente: true, examenes: true }
    });

    // Guardar examenes si vienen
    if (body.examenes && Array.isArray(body.examenes) && body.examenes.length > 0) {
      for (const examen of body.examenes) {
        if (examen.imagen) {
          await prisma.examen.create({
            data: {
              nombre: examen.nombre || 'Examen',
              imagen: examen.imagen,
              historiaId: historia.id
            }
          });
        }
      }
      const historiaConExamenes = await prisma.historia.findUnique({
        where: { id: historia.id },
        include: { cliente: true, examenes: true }
      });
      console.log("Historia guardada con examenes ID:", historia.id);
      return res.status(201).json(historiaConExamenes);
    }

    console.log("Historia guardada OK ID:", historia.id);
    res.status(201).json(historia);
  } catch (error) {
    console.error("ERROR AL CREAR HISTORIA:", error);
    res.status(500).json({ error: 'Error al crear historia', details: error.message });
  }
});

app.put('/api/historias/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    let observaciones = body.observaciones;
    if (!observaciones || observaciones.trim() === '') {
      observaciones = body.diagnostico || body.notasMedico || "Consulta FUNDAMUFA";
    }

    const historia = await prisma.historia.update({
      where: { id: parseInt(id) },
      data: {
        observaciones: observaciones,
        valor: body.valor ? parseFloat(body.valor) : body.valorConsulta ? parseFloat(body.valorConsulta) : null,
        tipoPago: body.tipoPago || body.formaPago || "pago",
        referido: body.referido || null,
        fecha: body.fecha ? new Date(body.fecha) : undefined,
        edad: body.edad ? parseInt(body.edad) : null,
        diagnostico: body.diagnostico || null,
        presionSistolica: body.presionSistolica ? String(body.presionSistolica) : null,
        presionDiastolica: body.presionDiastolica ? String(body.presionDiastolica) : null,
        temperatura: body.temperatura ? String(body.temperatura) : null,
        frecuenciaCardiaca: body.frecuenciaCardiaca ? String(body.frecuenciaCardiaca) : null,
        sistemas: body.sistemas || null,
        tipoPaciente: body.tipoPaciente || null,
        acompanante: body.acompanante || null,
        acompananteTelefono: body.acompananteTelefono || null,
        actitudPaciente: body.actitudPaciente || null,
        notasMedico: body.notasMedico || null,
        proximaCita: body.proximaCita ? new Date(body.proximaCita) : null,
        tipoAtencion: body.tipoAtencion || null,
        formaPago: body.formaPago || null,
        valorConsulta: body.valorConsulta ? parseFloat(body.valorConsulta) : null,
        valorMedicamentos: body.valorMedicamentos ? parseFloat(body.valorMedicamentos) : null,
        detalleMedicamentos: body.detalleMedicamentos || null,
      },
      include: { cliente: true, examenes: true }
    });

    if (body.examenes && body.examenes.length > 0) {
      for (const examen of body.examenes) {
        if (!examen.id && examen.imagen) {
          await prisma.examen.create({
            data: { nombre: examen.nombre || 'Examen', imagen: examen.imagen, historiaId: historia.id }
          });
        }
      }
      const actualizada = await prisma.historia.findUnique({ where: { id: historia.id }, include: { cliente: true, examenes: true } });
      return res.json(actualizada);
    }

    res.json(historia);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al actualizar historia', details: error.message }); }
});

app.delete('/api/historias/:id', authMiddleware, async (req, res) => {
  try { await prisma.historia.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Historia eliminada correctamente' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al eliminar historia' }); }
});

app.delete('/api/examenes/:id', authMiddleware, async (req, res) => {
  try { await prisma.examen.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Examen eliminado correctamente' }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al eliminar examen' }); }
});

// FORMULAS
app.get('/api/formulas', authMiddleware, async (req, res) => {
  try {
    const { search, clienteId } = req.query;
    let where = {};
    if (clienteId) where.clienteId = parseInt(clienteId);
    if (search) where.OR = [{ cliente: { nombre: { contains: search, mode: 'insensitive' } } }, { cliente: { cedula: { contains: search, mode: 'insensitive' } } }];
    const formulas = await prisma.formula.findMany({ where, orderBy: { fecha: 'desc' }, include: { cliente: { select: { id: true, nombre: true, cedula: true, telefono: true, direccion: true } }, items: true } });
    res.json(formulas);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener fórmulas' }); }
});
app.get('/api/formulas/:id', authMiddleware, async (req, res) => { try { const formula = await prisma.formula.findUnique({ where: { id: parseInt(req.params.id) }, include: { cliente: true, items: true } }); if (!formula) return res.status(404).json({ error: 'Fórmula no encontrada' }); res.json(formula); } catch (e) { res.status(500).json({ error: 'Error al obtener fórmula' }); } });
app.post('/api/formulas', authMiddleware, async (req, res) => { try { const { clienteId, items, fecha } = req.body; if (!clienteId || !items || items.length === 0) return res.status(400).json({ error: 'Cliente e items son requeridos' }); const formula = await prisma.formula.create({ data: { clienteId: parseInt(clienteId), fecha: fecha ? new Date(fecha) : new Date(), items: { create: items.map(item => ({ nombre: item.nombre, cantidad: parseInt(item.cantidad), unidad: item.unidad || 'FRASCOS' })) } }, include: { cliente: true, items: true } }); res.status(201).json(formula); } catch (e) { console.error(e); res.status(500).json({ error: 'Error al crear fórmula' }); } });
app.put('/api/formulas/:id', authMiddleware, async (req, res) => { try { await prisma.formulaItem.deleteMany({ where: { formulaId: parseInt(req.params.id) } }); const formula = await prisma.formula.update({ where: { id: parseInt(req.params.id) }, data: { fecha: req.body.fecha ? new Date(req.body.fecha) : undefined, items: { create: req.body.items.map(item => ({ nombre: item.nombre, cantidad: parseInt(item.cantidad), unidad: item.unidad || 'FRASCOS' })) } }, include: { cliente: true, items: true } }); res.json(formula); } catch (e) { res.status(500).json({ error: 'Error al actualizar fórmula' }); } });
app.delete('/api/formulas/:id', authMiddleware, async (req, res) => { try { await prisma.formula.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Fórmula eliminada correctamente' }); } catch (e) { res.status(500).json({ error: 'Error al eliminar fórmula' }); } });

// FACTURAS
app.get('/api/facturas', authMiddleware, async (req, res) => { try { const { search, clienteId } = req.query; let where = {}; if (clienteId) where.clienteId = parseInt(clienteId); if (search) { where.OR = [{ cliente: { nombre: { contains: search, mode: 'insensitive' } } }, { cliente: { cedula: { contains: search, mode: 'insensitive' } } }]; const searchNum = parseInt(search); if (!isNaN(searchNum)) where.OR.push({ numero: searchNum }); } const facturas = await prisma.factura.findMany({ where, orderBy: { fecha: 'desc' }, include: { cliente: { select: { id: true, nombre: true, cedula: true, telefono: true, direccion: true } }, items: true } }); res.json(facturas); } catch (e) { res.status(500).json({ error: 'Error al obtener facturas' }); } });
app.get('/api/facturas/:id', authMiddleware, async (req, res) => { try { const factura = await prisma.factura.findUnique({ where: { id: parseInt(req.params.id) }, include: { cliente: true, items: true } }); if (!factura) return res.status(404).json({ error: 'Factura no encontrada' }); res.json(factura); } catch (e) { res.status(500).json({ error: 'Error al obtener factura' }); } });
app.post('/api/facturas', authMiddleware, async (req, res) => { try { const { clienteId, items, fecha, vencimiento } = req.body; if (!clienteId || !items || items.length === 0) return res.status(400).json({ error: 'Cliente e items son requeridos' }); const ultimaFactura = await prisma.factura.findFirst({ orderBy: { numero: 'desc' } }); const nuevoNumero = ultimaFactura ? ultimaFactura.numero + 1 : 10001; const total = items.reduce((sum, item) => sum + (parseFloat(item.precioUnitario) * parseInt(item.cantidad)), 0); const factura = await prisma.factura.create({ data: { numero: nuevoNumero, clienteId: parseInt(clienteId), fecha: fecha ? new Date(fecha) : new Date(), vencimiento: vencimiento ? new Date(vencimiento) : null, total, saldo: total, items: { create: items.map(item => ({ cantidad: parseInt(item.cantidad), descripcion: item.descripcion, precioUnitario: parseFloat(item.precioUnitario), total: parseFloat(item.precioUnitario) * parseInt(item.cantidad) })) } }, include: { cliente: true, items: true } }); res.status(201).json(factura); } catch (e) { console.error(e); res.status(500).json({ error: 'Error al crear factura' }); } });
app.put('/api/facturas/:id', authMiddleware, async (req, res) => { try { await prisma.facturaItem.deleteMany({ where: { facturaId: parseInt(req.params.id) } }); const total = req.body.items.reduce((sum, item) => sum + (parseFloat(item.precioUnitario) * parseInt(item.cantidad)), 0); const factura = await prisma.factura.update({ where: { id: parseInt(req.params.id) }, data: { fecha: req.body.fecha ? new Date(req.body.fecha) : undefined, vencimiento: req.body.vencimiento ? new Date(req.body.vencimiento) : null, total, saldo: total, items: { create: req.body.items.map(item => ({ cantidad: parseInt(item.cantidad), descripcion: item.descripcion, precioUnitario: parseFloat(item.precioUnitario), total: parseFloat(item.precioUnitario) * parseInt(item.cantidad) })) } }, include: { cliente: true, items: true } }); res.json(factura); } catch (e) { res.status(500).json({ error: 'Error al actualizar factura' }); } });
app.delete('/api/facturas/:id', authMiddleware, async (req, res) => { try { await prisma.factura.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Factura eliminada correctamente' }); } catch (e) { res.status(500).json({ error: 'Error al eliminar factura' }); } });

// NOTAS
app.get('/api/notas', authMiddleware, async (req, res) => { try { const { estado, search } = req.query; let where = {}; if (estado) where.estado = estado; if (search) where.contenido = { contains: search, mode: 'insensitive' }; const notas = await prisma.nota.findMany({ where, orderBy: { fecha: 'desc' } }); res.json(notas); } catch (e) { res.status(500).json({ error: 'Error al obtener notas' }); } });
app.get('/api/notas/:id', authMiddleware, async (req, res) => { try { const nota = await prisma.nota.findUnique({ where: { id: parseInt(req.params.id) } }); if (!nota) return res.status(404).json({ error: 'Nota no encontrada' }); res.json(nota); } catch (e) { res.status(500).json({ error: 'Error al obtener nota' }); } });
app.post('/api/notas', authMiddleware, async (req, res) => { try { const { contenido, fecha, hora } = req.body; if (!contenido) return res.status(400).json({ error: 'El contenido es requerido' }); const nota = await prisma.nota.create({ data: { contenido, fecha: fecha ? new Date(fecha) : new Date(), hora: hora || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), estado: 'abierta' } }); res.status(201).json(nota); } catch (e) { res.status(500).json({ error: 'Error al crear nota' }); } });
app.put('/api/notas/:id', authMiddleware, async (req, res) => { try { const nota = await prisma.nota.update({ where: { id: parseInt(req.params.id) }, data: { contenido: req.body.contenido, fecha: req.body.fecha ? new Date(req.body.fecha) : undefined, hora: req.body.hora, estado: req.body.estado } }); res.json(nota); } catch (e) { res.status(500).json({ error: 'Error al actualizar nota' }); } });
app.patch('/api/notas/:id/estado', authMiddleware, async (req, res) => { try { if (!['abierta', 'cerrada'].includes(req.body.estado)) return res.status(400).json({ error: 'Estado inválido' }); const nota = await prisma.nota.update({ where: { id: parseInt(req.params.id) }, data: { estado: req.body.estado } }); res.json(nota); } catch (e) { res.status(500).json({ error: 'Error al cambiar estado de nota' }); } });
app.delete('/api/notas/:id', authMiddleware, async (req, res) => { try { await prisma.nota.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Nota eliminada correctamente' }); } catch (e) { res.status(500).json({ error: 'Error al eliminar nota' }); } });

// CITAS - AGREGADO PARA QUE NO FALLE
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
    res.json(citas);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});
app.post('/api/citas-publicas', async (req, res) => {
  try {
    const { fecha, hora, nombre, cedula, celular, motivo } = req.body;
    if (!fecha || !hora || !nombre) return res.status(400).json({ error: 'Faltan datos' });
    const fechaISO = new Date(fecha);
    const inicioDia = new Date(fechaISO.setHours(0,0,0,0));
    const finDia = new Date(fechaISO.setHours(23,59,59,999));
    const existente = await prisma.cita.findFirst({ where: { fecha: { gte: inicioDia, lte: finDia }, hora } });
    if (existente) return res.status(400).json({ error: 'Hora ya ocupada' });
    const cita = await prisma.cita.create({ data: { fecha: new Date(fecha), hora, nombre, cedula: cedula || null, celular: celular || '-', motivo: motivo || null, estado: 'ocupada' } });
    res.json(cita);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al agendar', details: e.message }); }
});

app.get('/api/health', (req, res) => { res.json({ status: 'OK', message: 'FUNDAMUFA - API funcionando - Dr. Jorge Charrasquiel' }); });

module.exports = app;
