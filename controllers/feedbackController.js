import Feedback from "../models/feedbackModel.js";

// Admin mengirim feedback ke peserta
export const createFeedback = async (req, res) => {
  const { userId, feedback } = req.body;

  try {
    const newFeedback = new Feedback({
      user: userId,
      feedback,
    });

    await newFeedback.save();
    res.status(201).json({ msg: "Feedback berhasil dikirim", data: newFeedback });
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengirim feedback", error: error.message });
  }
};

// Peserta melihat feedback milik mereka
export const getUserFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil feedback", error: error.message });
  }
};

// Admin melihat semua feedback (opsional)
export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate("user", "name email").sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil semua feedback", error: error.message });
  }
};
