const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const expressLayout = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const logger = require('morgan');
const app = express();
const User = require('./models/User');
const port = 5000;

mongoose.connect('mongodb://127.0.0.1/googleAuth');

function isLoggedIn(req, res, next){
    req.user ? next() : res.sendStatus(401);
}

app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser());
app.use(flash());
app.use(session({secret: 'cats'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayout);
app.set('view engine', 'ejs');

passport.use(new GoogleStrategy({
    clientID: '353521355728-170mve2pr8g2hs2os263u73fsdb1hbtj.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: "http://localhost:5000/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);  
    process.nextTick(function() {
        User.findOne({ 'uid' : profile.id }, function(err, user) {

            if (err)
                return done(err);

            if (user) {
                console.log("user found")
                console.log(user)
                return done(null, user); 
            } else {

                var newUser = new User();

                newUser.uid = profile.id;                                   
                newUser.name = profile.name.givenName + ' ' + profile.name.familyName; 
                newUser.email = profile.emails[0].value; 
                // save our user to the database
                newUser.save(function(err) {
                    if (err)
                        throw err;

                    // if successful, return the new user
                    return done(null, newUser);
                });
            }

        });

    })
  }
));

app.get('/', function(req, res){
    res.render('index');
})

// ======= login google ========
app.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile']}));

app.get('/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/auth/failure'
    })
);

app.get('/profile', isLoggedIn, function(req, res){
    console.log(req.user)
    res.render('profile', {user: req.user})
})

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/auth/failure', function(req, res) {
    res.send('non valid user');
});

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    })
});

app.listen(port, () => {
    console.log(`Server listening on ${port}`);
})