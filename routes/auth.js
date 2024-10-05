const router = require('express').Router();
const passport = require('passport');

// Auth Routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account' // Forces account selection screen
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const user = req.user; // Authenticated user from the Google callback
  if (req.session) {
    // If the session is created, save the user info to the session
    req.session.user = user;
  }
  
  if (user && user.isNew) {
    // If the user is newly created, redirect to login
    res.redirect('/user/login');
  } else {
    // If the user already exists, redirect to profile
    res.redirect('/user/profile');
  }
});

router.get('/logout', (req, res) => {
  req.logout(); // Passport method to log out the user
  req.session.destroy(() => { // Destroy the session after logging out
    res.redirect('/');
  });
});

module.exports = router;
