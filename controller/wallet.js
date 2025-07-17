const Wallet = require("../model/wallet");
const User = require("../model/user");
const { StatusCodes } = require("http-status-codes");
const Transaction = require("../model/transaction");

async function getWallet(req, res) {
  const userId = req.session.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    let wallet = await Wallet.findOne({ userId }).populate("userId");
    const user = await User.findById(userId);

    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }
    const [transactions, totalCount] = await Promise.all([
      Transaction.find({ walletId: wallet._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ walletId: wallet._id })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    if (!wallet) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Wallet not found" });
    }
    res.render("user/wallet", { wallet, user, transactions,  page,
      totalPages,
      limit });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  getWallet,
};
