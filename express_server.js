const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const express = require("express");
const bcrypt = require('bcrypt')
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const users = {"userRandomID": {
  id: "userRandomID", 
  email: "user@example.com", 
  password: "purple-monkey-dinosaur"
},
"user2RandomID": {
  id: "user2RandomID", 
  email: "user2@example.com", 
  password: "dishwasher-funk"
}};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

//rendering of the index page with all our urls
app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  if (user) {
    const userUrls = urlsForUser(user.newId);
    const templateVars = { urls: userUrls, user};
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

//rendering of the page to add new urls
app.get("/urls/new", (req, res) => {
  const user = req.cookies["user_id"];
  if (!user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//rendering of the register page
app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"]};
  res.render("urls_registration", templateVars);
});

//rendering of the login page
app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies["user_id"]};
  res.render("urls_login", templateVars);
});

//creating a new user on the register page
app.post("/register", (req, res) => {
  const newId = generateRandomString();
  //checking if email or password is blanck
  if (req.body["email"] === '' || req.body["password"] === '') {
    throw new Error(404);
  }
  //checking if email already exists
  for (let ids in users) {
    if (users[ids].email === req.body["email"]) {
      throw new Error(404);
    }
  }
  
  const email = req.body["email"];
  const password = bcrypt.hashSync(req.body["password"], 10); //encrypting the passwords at registration
  const newIdObject = {newId, email, password};
  users[newId] = newIdObject;
  res.cookie("user_id", users[newId]);
  res.redirect(`/urls`);
});

//create new urls
app.post("/urls", (req, res) => {
  const newSmallUrl = generateRandomString();
  const user = req.cookies["user_id"];
  urlDatabase[newSmallUrl] = {longURL :req.body.longURL, userID :user.newId};
  res.redirect(`/urls/${newSmallUrl}`);
});

//Deleteing a url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

const getUserByEmail = (email, database) => {
const keys = Object.keys(database)
  for (let key of keys) {
    const user = database[key]
    if (user.email === email) {
      return key
    }
  }    
}

//Login post wiht check if user and password match
app.post("/login", (req, res) => {
  const email = req.body["email"]
  const password = req.body["password"]
  const user = getUserByEmail(email ,users)
  if (!user) {
    res.status(403)
    res.send("email does not exist")
    return
  }
  console.log(password, user)
  if (!bcrypt.compareSync(password, users[user].password)) {
    res.status(403)
    res.send("Password does not match")
    return
  }
  res.cookie("user_id", users[user])
  res.redirect('/urls')
});

//press logout and cookies get cleared
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`);
});

//adding a new passowrd from the editing page
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

//rendering of the edit page with the new short url
app.get("/urls/:shortURL", (req, res) => {
  const user = req.cookies["user_id"];
  if (user) {
    const shortURL = req.params.shortURL;
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[shortURL].longURL, user: req.cookies["user_id"],};
    res.render("urls_show", templateVars);
  } else {
    res.redirect('/login');
  }
});

//when clicking on the key it takes you to the original website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
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
  let r = Math.random().toString(36).substring(7);
  return ("random", r);
};

//function to check if ids match so they can only access their own urls
const urlsForUser = (id) => {
  let newobject = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      newobject[shortURL] = urlDatabase[shortURL];
    }
  }
  return newobject;
};