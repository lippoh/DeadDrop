/**
 * Compresses an image file to a base64 string.
 * Resizes to max dimension and compresses JPEG quality.
 */
export function compressImage(
  file: File,
  maxDimension: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down if larger than max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Checks if a string is a base64-encoded image data URI.
 */
export function isImageContent(content: string): boolean {
  return content.startsWith("data:image/");
}

/**
 * Extracts the image data URI from message content.
 * Format: "data:image/...\n<optional caption text>"
 */
export function extractImageAndCaption(content: string): {
  image: string;
  caption: string;
} | null {
  const newlineIndex = content.indexOf("\n");
  if (newlineIndex === -1) {
    // Entire content is the image
    if (isImageContent(content)) {
      return { image: content, caption: "" };
    }
    return null;
  }

  const firstPart = content.substring(0, newlineIndex);
  const rest = content.substring(newlineIndex + 1);

  if (isImageContent(firstPart)) {
    return { image: firstPart, caption: rest.trim() };
  }

  return null;
}