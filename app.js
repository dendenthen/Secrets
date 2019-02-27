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
  password: String
});

// add passport local mongoose plugin to user schema
userSchema.plugin(passportLocalMongoose);

// setup a new user model
const User = new mongoose.model("User", userSchema);

// passport local configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// APP GET home route
app.get("/", function(req, res) {
  res.render("home");
});


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
  if(req.isAuthenticated()) {
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  }
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
