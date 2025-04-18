/*********************************************************************************
* WEB322 – Assignment 05
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Tirth Patel Student ID: 176929230 Date: 2025-04-09
*
* GitHub Repository URL: https://github.senecapolytechnic.ca/tapatel16/web322-app
*
********************************************************************************/

require("dotenv").config();
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const storeService = require("./store-service");
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Set up Handlebars
app.engine(".hbs", exphbs.engine({
  extname: ".hbs",
  handlebars: allowInsecurePrototypeAccess(require("handlebars")),
  helpers: {
    navLink: function (url, options) {
        return (
          '<li class="nav-item">' +
          '<a class="nav-link' +
          (url === app.locals.activeRoute ? " active" : "") +
          '" href="' +
          url +
          '">' +
          options.fn(this) +
          "</a>" +
          "</li>"
        );
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
    ifCond: function (v1, operator, v2, options) {
        switch (operator) {
          case "==":
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
          case "===":
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
          case "!=":
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
          case "!==":
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
          case "<":
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
          case "<=":
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
          case ">":
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
          case ">=":
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
          case "&&":
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
          case "||":
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
          default:
            return options.inverse(this);
        }
      },
  
    safeHTML: function (context) {
      return context;
    },
  }
}));
app.set("view engine", ".hbs");

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(clientSessions({
  cookieName: "session",
  secret: "web322Assignment6Secret",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split("/")[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Routes
app.get("/", (req, res) => res.redirect("/shop"));

app.get("/about", (req, res) => res.render("about"));

// SHOP
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
    let viewData = {
      post: null,
      posts: [],
      categories: [],
      viewingCategory: req.query.category || null
    };
  
    try {
      const post = await storeService.getItemById(req.params.id);
      if (post) viewData.post = post;
      else viewData.message = "Item not found.";
    } catch (err) {
      viewData.message = "Error retrieving item.";
    }
  
    try {
      viewData.posts = await storeService.getPublishedItems();
    } catch {
      viewData.posts = [];
    }
  
    try {
      viewData.categories = await storeService.getCategories();
    } catch {
      viewData.categories = [];
    }
  
    res.render("shop", { data: viewData });
  });
  

// ITEMS
app.get("/Items", ensureLogin, (req, res) => {
  storeService.getAllItems()
    .then(data => res.render("Items", { items: data }))
    .catch(() => res.render("Items", { message: "No Items" }));
});

app.get("/Items/add", ensureLogin, (req, res) => {
  storeService.getCategories()
    .then(data => res.render("addPost", { categories: data }))
    .catch(() => res.render("addPost", { categories: [] }));
});

app.post("/Items/add", ensureLogin, (req, res) => {
  storeService.addItem(req.body)
    .then(() => res.redirect("/Items"))
    .catch((err) => {
      console.error("Add Post Failed:", err); 
      res.status(500).send("Unable to add post");
    });    
});

app.get("/Items/delete/:id", ensureLogin, (req, res) => {
  storeService.deletePostById(req.params.id)
    .then(() => res.redirect("/Items"))
    .catch(() => res.status(500).send("Unable to Remove Post / Post not found"));
});

// CATEGORIES
app.get("/categories", ensureLogin, (req, res) => {
  storeService.getCategories()
    .then(data => res.render("categories", { categories: data }))
    .catch(() => res.render("categories", { message: "no results" }));
});

app.get("/categories/add", ensureLogin, (req, res) => res.render("addCategory"));

app.post("/categories/add", ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to add category"));
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService.deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to Remove Category / Category not found"));
});

// AUTH
app.get("/login", (req, res) => res.render("login"));

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {
  authData.registerUser(req.body).then(() => {
    res.render("register", { successMessage: "User created" });
  }).catch(err => {
    res.render("register", { errorMessage: err, userName: req.body.userName });
  });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData.checkUser(req.body).then(user => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect("/Items");
  }).catch(err => {
    res.render("login", { errorMessage: err, userName: req.body.userName });
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// 404
app.use((req, res) => {
  res.status(404).render("404");
});

// Initialize
storeService.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error("Unable to start server: " + err));
