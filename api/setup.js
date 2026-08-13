const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Cita" (
        id TEXT PRIMARY KEY,
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
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Cliente" (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        cedula TEXT DEFAULT '',
        celular TEXT NOT NULL,
        email TEXT DEFAULT ''
      );
    `);
    res.json({ ok: true, msg: "Tablas creadas" });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
