const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const express = require("express");
const bcrypt = require('bcrypt');
const {getUserByEmail} = require('./helpers');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["Dont go chasing waterfalls"]
}));

app.set("view engine", "ejs");

const users = {"userRandomID": {
  id: "userRandomID",
  email: "user@example.com",
  password: "purple-monkey-dinosaur"
},
"user2RandomID": {
  id: "aJ48lW",
  email: "user2@example.com",
  password: "123"
}};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

//Redirects to either login or urls depending on login status
app.get("/", (req, res) => {
  const user = req.session["user_id"];
  if (user) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//rendering of the index page with all our urls
app.get("/urls", (req, res) => {
  const user = req.session["user_id"];
  if (user) {
    const userUrls = urlsForUser(user.newId);
    const templateVars = { urls: userUrls, user};
    res.render("urls_index", templateVars);
  } else {
    res.status(400);
    res.send("Not logged in");
  }
});

//rendering of the page to add new urls
app.get("/urls/new", (req, res) => {
  const user = req.session["user_id"];
  if (!user) {
    res.redirect("/login");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//rendering of the edit page with the new short url
app.get("/urls/:shortURL", (req, res) => {
  const user = req.session["user_id"];
  if (user) {
    const shortURL = req.params.shortURL;
    if (!urlDatabase[shortURL]) {
      res.status(400);
      res.send("Url is not in database");
    }
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[shortURL].longURL, user: req.session["user_id"],};
    res.render("urls_show", templateVars);
  } else {
    res.status(400);
    res.send('Please login first');
  }
});

//when clicking on the key it takes you to the original website
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400);
    res.send('Url does not exist');
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

//create new urls
app.post("/urls", (req, res) => {
  const newSmallUrl = generateRandomString();
  const user = req.session["user_id"];
  urlDatabase[newSmallUrl] = {longURL :req.body.longURL, userID :user.newId};
  res.redirect(`/urls`);
});

//adding a new url from the editing page
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

//Deleteing a url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});


//rendering of the login page
app.get("/login", (req, res) => {
  const user = req.session["user_id"];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user: req.session["user_id"]};
  res.render("urls_login", templateVars);
});

//rendering of the register page
app.get("/register", (req, res) => {
  const user = req.session["user_id"];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user: req.session["user_id"]};
  res.render("urls_registration", templateVars);
});

//Login post wiht check if user and password match
app.post("/login", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  const user = getUserByEmail(email ,users);
  if (!user || user === "") {
    res.status(403);
    res.send("Username and/or password does not match");
    return;
  }
  if (!bcrypt.compareSync(password, users[user].password)) {
    res.status(403);
    res.send("Password does not match");
    return;
  }
  req.session.user_id = users[user];
  res.redirect('/urls');
});


//creating a new user on the register page
app.post("/register", (req, res) => {
  const newId = generateRandomString();
  //checking if email or password is blank
  if (req.body["email"] === '' || req.body["password"] === '') {
    res.status(404);
    res.send("Email or password field is blank");
  }
  //checking if email already exists
  for (const ids in users) {
    if (users[ids].email === req.body["email"]) {
      res.status(404);
      res.send("Account already exists for Email");
    }
  }
  const email = req.body["email"];
  const password = bcrypt.hashSync(req.body["password"], 10); //encrypting the passwords at registration
  const newIdObject = {newId, email, password};
  users[newId] = newIdObject;
  req.session.user_id = users[newId];
  res.redirect(`/urls`);
});

//press logout and cookies get cleared
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect(`/urls`);
});

//json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//server is up and running check
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//function to make a random 6 character code
const generateRandomString = () => {
  const r = Math.random().toString(36).substring(7);
  return r
};

//function to check if ids match so they can only access their own urls
const urlsForUser = (id) => {
  const newobject = {};
  for (const shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      newobject[shortURL] = urlDatabase[shortURL];
    }
  }
  return newobject;
};