/**
 * Client-side avatar upload helper. Resizes the image to a 256-pixel square
 * via canvas to keep storage cheap, uploads to the user's folder in the
 * 'avatars' Supabase Storage bucket, and returns the public URL.
 */
import { createClient } from "@/lib/supabase/client";

const MAX_DIM = 256;

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(
        MAX_DIM / img.width,
        MAX_DIM / img.height,
        1,
      );
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D unsupported."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Resize failed.")),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please pick an image file.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image is too big (max 10 MB before resize).");
  }

  const blob = await resizeImage(file);
  const supabase = createClient();
  // Unique filename per upload — old ones become orphans (cheap on free tier).
  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, blob, {
      cacheControl: "31536000",
      contentType: "image/jpeg",
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
