//jshint esversion:6

// require node modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


// create an app using express
const app = express();

// use the public directory to store static files
app.use(express.static("public"));

// set the view engine to use embedded javascript
app.set("view engine", "ejs");

// use body bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

// express session initialization
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// passport initialization
app.use(passport.initialize());
app.use(passport.session());


// DATABASE-----------------------------------------------------
// connect to mongoose DATABASE
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);

// create a mongoose user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// add passport local mongoose plugin to user schema
userSchema.plugin(passportLocalMongoose);

// add find or create plugin to the user Schema
userSchema.plugin(findOrCreate);

// setup a new user model
const User = new mongoose.model("User", userSchema);

// passport configuration
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// configure google oauth 2.0 authentication strategy
passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


// ROUTES -------------------------------------------------------------
// APP GET home route
app.get("/", function(req, res) {
  res.render("home");
});


// APP GET google auth route
app.get("/auth/google",
  passport.authenticate("google", {scope: ["profile"]})
);


// APP GET google auth secrets route
app.get( "/auth/google/secrets",
    passport.authenticate( "google", {
        successRedirect: "/secrets",
        failureRedirect: "/login"
}));


// APP GET login route
app.get("/login", function(req, res) {
  res.render("login");
});


// APP GET register route
app.get("/register", function(req, res) {
  res.render("register");
});


// APP POST register route
app.post("/register", function(req, res) {
  User.register(
    {username: req.body.username},
    req.body.password,
    function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    }
  );
});


// APP GET secrets route
app.get("/secrets", function(req, res) {
  User.find({"secret": {$ne:null}}, function(err, foundUsers) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});


// APP GET submit route
app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  }
  else {
    res.redirect("login");
  }
});


// APP POST submit route
app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  console.log(req.user);

  User.findById(req.user.id, function(err, foundUser) {
    if(err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });

});


// APP GET logout route
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


// APP POST login route
app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err) {
      console.log(err);
    }
    else {
      passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
      });
    }
  });

});


// APP LISTEN route on port 3000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
