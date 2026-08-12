const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token - vuelva a iniciar sesión' });

  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const historia = await prisma.historia.findUnique({ 
          where: { id: parseInt(id) }, 
          include: { cliente: true, examenes: true } 
        });
        if (!historia) return res.status(404).json({ error: 'No encontrada' });
        return res.json(historia);
      }
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
      console.log("=== DATOS RECIBIDOS ===", JSON.stringify(body).substring(0, 500));
      
      const clienteId = parseInt(body.clienteId);
      if (!clienteId || isNaN(clienteId)) {
        return res.status(400).json({ error: 'Falta paciente - clienteId requerido', details: body });
      }

      let observaciones = body.observaciones ? String(body.observaciones).trim() : "";
      if (!observaciones || observaciones.length < 2) observaciones = "Consulta FUNDAMUFA - Dr. Jorge Charrasquiel";

      // VALOR: nunca null, siempre 0
      let valor = 0;
      if (body.valor !== null && body.valor !== undefined && body.valor !== '') {
        valor = parseFloat(body.valor);
        if (isNaN(valor)) valor = 0;
      }

      const historia = await prisma.historia.create({
        data: {
          clienteId: clienteId,
          observaciones: observaciones,
          valor: valor,
          tipoPago: body.tipoPago || "pago",
          referido: body.referido && body.referido.trim() !== '' ? body.referido.trim() : null,
          fecha: body.fecha ? new Date(body.fecha) : new Date()
        },
        include: { cliente: true, examenes: true }
      });

      // Guardar exámenes si hay - con try separado para que no falle todo
      if (body.examenes && Array.isArray(body.examenes) && body.examenes.length > 0) {
        try {
          for (const ex of body.examenes) {
            if (ex.imagen && ex.imagen.length > 10) {
              await prisma.examen.create({
                data: {
                  nombre: ex.nombre || 'Examen',
                  imagen: ex.imagen,
                  historiaId: historia.id
                }
              });
            }
          }
        } catch (exError) {
          console.error("Error guardando exámenes, pero historia sí guardada:", exError.message);
        }
      }

      console.log("HISTORIA GUARDADA EXITOSAMENTE:", historia.id);
      return res.status(201).json(historia);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID' });
      const body = req.body;
      let observaciones = body.observaciones ? String(body.observaciones).trim() : "Consulta FUNDAMUFA";
      let valor = 0;
      if (body.valor !== null && body.valor !== undefined && body.valor !== '') {
        valor = parseFloat(body.valor);
        if (isNaN(valor)) valor = 0;
      }
      
      const historia = await prisma.historia.update({
        where: { id: parseInt(id) },
        data: {
          observaciones,
          valor,
          tipoPago: body.tipoPago || "pago",
          referido: body.referido && body.referido.trim() !== '' ? body.referido.trim() : null
        },
        include: { cliente: true, examenes: true }
      });
      return res.json(historia);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await prisma.historia.delete({ where: { id: parseInt(id) } });
      return res.json({ ok: true, message: 'Eliminada' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error("=== ERROR REAL EN HISTORIAS.JS ===", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({ 
      error: 'Error al guardar historia', 
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  }
}
