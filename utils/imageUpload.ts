import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image to be under a certain size (default 100KB)
 * @param uri The local URI of the image
 * @param maxSizeKB The maximum size in KB
 * @returns The URI of the compressed image and the blob
 */
const compressImageIfNeeded = async (uri: string, maxSizeKB: number = 100): Promise<{ uri: string, blob: Blob }> => {
  let compression = 0.8;
  let width = 1200;
  let currentUri = uri;
  let currentBlob: Blob;

  // Initial fetch to check current size
  const initialResponse = await fetch(uri);
  currentBlob = await initialResponse.blob();

  // If already small enough, just return
  if (currentBlob.size <= maxSizeKB * 1024) {
    return { uri, blob: currentBlob };
  }

  // Iteratively reduce quality and/or size
  while (currentBlob.size > maxSizeKB * 1024 && (compression > 0.1 || width > 400)) {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress: compression, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    currentUri = manipResult.uri;
    const response = await fetch(currentUri);
    currentBlob = await response.blob();

    if (currentBlob.size <= maxSizeKB * 1024) {
      break;
    }

    // Reduce quality first, then width
    if (compression > 0.2) {
      compression -= 0.2;
    } else {
      width -= 200;
      compression = 0.5; // Reset quality for smaller width
    }
    
    if (width < 200) break; // Don't go too small
  }

  return { uri: currentUri, blob: currentBlob };
};

export const uploadImage = async (uri: string, generateUploadUrl: () => Promise<string>) => {
  try {
    // Compress image before upload
    const { blob } = await compressImageIfNeeded(uri, 100);
    
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    
    if (!result.ok) {
      throw new Error(`Upload failed with status ${result.status}`);
    }
    
    const { storageId } = await result.json();
    return storageId;
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
};