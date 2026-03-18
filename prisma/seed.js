import { connectDB, disconnectDB, prisma } from "../src/config/db.js";

async function main() {
    await connectDB();

    console.log("Cleaning up database...");
    await prisma.imageTag.deleteMany();
    await prisma.image.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();

    console.log("Seeding categories...");
    const categories = [
        { name: "Nature" },
        { name: "Architecture" },
        { name: "Food" },
        { name: "Travel" },
        { name: "Technology" },
        { name: "Fashion" },
        { name: "Minimalism" },
    ];

    const createdCategories = [];
    for (const cat of categories) {
        const createdCat = await prisma.category.create({ data: cat });
        createdCategories.push(createdCat);
    }

    console.log("Seeding tags...");
    const tags = [
        "Mountain", "River", "Forest", "Modern", "Urban", "Pizza", "Coffee", 
        "Laptop", "Future", "Street", "Outfit", "Sunset", "Beach", "Interior",
        "Minimal", "Aesthetic", "Portrait", "Wild"
    ];

    const createdTags = [];
    for (const tag of tags) {
        const createdTag = await prisma.tag.create({ data: { name: tag } });
        createdTags.push(createdTag);
    }

    console.log("Seeding images...");
    const imageData = [
        // Nature (Cat ID: Nature)
        { name: "Majestic Mountain", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", category: "Nature", tags: ["Mountain", "Wild", "Nature"] },
        { name: "Deep Forest", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", category: "Nature", tags: ["Forest", "Wild"] },
        { name: "Golden Sunset", url: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8", category: "Nature", tags: ["Sunset", "Nature"] },
        
        // Architecture
        { name: "Modern Skyscraper", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab", category: "Architecture", tags: ["Urban", "Modern"] },
        { name: "Minimal Concrete", url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85", category: "Architecture", tags: ["Minimal", "Aesthetic"] },
        
        // Food
        { name: "Cozy Coffee", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", category: "Food", tags: ["Coffee", "Minimal"] },
        { name: "Fresh Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591", category: "Food", tags: ["Pizza", "Food"] },
        
        // Travel
        { name: "Tropical Beach", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", category: "Travel", tags: ["Beach", "Travel", "Nature"] },
        
        // Technology
        { name: "Future Desk", url: "https://images.unsplash.com/photo-1518770660439-4636190af475", category: "Technology", tags: ["Future", "Laptop"] },
        { name: "Code Night", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97", category: "Technology", tags: ["Laptop", "Urban"] },
    ];

    // Duplicate some data to make it "Yuea-Yuea"
    for (let i = 0; i < 50; i++) {
        const randomCat = createdCategories[Math.floor(Math.random() * createdCategories.length)];
        
        // Pick 2-4 unique random tags
        const shuffledTags = [...createdTags].sort(() => 0.5 - Math.random());
        const tagCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 tags
        const randomTags = shuffledTags.slice(0, tagCount);
        
        // Random masonry height
        const width = 600;
        const height = Math.floor(Math.random() * 600) + 600; // 600 to 1200

        const image = await prisma.image.create({
            data: {
                name: `Inspiration ${i + 1}`,
                url: `https://plus.unsplash.com/premium_photo-1664361411129-3132c3bbd6b5?w=${width}&h=${height}&auto=format&q=60&sig=${i}`,
                categoryId: randomCat.id,
                width,
                height,
            }
        });

        for (const tag of randomTags) {
            await prisma.imageTag.create({
                data: { imageId: image.id, tagId: tag.id }
            });
        }
    }

    for (const data of imageData) {
        const category = createdCategories.find(c => c.name === data.category);
        if (category) {
            const width = 600;
            const height = Math.floor(Math.random() * 400) + 700; // 700 to 1100
            
            const image = await prisma.image.create({
                data: {
                    name: data.name,
                    url: `${data.url}?w=${width}&h=${height}&auto=format&q=80`,
                    categoryId: category.id,
                    width,
                    height,
                }
            });

            for (const tagName of data.tags) {
                const tag = createdTags.find(t => t.name === tagName);
                if (tag) {
                    await prisma.imageTag.create({
                        data: { imageId: image.id, tagId: tag.id }
                    });
                }
            }
        }
    }

    console.log("Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error("Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await disconnectDB();
    });
