//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session"); // 1°
const passport = require("passport"); //2°
const passportLocalMongoose = require("passport-local-mongoose"); //3°
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// 4°  Es importante colocar el codigo en este sector!! arriba del mongoose.connect y abajo del app.use(public)

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// 5° Se inicializa passport, justo debajo del app.use(session)
app.use(passport.initialize());
app.use(passport.session()); //6°

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose); //7° Pasa por hash y salt a nuestro UserSchema
userSchema.plugin(findOrCreate);
// process.env.SECRET proviene del archivo .env
// Encriptacion solo del elemento password => encryptedFields.
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //8°

//passport.serializeUser(User.serializeUser()); //9°
//passport.deserializeUser(User.deserializeUser()); //10°
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      name: user.name
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// <<<<<< OAuth con google y passport >>>>>>>>
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
  // ,userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
// <<<<<<< OAuth con Facebook y passport >>>>>>>>>
passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", (req, res) =>{
  res.render("home")
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }
));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


app.get("/login", (req, res) =>{
  res.render("login")
});

app.get("/register", (req, res) =>{
  res.render("register")
});

app.get("/secrets", (req, res) =>{
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) =>{
  req.logout((err) =>{
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/register", (req, res) =>{
  
  //   .then((hash) => {
  //     const newUser = new User({
  //       email: req.body.username,
  //       password: hash 
  //     });
  //     newUser.save()
  //       .then(
  //         res.render("secrets")
  //       )
  //       .catch((err) => {
  //         console.log(err);
  //       })
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });  
  User.register({username: req.body.username}, req.body.password, (err, user) =>{
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req,res, () =>{
        res.redirect("/secrets")
      });
    };
  })
});

app.post("/login", (req, res) =>{
  // const username = req.body.username;
  // const password = req.body.password;

  // User.findOne({email: username})
  //   .then((foundUser) => {
  //     bcrypt.compare(password, foundUser.password)
  //     .then((result) => {
  //       if (result === true) {
  //         res.render("secrets")
  //       } else {
  //         console.log("Wrong password hash");
  //       }})
  //     .catch((err) => {
  //       console.log(err);
  //     });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) =>{
    if (err) {
      console.log(err);
      res.redirect("/login");
  } else {
    passport.authenticate("local")(req, res, () =>{
      res.redirect("/secrets");
    });
  }});
});




app.listen(3000, () => {
  console.log("Server is running on port 3000");
});