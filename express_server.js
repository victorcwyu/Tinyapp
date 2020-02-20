function generateRandomString() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

let urlsForUser = id => {
  let userURLdatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLdatabase[url] = urlDatabase[url].longURL;
    }
  }
  return userURLdatabase;
};


const getUserByEmail = (email) => {
  for (let i of Object.keys(users)) {
    if (users[i].email === email) {
      return users[i];
    }
  }
  return false;
}

const validateEmail = (email) => {
  let user = getUserByEmail(email);
  if (!user) {
    return false;
  } else {
      return true;
  }
};

const validatePassword = (email, password) => {
  let user = getUserByEmail(email);
    if ((user) &&password === user.password) {
      return true;
    } else {
      return false
    }
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  //working here
  if (req.cookies.user_id === undefined) {
    res.redirect("/register");
  } else {
    let templateVars = { user_id: req.cookies["user_id"], urls: urlsForUser(req.cookies.user_id.id) };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  } else {
  let templateVars = { user_id: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let tiny = generateRandomString()
  urlDatabase[tiny] = { longURL: req.body.longURL, userID: req.cookies.user_id.id }
  res.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  //changed this
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// use POST to redirect to edit urls_show page (index)
app.post('/urls/:id/edit', (req, res) => {
  let editShort = req.params.id
  res.redirect(`/urls/${editShort}`);
})

// use POST to delete a link from database, redirect to refreshed urls page (index)
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

// use POST to change a longURL for link from database, redirect to refreshed urls page (index)
app.post('/urls/:id/update', (req, res) => {
  let long = req.body.newURL
  let editShort = req.params.id
  //changed this
  urlDatabase[editShort].longURL = long;
  res.redirect('/urls');
})

//Add an endpoint to handle a POST to /login in your Express server.
// app.post('/login', (req, res) => {
//   let userName = req.body.username;
//   res.cookie('username', userName)
//   res.redirect('/urls');
// })

//returns registration page template
app.get('/register', (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"], email: req.body.email, password: req.body.pwd };
  res.render("urls_register", templateVars);
});

//creates the endpoint that handles the registration form data
app.post('/register', (req, res) => {
  let newUser = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  if (newEmail === "" || newPassword === "" || validateEmail(newEmail) === true) {
    res.sendStatus(res.statusCode = 400);
  } else {
      users[newUser] = { id: `${newUser}`, email: `${newEmail}`, password: `${newPassword}` };
      res.cookie('user_id', users[newUser])
      res.redirect('/urls');
    }
});

//returns login page template
app.get('/login', (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"], email: req.body.email, password: req.body.pwd };
  res.render("urls_login", templateVars);
});

//creates the endpoint that handles the login form data
app.post('/login', (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  
  if (validateEmail(loginEmail) === false) {
    res.sendStatus(res.statusCode = 403);
  } else if (validateEmail(loginEmail) === true && validatePassword(loginEmail, loginPassword) === false) {
    res.sendStatus(res.statusCode = 403);
  } else if (validateEmail(loginEmail) === true && validatePassword(loginEmail, loginPassword) === true) {
    let user = getUserByEmail(loginEmail);
    res.cookie('user_id', user)
    res.redirect('/urls');
  }
});

// Add an endpoint to handle a POST to /logout in your Express server.
app.post('/logout', (req, res) => {
  res.clearCookie('user_id', users[req.cookies.id])
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});