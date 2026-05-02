const { prisma } = require('../prisma/client');

async function pickDoctorWithLeastPatients() {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      _count: { select: { patients: true } },
    },
  });
  if (!doctors || doctors.length === 0) return null;

  let min = Infinity;
  for (const d of doctors) {
    const c = d?._count?.patients ?? 0;
    if (c < min) min = c;
  }
  const candidates = doctors.filter((d) => (d?._count?.patients ?? 0) === min);
  if (candidates.length === 0) return doctors[0].id;

  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx].id;
}

module.exports = {
  pickDoctorWithLeastPatients,
};

