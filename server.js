const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session",
  secret: "yourSecretKey123",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

// Set up Handlebars
app.engine(".hbs", exphbs.engine({
  extname: ".hbs",
  helpers: {
    navLink: function (url, options) {
      return '<li' + ((url == app.locals.activeRoute) ? ' class="active"' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      return (lvalue != rvalue) ? options.inverse(this) : options.fn(this);
    },
    formatDate: function(dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    },
    safeHTML: function (context) {
      return context;
    },
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case "==": return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case "===": return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case "!=": return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case "!==": return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case "<": return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case "<=": return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case ">": return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case ">=": return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case "&&": return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case "||": return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    }
  }
}));
app.set("view engine", ".hbs");

// Track active route
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Middleware to protect routes
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// Multer
const upload = multer(); // memory storage

// ROUTES

app.get("/", (req, res) => res.redirect("/shop"));

app.get("/about", (req, res) => res.render("about"));

// Add Post
app.get("/Items/add", ensureLogin, (req, res) => {
  storeService.getCategories()
    .then((data) => res.render("addPost", { categories: data }))
    .catch(() => res.render("addPost", { categories: [] }));
});

app.post("/Items/add", ensureLogin, (req, res) => {
  storeService.addItem(req.body)
    .then(() => res.redirect("/Items"))
    .catch((err) => {
      console.error(" Unable to add item:", err);
      res.status(500).send("Unable to add item");
    });
});

// Items List
app.get("/Items", ensureLogin, async (req, res) => {
  try {
    const data = req.query.category
      ? await storeService.getItemsByCategory(req.query.category)
      : await storeService.getAllItems();
    res.render("Items", { items: data.length > 0 ? data : null, message: data.length ? null : "no results" });
  } catch {
    res.render("Items", { message: "no results" });
  }
});

// Delete Item
app.get("/Items/delete/:id", ensureLogin, (req, res) => {
  storeService.deletePostById(req.params.id)
    .then(() => res.redirect("/Items"))
    .catch(() => res.status(500).send("Unable to Remove Post / Post not found"));
});

// Categories
app.get("/categories", ensureLogin, async (req, res) => {
  try {
    const data = await storeService.getCategories();
    res.render("categories", { categories: data.length > 0 ? data : null, message: data.length ? null : "no results" });
  } catch {
    res.render("categories", { message: "no results" });
  }
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to Add Category"));
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService.deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to Remove Category / Category not found"));
});

// Shop Views (Public)
app.get("/shop", async (req, res) => {
  let viewData = {};
  try {
    const items = req.query.category
      ? await storeService.getPublishedItemsByCategory(req.query.category)
      : await storeService.getPublishedItems();
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = items;
    viewData.post = items[0];
  } catch {
    viewData.message = "no results";
  }

  try {
    viewData.categories = await storeService.getCategories();
  } catch {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData, viewingCategory: req.query.category });
});

app.get("/shop/:id", async (req, res) => {
  let viewData = {};
  try {
    viewData.post = await storeService.getItemById(req.params.id);
  } catch {
    viewData.message = "no results";
  }

  try {
    viewData.posts = req.query.category
      ? await storeService.getPublishedItemsByCategory(req.query.category)
      : await storeService.getPublishedItems();
  } catch {
    viewData.message = "no results";
  }

  try {
    viewData.categories = await storeService.getCategories();
  } catch {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData, viewingCategory: req.query.category });
});

// GET /register
app.get("/register", (req, res) => {
  res.render("register");
});

// POST /register
app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch(err => res.render("register", { errorMessage: err, userName: req.body.userName }));
});

// GET /login
app.get("/login", (req, res) => {
  res.render("login");
});

// POST /login
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect("/Items");
    })
    .catch(err => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

// GET /logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// GET /userHistory
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});


// 404
app.use((req, res) => {
  res.status(404).render("404");
});

storeService.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message || err);
  });

