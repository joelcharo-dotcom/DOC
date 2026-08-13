const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    // Borra tabla vieja con id TEXT
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Cita"`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Cita" (
        id SERIAL PRIMARY KEY,
        fecha TIMESTAMP(3) NOT NULL,
        hora TEXT NOT NULL,
        nombre TEXT NOT NULL,
        cedula TEXT DEFAULT '',
        celular TEXT NOT NULL,
        motivo TEXT DEFAULT '',
        estado TEXT DEFAULT 'ocupada',
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.json({ ok: true, msg: "Tabla Cita recreada con ID Int - lista para agendar" });
  } catch(e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};
