# Backend Magang

Backend untuk project web-magang menggunakan Express.js, Mongoose, dan GridFS.

## Setup

1. Copy `.env.example` ke `.env` dan sesuaikan nilainya:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

- `MONGO_URI`: Connection string ke MongoDB Atlas/lokal
- `JWT_SECRET`: Secret key untuk generate JWT token
- `ALLOWED_ORIGINS`: Domain frontend yang diizinkan CORS (pisahkan koma)
- `PRESENSI_MASUK_START`, `PRESENSI_MASUK_END`: Waktu presensi masuk
- `PRESENSI_KELUAR_START`, `PRESENSI_KELUAR_END`: Waktu presensi keluar

## Endpoints Utama

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Users**: `/api/users/peserta`, `/api/users/admin/peserta`
- **Presensi**: `/api/presensi/masuk`, `/api/presensi/keluar`, `/api/presensi/riwayat`
- **Laporan**: `/api/laporan/`, `/api/laporan/base64`, `/api/laporan/download/:fileId`
- **Feedback**: `/api/feedback/`