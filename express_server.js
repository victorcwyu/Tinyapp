// GLOBAL CONSTANTS

// Express server setup
const express = require("express");
const app = express();
const PORT = 8080;

// EJS template engine setup
app.set("view engine", "ejs");

// callback which is called after the app initialization
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const cookieSession = require('cookie-session');
app.use(cookieSession({ name: 'user_id', secret: 'abc' }));

const bcrypt = require('bcrypt');

const urlDatabase = {};

const users = {};

const { getUserByEmail } = require('./helpers');

// FUNCTIONS

// generates random string for short URL and user ID
const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// filters URL database and creates URL database specifically for logged in user
const urlsForUser = id => {
  let userURLdatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLdatabase[url] = urlDatabase[url].longURL;
    }
  }
  return userURLdatabase;
};

// validates whether a users email is in database
const validateEmail = email => {
  let user = getUserByEmail(email, users);
  if (!user) {
    return false;
  } else {
    return true;
  }
};

// validates whether a users password matches that of the associated email in the database
const validatePassword = (email, password) => {
  let user = getUserByEmail(email, users);
  if ((user) && bcrypt.compareSync(password, user.password)) {
    return true;
  } else {
    return false;
  }
};

// ROUTING

// redirects to index page if logged in, otherwise redirects to login page => done
app.get("/", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// renders the index page => done except stretch
app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.sendStatus(res.statusCode = 401);
  } else {
    let templateVars = { user_id: req.session.user_id, urls: urlsForUser(req.session.user_id.id) };
    res.render("urls_index", templateVars);
  }
});

// renders the create new URL page => done
app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  } else {
    let templateVars = { user_id: req.session.user_id };
    res.render("urls_new", templateVars);
  }
});

// renders the URL show/edit page => done
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.sendStatus(res.statusCode = 404);
  } else if (req.session.user_id === undefined || req.session.user_id.id !== urlDatabase[req.params.id].userID) {
    res.sendStatus(res.statusCode = 401);
  } else {
    let templateVars = { user_id: req.session.user_id, shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
    res.render("urls_show", templateVars);
  }
});

// redirects user to the long URL => done
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.sendStatus(res.statusCode = 404);
  } else  {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

// adds new URL into database for logged in user => done
app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.sendStatus(res.statusCode = 401);
    return;
  } else {
    let tiny = generateRandomString();
    urlDatabase[tiny] = { longURL: req.body.longURL, userID: req.session.user_id.id };
    res.redirect(`/urls/${tiny}`);
  }
});

// changes the longURL from a link in the database and redirects user to refreshed URLs page (index) => done
app.post('/urls/:id', (req, res) => {
  if (req.session.user_id === undefined || req.session.user_id.id !== urlDatabase[req.params.id].userID) {
    res.sendStatus(res.statusCode = 401);
  } else {
    let long = req.body.newURL;
    let editShort = req.params.id;
    urlDatabase[editShort].longURL = long;
    res.redirect('/urls');
  }
});

// deletes a link from database and redirects user to refreshed URLs page (index) => done ***
app.post('/urls/:id/delete', (req, res) => {
  if ((req.session.user_id) && req.session.user_id.id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.sendStatus(res.statusCode = 401);
  }
});

// renders the registration page if not logged in => done
app.get('/register', (req, res) => {
  if (req.session.user_id === undefined) {
    let templateVars = { user_id: req.session.user_id, email: req.body.email, password: req.body.pwd };
    res.render("urls_register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// creates the endpoint which handles the registration form data, sets a cookie and redirects to the urls (index) page =>done
app.post('/register', (req, res) => {
  let newUser = generateRandomString();
  let newEmail = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (newEmail === "" || password === "" || validateEmail(newEmail) === true) {
    res.sendStatus(res.statusCode = 400);
  } else {
    users[newUser] = { id: `${newUser}`, email: `${newEmail}`, password: `${hashedPassword}` };
    req.session.user_id = ('user_id', users[newUser]);
    res.redirect('/urls');
  }
});

// renders the login page if not logged in => done
app.get('/login', (req, res) => {
  if (req.session.user_id === undefined) {
    let templateVars = { user_id: req.session.user_id, email: req.body.email, password: req.body.pwd };
    res.render("urls_login", templateVars);
  } else  {
    res.redirect("/urls");
  }
});

// creates the endpoint which handles the login form data, stores a cookie and redirects to the index page => done
app.post('/login', (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  if (validateEmail(loginEmail) === false) {
    res.sendStatus(res.statusCode = 403);
  } else if (validateEmail(loginEmail) === true && validatePassword(loginEmail, loginPassword) === false) {
    res.sendStatus(res.statusCode = 403);
  } else if (validateEmail(loginEmail) === true && validatePassword(loginEmail, loginPassword) === true) {
    let user = getUserByEmail(loginEmail, users);
    req.session.user_id = ('user_id', user);
    res.redirect('/urls');
  }
});

// creates the endpoint which clears the cookie and redirects to the login page => done
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});