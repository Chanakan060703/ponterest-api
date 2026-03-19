import { connectDB, disconnectDB, prisma } from "../src/config/db.js";

async function main() {
    await connectDB();

    if (
        process.env.NODE_ENV === "production" &&
        process.env.SEED_ALLOW_DESTRUCTIVE !== "true"
    ) {
        throw new Error("Refusing to run destructive seed in production without SEED_ALLOW_DESTRUCTIVE=true");
    }

    await prisma.$transaction(async (tx) => {
        console.log("Cleaning up database...");
        await tx.imageTag.deleteMany();
        await tx.image.deleteMany();
        await tx.tag.deleteMany();
        await tx.category.deleteMany();

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
            const createdCat = await tx.category.create({ data: cat });
            createdCategories.push(createdCat);
        }

        console.log("Seeding tags...");
        const tags = [
            "Mountain", "River", "Forest", "Modern", "Urban", "Pizza", "Coffee",
            "Laptop", "Future", "Street", "Outfit", "Sunset", "Beach", "Interior",
            "Minimal", "Aesthetic", "Portrait", "Wild", "Nature", "Food", "Travel"
        ];

        const createdTags = [];
        for (const tag of tags) {
            const createdTag = await tx.tag.create({ data: { name: tag } });
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
            
            // Wider range for more obvious variety
            const width = 600;
            const height = Math.floor(Math.random() * 800) + 400; // 400 to 1200
            
            // Use different IDs for more variety (cycling through a small list or using different high-quality IDs)
            const photoIds = [
                "1542291026-7eec264c27ff", // Nike red
                "1512446819027-e7f18ae83423", // Code laptop
                "1558655146-d09347e92766", // Minimal architecture
                "1523275335684-37898b6baf30", // Watch
                "1496181133206-80ce9b88a853", // Laptop desk
                "1505740420928-5e560c06d30e", // Headphones
                "1481349518771-20055b2a7b24", // Yellow banana
                "1526170315870-ef039600e112", // Camera
                "1541963463532-d68292c34b19", // Book
                "1572635196237-14b3f281503f"  // Chair
            ];
            const photoId = photoIds[i % photoIds.length];

            const image = await tx.image.create({
                data: {
                    name: `Inspiration ${i + 1}`,
                    url: `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=60`,
                    categoryId: randomCat.id,
                    width,
                    height,
                }
            });

            for (const tag of randomTags) {
                await tx.imageTag.create({
                    data: { imageId: image.id, tagId: tag.id }
                });
            }
        }

        for (const data of imageData) {
            const category = createdCategories.find(c => c.name === data.category);
            if (category) {
                const width = 600;
                const height = Math.floor(Math.random() * 700) + 500; // 500 to 1200
                
                const image = await tx.image.create({
                    data: {
                        name: data.name,
                        url: `${data.url}?w=${width}&h=${height}&fit=crop&auto=format&q=80`, // Using fit=crop
                        categoryId: category.id,
                        width,
                        height,
                    }
                });

                for (const tagName of data.tags) {
                    const tag = createdTags.find(t => t.name === tagName);
                    if (tag) {
                        await tx.imageTag.create({
                            data: { imageId: image.id, tagId: tag.id }
                        });
                    }
                }
            }
        }

        console.log("Database seeded successfully!");
    });
}

main()
    .catch((e) => {
        console.error("Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await disconnectDB();
    });
