//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const session = require("express-session"); // 1°
const passport = require("passport"); //2°
const passportLocalMongoose = require("passport-local-mongoose"); //3°

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
  password: String
});

userSchema.plugin(passportLocalMongoose); //7° Pasa por hash y salt a nuestro UserSchema

// process.env.SECRET proviene del archivo .env
// Encriptacion solo del elemento password => encryptedFields.
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //8°
passport.serializeUser(User.serializeUser()); //9°
passport.deserializeUser(User.deserializeUser()); //10°

app.get("/", (req, res) =>{
  res.render("home")
});

app.get("/login", (req, res) =>{
  res.render("login")
});

app.get("/register", (req, res) =>{
  res.render("register")
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



});




app.listen(3000, () => {
  console.log("Server is running on port 3000");
});