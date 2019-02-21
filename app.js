//jshint esversion:6

// require node modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

// create an app using express
const app = express();

// use the public directory to store static files
app.use(express.static("public"));

// set the view engine to use embedded javascript
app.set("view engine", "ejs");

// use body bodyParser
app.use(bodyParser.urlencoded({extended: true}));


// DATABASE-----------------------------------------------------

// connect to mongoose DATABASE
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

// create a mongoose user schema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// use the mongoose plugin encrypt to encrypt the password field
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });

// setup a new user model
const User = new mongoose.model("User", userSchema);


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
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err) {
    if (err) {
      console.log(err);
    }
    else {
      res.render("secrets");
    }
  });

});

// APP POST login route
app.post("/login", function(req, res) {

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        if (foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });

});


// APP LISTEN route on port 3000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});