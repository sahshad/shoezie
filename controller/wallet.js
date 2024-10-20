const Wallet = require('../model/wallet')
const User = require('../model/user')

async function getWallet(req,res){
    const userId = req.session.user
    try {
        const wallet = await Wallet.findOne({ userId }).populate('userId');
        const user = await User.findById(userId)
        
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        res.render('user/wallet',{wallet,user})
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = {
    getWallet
}