// Script to update absolute URLs to relative URLs in the database
import { prisma } from "../lib/prisma";

async function fixImageUrls() {
    console.log("Starting image URL fix script...");

    // Fix product images
    const productImages = await prisma.productImage.findMany();
    let updatedProductCount = 0;

    for (const image of productImages) {
        if (image.url.startsWith('http://') || image.url.startsWith('https://')) {
            try {
                // Extract the path part of the URL (after the domain)
                const urlParts = new URL(image.url);
                const newUrl = urlParts.pathname;

                console.log(`Updating product image URL: ${image.url} -> ${newUrl}`);

                await prisma.productImage.update({
                    where: { id: image.id },
                    data: { url: newUrl }
                });

                updatedProductCount++;
            } catch (error) {
                console.error(`Failed to update product image ${image.id}:`, error);
            }
        }
    }

    console.log(`Updated ${updatedProductCount} product image URLs`);

    // Fix banner images
    const banners = await prisma.promotionalBanner.findMany();
    let updatedBannerCount = 0;

    for (const banner of banners) {
        if (banner.imageUrl && (banner.imageUrl.startsWith('http://') || banner.imageUrl.startsWith('https://'))) {
            try {
                // Extract the path part of the URL (after the domain)
                const urlParts = new URL(banner.imageUrl);
                const newUrl = urlParts.pathname;

                console.log(`Updating banner image URL: ${banner.imageUrl} -> ${newUrl}`);

                await prisma.promotionalBanner.update({
                    where: { id: banner.id },
                    data: { imageUrl: newUrl }
                });

                updatedBannerCount++;
            } catch (error) {
                console.error(`Failed to update banner image ${banner.id}:`, error);
            }
        }
    }

    console.log(`Updated ${updatedBannerCount} banner image URLs`);

    // Fix category images
    const categories = await prisma.category.findMany();
    let updatedCategoryCount = 0;

    for (const category of categories) {
        if (category.imageUrl && (category.imageUrl.startsWith('http://') || category.imageUrl.startsWith('https://'))) {
            try {
                // Extract the path part of the URL (after the domain)
                const urlParts = new URL(category.imageUrl);
                const newUrl = urlParts.pathname;

                console.log(`Updating category image URL: ${category.imageUrl} -> ${newUrl}`);

                await prisma.category.update({
                    where: { id: category.id },
                    data: { imageUrl: newUrl }
                });

                updatedCategoryCount++;
            } catch (error) {
                console.error(`Failed to update category image ${category.id}:`, error);
            }
        }
    }

    console.log(`Updated ${updatedCategoryCount} category image URLs`);
    console.log(`Total updated: ${updatedProductCount + updatedBannerCount + updatedCategoryCount} image URLs`);

    // Close the Prisma client
    await prisma.$disconnect();
    console.log("Image URL fix script completed");
}

// Run the function
fixImageUrls()
    .catch((error) => {
        console.error("Error fixing image URLs:", error);
        process.exit(1);
    }); 