const AVATAR_MAX_DIMENSION = 512;
const AVATAR_QUALITY = 0.85;
const AVATAR_MIME_TYPE = "image/webp";

function scaleDimensions(
  width: number,
  height: number,
  maxSize: number,
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  const ratio = Math.min(maxSize / width, maxSize / height);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to compress image"));
      },
      type,
      quality,
    );
  });
}

export async function compressAvatar(file: File): Promise<File> {
  const image = await loadImage(file);
  const { width, height } = scaleDimensions(
    image.width,
    image.height,
    AVATAR_MAX_DIMENSION,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to compress image");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, AVATAR_MIME_TYPE, AVATAR_QUALITY);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";

  return new File([blob], `${baseName}.webp`, {
    type: AVATAR_MIME_TYPE,
    lastModified: Date.now(),
  });
}

export async function prepareAvatarFormData(
  formData: FormData,
): Promise<FormData | null> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const compressed = await compressAvatar(file);
  const uploadData = new FormData();
  uploadData.set("avatar", compressed);

  return uploadData;
}
