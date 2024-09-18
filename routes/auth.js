// routes/auth.js
const router = require('express').Router();
const passport = require('passport');

// Auth Routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account' // This parameter forces the account selection screen
}));

router.get('/google/callback', passport.authenticate('google'), (req, res) => {

  res.redirect('/user/login');
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
