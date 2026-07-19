// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token tidak tersedia", code: "NO_TOKEN" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user lengkap (termasuk role)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ msg: "User tidak ditemukan", code: "USER_NOT_FOUND" });
    }

    req.user = user;
    next();
  } catch (err) {
    // ✅ Bedakan token expired vs token palsu/rusak
    // Frontend bisa gunakan 'code' untuk memutuskan:
    //   TOKEN_EXPIRED → coba refresh / minta login ulang
    //   TOKEN_INVALID → langsung paksa logout
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        msg: "Sesi telah berakhir, silakan login kembali.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      msg: "Token tidak valid.",
      code: "TOKEN_INVALID",
    });
  }
};

// ✅ Middleware tambahan: hanya untuk admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ msg: "Akses ditolak, hanya admin.", code: "FORBIDDEN" });
};
