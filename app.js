//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// process.env.SECRET proviene del archivo .env
// Encriptacion solo del elemento password => encryptedFields.
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);


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
  bcrypt.hash(req.body.password, saltRounds)
    .then((hash) => {
      const newUser = new User({
        email: req.body.username,
        password: hash 
      });
      newUser.save()
        .then(
          res.render("secrets")
        )
        .catch((err) => {
          console.log(err);
        })
    })
    .catch((err) => {
      console.log(err);
    });  
});


app.post("/login", (req, res) =>{
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username})
    .then((foundUser) => {
      bcrypt.compare(password, foundUser.password)
      .then((result) => {
        if (result === true) {
          res.render("secrets")
        } else {
          console.log("Wrong password hash");
        }})
      .catch((err) => {
        console.log(err);
      });
    })
    .catch((err) => {
      console.log(err);
    });
});




app.listen(3000, () => {
  console.log("Server is running on port 3000");
});