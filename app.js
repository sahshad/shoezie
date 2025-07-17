const express = require("express");
const MongoStore = require("connect-mongo")
const path = require("path");
const app = express();
const session = require("express-session");
const userRoute = require("./routes/user");
const adminRoute = require("./routes/admin");
const authRoute = require("./routes/auth");
const db = require("./config/db");
const passport = require("passport");
require("./passport");
require("dotenv").config();
const { preventCache } = require("./middleware/authMiddleware");
const { StatusCodes } = require("http-status-codes");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
     store: MongoStore.create({
    mongoUrl: process.env.dbURI ,
    collectionName: 'sessions'
  }),
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

db();

app.use(preventCache);

app.get("/get-razorpay-key", (req, res) => {
  res.status(StatusCodes.OK).json({ key: process.env.RAZORPAY_ID_KEY });
});

app.use("/admin", adminRoute);
app.use("/auth", authRoute);
app.use("/", userRoute);

app.use((req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).render("user/error", {
    message: "Oops! The page you are looking for does not exist.",
    activePage: "404",
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
