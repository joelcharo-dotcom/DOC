const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth simple
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  try {
    if (req.method === 'GET') {
      const { search, clienteId } = req.query;
      let where = {};
      if (clienteId) where.clienteId = parseInt(clienteId);
      if (search) {
        where.OR = [
          { observaciones: { contains: search, mode: 'insensitive' } },
          { cliente: { nombre: { contains: search, mode: 'insensitive' } } }
        ];
      }
      const historias = await prisma.historia.findMany({
        where,
        orderBy: { fecha: 'desc' },
        include: { cliente: true, examenes: true }
      });
      return res.status(200).json(historias);
    }

    if (req.method === 'POST') {
      const body = req.body;
      console.log("GUARDANDO HISTORIA:", body);
      
      const clienteId = parseInt(body.clienteId);
      if (!clienteId || isNaN(clienteId)) {
        return res.status(400).json({ error: 'Falta paciente' });
      }

      let observaciones = body.observaciones ? String(body.observaciones).trim() : "";
      if (!observaciones) observaciones = "Consulta FUNDAMUFA";

      const historia = await prisma.historia.create({
        data: {
          clienteId: clienteId,
          observaciones: observaciones,
          valor: body.valor ? parseFloat(body.valor) : 0,
          tipoPago: body.tipoPago || "pago",
          referido: body.referido || null,
          fecha: body.fecha ? new Date(body.fecha) : new Date()
        },
        include: { cliente: true, examenes: true }
      });

      // Guardar exámenes si hay
      if (body.examenes && Array.isArray(body.examenes)) {
        for (const ex of body.examenes) {
          if (ex.imagen) {
            await prisma.examen.create({
              data: {
                nombre: ex.nombre || 'Examen',
                imagen: ex.imagen,
                historiaId: historia.id
              }
            });
          }
        }
      }

      console.log("HISTORIA OK:", historia.id);
      return res.status(201).json(historia);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const body = req.body;
      let observaciones = body.observaciones ? String(body.observaciones).trim() : "Consulta FUNDAMUFA";
      
      const historia = await prisma.historia.update({
        where: { id: parseInt(id) },
        data: {
          observaciones,
          valor: body.valor ? parseFloat(body.valor) : 0,
          tipoPago: body.tipoPago || "pago",
          referido: body.referido || null
        },
        include: { cliente: true, examenes: true }
      });
      return res.json(historia);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await prisma.historia.delete({ where: { id: parseInt(id) } });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error("ERROR HISTORIAS.JS:", error);
    return res.status(500).json({ error: 'Error al guardar historia', details: error.message });
  }
}
