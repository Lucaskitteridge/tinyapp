const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const express = require("express");
const app = express();
const PORT = 8080; 

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

const users = {};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//rendering of the index page with all our urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: req.cookies["user_id"]};
  res.render("urls_index", templateVars);
});

//rendering of the page to add new urls
app.get("/urls/new", (req, res) => {
  const templateVars = { user: req.cookies["user_id"]}
  res.render("urls_new", templateVars);
});

//rendering of the register page
app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"]}
  res.render("urls_registration", templateVars)
})

//creating a new user on the register page
app.post("/register", (req, res) => {
  const newId = generateRandomString()
  //checking if email or password is blanck
  if(req.body["email"] === '' || req.body["password"] === ''){
    throw new Error(404)
  }
  //checking if email already exists
  if (users){
    for(let ids in users) {
      console.log(ids)
      if( users[ids].email === req.body["email"]) {
      throw new Error(404)
      }
    }
  }
  const email = req.body["email"]
  const password = req.body["password"]
  const newIdObject = {newId, email, password}
  users[newId] = newIdObject
  res.cookie("user_id", users[newId])
  console.log(users)
  res.redirect(`/urls`)
})

app.post("/urls", (req, res) => {
  const newSmallUrl = generateRandomString()
  urlDatabase[newSmallUrl] = req.body.longURL
  res.redirect(`/urls/${newSmallUrl}`)        
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls`)
})

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect(`/urls`)
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect(`/urls`)
})

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect(`/urls`)
})

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[shortURL], user: req.cookies["user_id"],};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//server is up and running check
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//function to make a random 6 character code
function generateRandomString() {
  let r = Math.random().toString(36).substring(7);
  return ("random", r);
}