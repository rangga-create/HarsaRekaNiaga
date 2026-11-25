"use client";

import { v4 as uuid } from "uuid";
import { auth } from "@/lib/firebase";
import type { MediaAttachment } from "@/lib/data";

export const MAX_MEDIA_BYTES = 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateMediaFile(file: File) {
  const ok = file.type.startsWith("image/") || file.type.startsWith("video/");
  if (!ok) throw new Error(`${file.name}: hanya foto atau video yang diizinkan.`);
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error(`${file.name} melebihi 1MB. Kompres dulu sebelum upload.`);
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Gagal membaca gambar.")); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function compressImage(file: File): Promise<File> {
  const img = await loadImage(file);
  let width = img.width;
  let height = img.height;
  const maxDim = 1920;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung kompresi gambar.");

  let quality = 0.82;
  let blob: Blob | null = null;
  for (let i = 0; i < 12; i++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob && blob.size <= MAX_MEDIA_BYTES) break;
    if (quality > 0.35) quality -= 0.1;
    else {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
      quality = 0.72;
    }
  }

  if (!blob || blob.size > MAX_MEDIA_BYTES) {
    throw new Error(`${file.name} masih terlalu besar setelah dikompres. Gunakan gambar/video lebih kecil.`);
  }
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}-compressed.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

async function compressVideo(file: File): Promise<File> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Browser tidak mendukung kompresi video.");
  }
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Gagal membaca video."));
    });

    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
    const height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser tidak mendukung kompresi video.");

    const stream = canvas.captureStream(24);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 700_000 });

    const result = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onerror = () => reject(new Error("Gagal mengompres video."));
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    });

    await video.play();
    recorder.start(250);
    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, width, height);
      requestAnimationFrame(draw);
    };
    draw();
    await new Promise<void>((resolve) => { video.onended = () => resolve(); });
    recorder.stop();
    const blob = await result;
    if (blob.size > MAX_MEDIA_BYTES) {
      throw new Error(`${file.name} masih ${formatBytes(blob.size)} setelah kompres. Potong/durasi pendekkan video atau pakai video lebih kecil.`);
    }
    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File([blob], `${baseName}-compressed.webm`, { type: "video/webm", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressMediaFile(file: File): Promise<File> {
  if (file.size <= MAX_MEDIA_BYTES) return file;
  if (file.type.startsWith("image/")) return compressImage(file);
  if (file.type.startsWith("video/")) return compressVideo(file);
  throw new Error(`${file.name}: tipe file tidak didukung.`);
}

export async function uploadMediaFiles(files: File[], folder: string): Promise<MediaAttachment[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary belum dikonfigurasi. Isi NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  const user = auth?.currentUser;
  if (!user) throw new Error("Silakan login terlebih dahulu.");

  const uploaded: MediaAttachment[] = [];
  for (const file of files) {
    validateMediaFile(file);
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    form.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: form });
    const data = await res.json().catch(() => null) as { secure_url?: string; public_id?: string; resource_type?: string; bytes?: number; error?: { message?: string } } | null;
    if (!res.ok || !data?.secure_url || !data?.public_id) {
      throw new Error(data?.error?.message || `Gagal upload ${file.name} ke Cloudinary.`);
    }

    const resourceType = data.resource_type === "video" ? "video" : data.resource_type === "raw" ? "raw" : "image";
    uploaded.push({
      id: uuid(),
      url: data.secure_url,
      path: data.public_id,
      type: resourceType === "video" ? "video" : "image",
      name: file.name,
      size: data.bytes ?? file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.email || user.uid,
      resourceType,
      provider: "cloudinary",
    });
  }
  return uploaded;
}

export async function deleteMediaFiles(items: MediaAttachment[]) {
  if (!items.length) return;
  const user = auth?.currentUser;
  if (!user) throw new Error("Silakan login terlebih dahulu.");
  const token = await user.getIdToken();
  const failures: string[] = [];

  for (const item of items) {
    if (item.provider && item.provider !== "cloudinary") {
      failures.push(`${item.name}: media lama (non-Cloudinary) tidak bisa dihapus otomatis.`);
      continue;
    }
    if (!item.path) {
      failures.push(`${item.name}: public_id tidak ditemukan.`);
      continue;
    }
    const res = await fetch("/api/media/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ publicId: item.path, resourceType: item.resourceType || (item.type === "video" ? "video" : "image") }),
    });
    const data = await res.json().catch(() => null) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !data?.ok) {
      failures.push(`${item.name}: ${data?.error || "gagal hapus di Cloudinary"}`);
    }
  }

  if (failures.length) {
    throw new Error(`Gagal hapus media di Cloudinary. Data tidak dihapus agar tidak tersisa orphan.\n${failures.join("\n")}`);
  }
}
