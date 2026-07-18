import mongoose from "mongoose";

/**
 * Mengembalikan GridFSBucket untuk koleksi "laporan".
 *
 * ✅ Tidak lagi menggunakan globalThis sebagai cache permanen.
 * Bucket dibuat fresh dari mongoose.connection.db setiap kali dipanggil.
 * Ini aman karena:
 *  - mongoose.connection sudah singleton (tidak dibuat ulang tiap request)
 *  - GridFSBucket hanya menyimpan referensi ke db, tidak membuka koneksi baru
 *  - Menghindari stale bucket jika MongoDB terputus dan reconnect
 */
export const getBucket = () => {
  const db = mongoose.connection?.db;

  if (!db) {
    throw new Error(
      "MongoDB belum connect. Pastikan connectDB() sudah dipanggil dan await-ed sebelum server menerima request."
    );
  }

  // ✅ Buat bucket langsung dari koneksi aktif — selalu fresh, tidak stale
  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: "laporan",
  });
};
