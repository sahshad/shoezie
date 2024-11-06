const Wallet = require('../model/wallet')
const User = require('../model/user')

async function getWallet(req,res){
    const userId = req.session.user
    try {
        let wallet = await Wallet.findOne({ userId }).populate('userId');
        const user = await User.findById(userId)

        if(!wallet){
            wallet = await  Wallet.create({userId})
        }
        
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        res.render('user/wallet',{wallet,user})
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


// async function getWallet(req, res) {
//     const userId = req.session.user;
//     const page = parseInt(req.query.page) || 1; // Current page number
//     const limit = parseInt(req.query.limit) || 5; // Number of transactions per page
//     const skip = (page - 1) * limit; // Calculate how many transactions to skip

//     try {
//         let wallet = await Wallet.findOne({ userId }).populate('userId');
//         const user = await User.findById(userId);

//         if (!wallet) {
//             wallet = await Wallet.create({ userId });
//         }

//         if (!wallet) {
//             return res.status(404).json({ message: 'Wallet not found' });
//         }

//         // Fetch paginated transactions
//         const transactions = await Wallet.findOne({ userId })
//             .populate('transactions')
//             .sort({ 'transactions.date': -1 })
//             .skip(skip)
//             .limit(limit);

//         const totalTransactions = wallet.transactions.length; // Get total number of transactions
//         const totalPages = Math.ceil(totalTransactions / limit); // Calculate total pages

//         res.render('user/wallet', {
//             wallet,
//             user,
//             transactions: transactions.transactions.slice(skip, skip + limit), // Only send the current page of transactions
//             currentPage: page,
//             totalPages,
//             limit,
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// }

module.exports = {
    getWallet
}