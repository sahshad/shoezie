# SHOEZIE 👟

SHOEZIE is a full-featured e-commerce web application for footwear, built with **Node.js**, **Express**, **MongoDB**, and **EJS**.  
It provides customers with a seamless shopping experience and equips administrators with a powerful dashboard for store management.

---

## 📌 Features

### 🛍️ User Features
- Secure authentication (signup, login, OTP verification, password reset)
- Browse, search, and filter products
- Shopping cart & wishlist
- Checkout with address management and order summary
- Order tracking & history
- Wallet and coupon support
- Profile management
- Responsive, mobile-friendly UI

### 🛠️ Admin Features
- Secure admin authentication & dashboard
- Manage products, categories, and offers
- Track orders and view sales reports
- Coupon & discount management
- Block/unblock users
- Cloudinary integration for media uploads

---

## 🏗 Tech Stack

**Backend:**
- Node.js
- Express.js

**Frontend:**
- EJS
- HTML, CSS, JavaScript

**Database:**
- MongoDB (Mongoose ODM)

**Other Integrations:**
- Passport.js (Authentication)
- Cloudinary (Image uploads)
- Nodemailer (Email services)
- express-session (Session management)

---

## 📂 Project Structure

```bash
SHOEZIE/
├── app.js # Application entry point
├── config/ # Configuration (DB, Cloudinary)
├── controller/ # Business logic controllers
├── middleware/ # Middleware (auth, error handling)
├── model/ # Mongoose schemas/models
├── public/ # Static assets
├── routes/ # API & web routes
├── utils/ # Utilities (email, offers, helpers)
├── views/ # EJS templates
├── .env # Environment variables
├── package.json # Dependencies & scripts
└── README.md # Documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add:

```bash
PORT=3000
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16+ recommended)
- **MongoDB** (local or cloud instance)
- **Cloudinary account**

---

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/shoezie.git
cd shoezie
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Set Up Environment Variables
Create a .env file using the keys listed in the Environment Variables section above.

#### 4. Run the Application

```bash
npm start
```

#### 5. Access the App

- **User Interface:** [http://localhost:3000](http://localhost:3000)  
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

## 📜 Scripts

```bash
npm start       # Start the server in production mode
npm run dev     # Start the server in development mode with nodemon
```

## 🤝 Contributing

Contributions are welcome!  
Feel free to fork this repository and submit a pull request.

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).  
See the `LICENSE` file for more details.
