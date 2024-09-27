// passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./model/user'); // Adjust the path to your User model

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    // Extract user details
    const { id, displayName, emails } = profile;
    const [email] = emails;

    // Check if user already exists in our db
    const existingUser = await User.findOne({ googleId: id });

    if (existingUser) {
      // If user exists, return the user
      return done(null, existingUser);
    }

    // If user does not exist, create a new user in our db
    const newUser = new User({
      googleId: id,
      firstname: profile.name.givenName,
      lastname: profile.name.familyName,
      email: email.value
    });

    await newUser.save();
    done(null, newUser);
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // Ensure 'user' is defined here
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});
