import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const citas = await prisma.cita.findMany({ orderBy: [{ fecha: 'asc' }, { hora: 'asc' }] });
      return res.status(200).json(citas);
    }
    if (req.method === 'POST') {
      const { fecha, hora, nombre, cedula, celular, motivo, estado } = req.body;
      const fechaISO = new Date(fecha);
      const inicioDia = new Date(fechaISO.setHours(0,0,0,0));
      const finDia = new Date(fechaISO.setHours(23,59,59,999));
      const existente = await prisma.cita.findFirst({
        where: { fecha: { gte: inicioDia, lte: finDia }, hora }
      });
      if (existente) {
        const actualizada = await prisma.cita.update({
          where: { id: existente.id },
          data: { nombre, cedula, celular, motivo, estado }
        });
        return res.status(200).json(actualizada);
      }
      const cita = await prisma.cita.create({
        data: {
          fecha: new Date(fecha),
          hora, nombre: nombre || 'BLOQUEADO',
          cedula: cedula || null, celular: celular || '-',
          motivo: motivo || null, estado: estado || 'ocupada'
        }
      });
      return res.status(200).json(cita);
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await prisma.cita.delete({ where: { id: Number(id) } });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
