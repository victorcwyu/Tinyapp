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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let long = req.body.longURL
  // checking for http://
  // if (long[0] !== "h" && long[1] !== "t" && long[2] !== "t" && long[3] !== "p" && long[4] !== ":" && long[5] !== "/" && long[6] !== "/") {
  //   res.redirect("/urls/new");
  // }
  let tiny = generateRandomString()
  urlDatabase[tiny] = long;
  res.redirect(`/urls/${tiny}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
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
  urlDatabase[editShort] = long;
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});