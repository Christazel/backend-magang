// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token tidak tersedia" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user lengkap (termasuk role)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ msg: "User tidak ditemukan" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token tidak valid" });
  }
};

// ✅ Middleware tambahan: hanya untuk admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ msg: "Akses ditolak, hanya admin." });
};
