const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.mediaEntry.deleteMany();

  await prisma.mediaEntry.createMany({
    data: [
      {
        title: "The Last of Us",
        type: "GAME",
        status: "WATCHING",
        rating: 9,
        notes: "Ein sehr stimmungsvolles Spiel mit starker Story.",
        platform: "PlayStation 5",
        playtimeMinutes: 1100,
        watchedAt: new Date("2026-09-12T00:00:00.000Z"),
      },
      {
        title: "The Bear",
        type: "SERIES",
        status: "COMPLETED",
        rating: 8,
        notes: "Perfekte zweite Staffel, sehr nervig und charmant zugleich.",
        season: 2,
        episode: 8,
        watchedAt: new Date("2026-09-14T00:00:00.000Z"),
      },
      {
        title: "Dune: Part Two",
        type: "MOVIE",
        status: "PLANNED",
        rating: 9,
        notes: "Noch offen, aber sehr vielversprechend.",
        watchedAt: new Date("2026-10-03T00:00:00.000Z"),
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
