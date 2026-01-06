export const uploadImage = async (uri: string, generateUploadUrl: () => Promise<string>) => {
  try {
    const postUrl = await generateUploadUrl();
    const response = await fetch(uri);
    const blob = await response.blob();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    const { storageId } = await result.json();
    return storageId;
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
};
