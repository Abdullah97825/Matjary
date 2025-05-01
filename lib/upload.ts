import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Base upload directory in the public folder
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
export const IMAGE_DIR = path.join(UPLOAD_DIR, 'images');
export const ATTACHMENT_DIR = path.join(UPLOAD_DIR, 'attachments');

// Ensure upload directories exist
await mkdir(UPLOAD_DIR, { recursive: true });
await mkdir(IMAGE_DIR, { recursive: true });
await mkdir(ATTACHMENT_DIR, { recursive: true });

// Generate a unique filename
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  return `${timestamp}-${random}${extension}`;
}

// Save product image - Next.js will handle optimization via its Image component
export async function saveProductImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(IMAGE_DIR, filename);

  await writeFile(filepath, buffer);

  // Use relative URL instead of absolute URL for consistency
  return `/public/uploads/images/${filename}`;
}

// Save product attachment
export async function saveProductAttachment(file: File): Promise<{ url: string; name: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(ATTACHMENT_DIR, filename);

  await writeFile(filepath, buffer);

  return {
    url: `/uploads/attachments/${filename}`,
    name: file.name
  };
}

// Delete file from uploads
export async function deleteUploadedFile(url: string): Promise<void> {
  const relativePath = url.split('/uploads/')[1];
  if (!relativePath) return;

  const filepath = path.join(UPLOAD_DIR, relativePath);
  try {
    await unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export async function deleteProductImage(filename: string): Promise<{ fileDeleted: boolean }> {
  const filepath = path.join(IMAGE_DIR, path.basename(filename));
  try {
    await unlink(filepath);
    return { fileDeleted: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      // File doesn't exist, which is fine
      return { fileDeleted: false };
    }
    // Other errors should still throw
    throw error;
  }
}

export async function deleteProductAttachment(filename: string): Promise<{ fileDeleted: boolean }> {
  const filepath = path.join(ATTACHMENT_DIR, path.basename(filename));
  try {
    await unlink(filepath);
    return { fileDeleted: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      // File doesn't exist, which is fine
      return { fileDeleted: false };
    }
    // Other errors should still throw
    throw error;
  }
}

// Save banner image
export async function savePromotionalBannerImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(IMAGE_DIR, 'banners', filename);

  // Ensure the banners directory exists
  await mkdir(path.join(IMAGE_DIR, 'banners'), { recursive: true });
  await writeFile(filepath, buffer);

  // Use relative URL instead of absolute URL for consistency
  return `/public/uploads/images/banners/${filename}`;
}

// Save category image
export async function saveCategoryImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(IMAGE_DIR, 'categories', filename);

  // Ensure the categories directory exists
  await mkdir(path.join(IMAGE_DIR, 'categories'), { recursive: true });
  await writeFile(filepath, buffer);

  // Use relative URL instead of absolute URL for consistency
  return `/public/uploads/images/categories/${filename}`;
}

// Save brand image
export async function saveBrandImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(IMAGE_DIR, 'brands', filename);

  // Ensure the brands directory exists
  await mkdir(path.join(IMAGE_DIR, 'brands'), { recursive: true });
  await writeFile(filepath, buffer);

  // Use relative URL instead of absolute URL for consistency
  return `/public/uploads/images/brands/${filename}`;
} 