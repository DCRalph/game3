import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface WhiteCard {
  text: string;
  pack: number;
}

interface BlackCard {
  text: string;
  pick: number;
  pack: number;
}

interface DeckData {
  name: string;
  white: WhiteCard[];
  black: BlackCard[];
}

async function main() {
  console.log("Starting Cards Against Humanity cards seeding...");

  console.log("you already did this dumbass")
  return;

  console.log("Deleting all decks...");
  await db.cAHDeck.deleteMany();
  console.log("Deleting all cards...");
  await db.cAHCard.deleteMany();

  try {
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), "prisma", "cah-cards-full.json");
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const decks = JSON.parse(jsonData) as DeckData[];

    console.log(`Found ${decks.length} decks to process`);

    let totalDecksCreated = 0;
    let totalCardsCreated = 0;

    for (const deckData of decks) {
      console.log(`\nProcessing deck: "${deckData.name}"`);

      // Create the deck
      const deck = await db.cAHDeck.create({
        data: {
          name: deckData.name,
          isActive: true,

        },
      });

      totalDecksCreated++;
      console.log(`✅ Created deck with ID: ${deck.id}`);

      // Process white cards
      if (deckData.white && deckData.white.length > 0) {
        console.log(`  Processing ${deckData.white.length} white cards...`);

        const whiteCardsData = deckData.white.map(card => ({
          type: "WHITE" as const,
          deckId: deck.id,
          content: card.text,
          pick: null,
          isActive: true,
        }));

        await db.cAHCard.createMany({
          data: whiteCardsData,
        });

        totalCardsCreated += whiteCardsData.length;
        console.log(`  ✅ Created ${whiteCardsData.length} white cards`);
      }

      // Process black cards
      if (deckData.black && deckData.black.length > 0) {
        console.log(`  Processing ${deckData.black.length} black cards...`);

        const blackCardsData = deckData.black.map(card => ({
          type: "BLACK" as const,
          deckId: deck.id,
          content: card.text,
          pick: card.pick,
          isActive: true,
        }));

        await db.cAHCard.createMany({
          data: blackCardsData,
        });

        totalCardsCreated += blackCardsData.length;
        console.log(`  ✅ Created ${blackCardsData.length} black cards`);
      }

      console.log(`✅ Completed deck: "${deckData.name}"`);
    }

    const whiteCardCount = await db.cAHCard.count({
      where: {
        type: "WHITE",
      },
    });
    const blackCardCount = await db.cAHCard.count({
      where: {
        type: "BLACK",
      },
    });

    console.log(`\nSeeding completed successfully!`);
    console.log(`Summary:`);
    console.log(`   - Decks created: ${totalDecksCreated}`);
    console.log(`   - Cards created: ${totalCardsCreated}`);
    console.log(`   - White cards created: ${whiteCardCount}`);
    console.log(`   - Black cards created: ${blackCardCount}`);

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });