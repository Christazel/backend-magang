import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ Helper: tentukan apakah sedang di production
const isProduction = process.env.NODE_ENV === "production";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // ✅ Validasi input wajib
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
  }

  // ✅ Validasi panjang nama
  if (name.trim().length > 100) {
    return res.status(400).json({ error: "Nama terlalu panjang (maks. 100 karakter)." });
  }

  // ✅ Validasi format email sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format email tidak valid." });
  }

  // ✅ Validasi panjang password (min 8, MAKS 128 — cegah bcrypt DoS)
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "Password harus antara 8–128 karakter." });
  }

  // ✅ Validasi kompleksitas password (huruf + angka)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "Password minimal 8 karakter dan harus mengandung kombinasi huruf dan angka." });
  }

  try {
    // ✅ Cek duplikasi email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Role TIDAK boleh dari client — selalu default "peserta", status default "pending"
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      status: "pending",
    });

    res.status(201).json({
      message: "Registrasi berhasil. Akun Anda dalam proses verifikasi admin.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    console.error("[register] Error:", err);
    res.status(500).json({ error: isProduction ? "Terjadi kesalahan server." : err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // ✅ Validasi input wajib
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  // ✅ Batasi panjang password input (cegah bcrypt DoS)
  if (password.length > 128) {
    return res.status(400).json({ error: "Email atau password salah." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Email atau password salah." });
    }

    // ✅ Cek status persetujuan akun (hanya untuk role peserta)
    if (user.role === "peserta" && user.status === "pending") {
      return res.status(403).json({ error: "Akun Anda belum disetujui oleh Admin. Silakan tunggu verifikasi admin." });
    }
    if (user.role === "peserta" && user.status === "rejected") {
      return res.status(403).json({ error: "Pendaftaran akun Anda ditolak oleh Admin." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "approved",
      },
    });
  } catch (err) {
    console.error("[login] Error:", err);
    res.status(500).json({ error: isProduction ? "Terjadi kesalahan server." : err.message });
  }
};
