import { connectDB, disconnectDB, prisma } from "../src/config/db.js";

async function main() {
    await connectDB();

    const categories = [
        { name: "Nature" },
        { name: "Technology" },
        { name: "Food" },
        { name: "Travel" },
        { name: "Art" },
    ];

    await prisma.category.createMany({ data: categories, skipDuplicates: true });

    console.log("Categories seeded successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await disconnectDB();
    });
