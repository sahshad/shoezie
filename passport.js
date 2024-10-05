const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./model/user'); // Adjust the path to your User model

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const [email] = emails;

    try {
      // Check if user already exists in the database
      let existingUser = await User.findOne({ googleId: id });

      if (existingUser) {
        existingUser.isNew = false; // Flag existing user
        return done(null, existingUser);
      }

      // If user does not exist, create a new user
      const newUser = new User({
        googleId: id,
        firstname: profile.name.givenName,
        lastname: profile.name.familyName,
        email: email.value
      });

      await newUser.save();
      newUser.isNew = true; // Flag newly created user
      done(null, newUser);
    } catch (error) {
      done(error, null);
    }
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});
