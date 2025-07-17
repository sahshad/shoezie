const Wallet = require("../model/wallet");
const User = require("../model/user");
const { StatusCodes } = require("http-status-codes");

async function getWallet(req, res) {
  const userId = req.session.user;
  try {
    let wallet = await Wallet.findOne({ userId }).populate("userId");
    const user = await User.findById(userId);

    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    if (!wallet) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Wallet not found" });
    }
    res.render("user/wallet", { wallet, user });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  getWallet,
};
