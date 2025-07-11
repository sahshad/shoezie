const router = require('express').Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const user = req.user; 
  if (req.session) {
    req.session.user = user;
  }
  
  if (user && user.isNew) {
    res.redirect('/login');
  } else {
    res.redirect('/profile');
  }
});

router.get('/logout', (req, res) => {
  req.logout(); 
  req.session.destroy(() => { 
    res.redirect('/');
  });
});

module.exports = router;
