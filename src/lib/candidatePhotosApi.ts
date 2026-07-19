import { supabase } from "./supabaseClient";

const CANDIDATE_PHOTOS_BUCKET = "candidate-photos";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  return supabase;
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function uploadCandidatePhoto(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La foto supera el limite de 5 MB.");
  }

  const client = requireSupabase();
  const extension = getFileExtension(file);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const path = `candidatos/${fileName}`;

  const { error } = await client.storage.from(CANDIDATE_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from(CANDIDATE_PHOTOS_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}
