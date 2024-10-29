
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

async function sendOTP(email, otp) {
    const mailOptions = {
        from: `"SHOEZIE" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your OTP for Password Reset',
        text: `Use the following OTP to reset your password: ${otp}`,
    };
    await transporter.sendMail(mailOptions);
}

module.exports = { sendOTP };