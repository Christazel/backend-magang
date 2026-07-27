import Feedback from "../models/feedbackModel.js";

const isProduction = process.env.NODE_ENV === "production";

// ✅ Admin mengirim feedback ke peserta — role sudah divalidasi di route (isAdmin middleware)
export const createFeedback = async (req, res) => {
  const { userId, feedback } = req.body;

  // ✅ Validasi input wajib
  if (!userId || !feedback) {
    return res.status(400).json({ msg: "userId dan feedback wajib diisi." });
  }

  if (typeof feedback !== "string" || feedback.trim().length === 0) {
    return res.status(400).json({ msg: "Feedback tidak boleh kosong." });
  }

  try {
    const newFeedback = new Feedback({
      user: userId,
      feedback: feedback.trim(),
    });

    await newFeedback.save();
    res.status(201).json({ msg: "Feedback berhasil dikirim", data: newFeedback });
  } catch (error) {
    console.error("[createFeedback] Error:", error);
    res.status(500).json({ msg: "Gagal mengirim feedback", error: isProduction ? undefined : error.message });
  }
};

// Peserta melihat feedback milik mereka
export const getUserFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("[getUserFeedback] Error:", error);
    res.status(500).json({ msg: "Gagal mengambil feedback", error: isProduction ? undefined : error.message });
  }
};

// ✅ Admin melihat semua feedback — role sudah divalidasi di route (isAdmin middleware)
export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate("user", "name email").sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("[getAllFeedback] Error:", error);
    res.status(500).json({ msg: "Gagal mengambil semua feedback", error: isProduction ? undefined : error.message });
  }
};
