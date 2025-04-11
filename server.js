/*********************************************************************************
* WEB322 – Assignment 04
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Tirth Patel Student ID: 176929230 Date: 2025-03-21
*
* GitHub Repository URL: https://github.senecapolytechnic.ca/tapatel16/web322-app
*
********************************************************************************/

require("dotenv").config();
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const app = express();
const PORT = process.env.PORT || 8080;

// Handlebars setup
app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        navLink: function (url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active"' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            return (lvalue != rvalue) ? options.inverse(this) : options.fn(this);
        },
        safeHTML: function (context) {
            return context;
        },
        formatDate: function(dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
}));
app.set("view engine", ".hbs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split("/")[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dqgydijd0",
    api_key: process.env.API_KEY || "115735492794245",
    api_secret: process.env.API_SECRET || "G4o2rsCNecxGLBHAKrv_HkBfYkA",
    secure: true
});
const upload = multer();

// Routes
app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/shop", async (req, res) => {
    try {
      const categoryFilter = req.query.category;
  
      const categories = await storeService.getCategories();
  
      let publishedItems;
  
      if (categoryFilter) {
        publishedItems = await storeService.getPublishedItemsByCategory(categoryFilter);
      } else {
        publishedItems = await storeService.getPublishedItems();
      }
  
      const latestItem = publishedItems.length > 0 ? publishedItems[0] : null;
  
      res.render("shop", {
        data: {
          post: latestItem,
          posts: publishedItems,
          categories: categories,
          viewingCategory: categoryFilter
        }
      });
    } catch (err) {
      res.render("shop", {
        data: {
          message: "Error loading shop: " + (err.message || "unknown error")
        }
      });
    }
  });
  

app.get("/Items", (req, res) => {
    storeService.getAllItems()
        .then(data => {
            if (data.length > 0) {
                res.render("Items", { items: data });
            } else {
                res.render("Items", { message: "No Items" });
            }
        })
        .catch(() => res.render("Items", { message: "No Items" }));
});

app.get("/Items/add", (req, res) => {
    storeService.getCategories()
        .then(data => res.render("addPost", { categories: data }))
        .catch(() => res.render("addPost", { categories: [] }));
});

app.post("/Items/add", (req, res) => {
    storeService.addItem(req.body)
        .then(() => res.redirect("/Items"))
        .catch(() => res.status(500).send("Unable to add post"));
});

app.get("/Items/delete/:id", (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => res.redirect("/Items"))
        .catch(() => res.status(500).send("Unable to Remove Post / Post not found"));
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => {
            if (data.length > 0) {
                res.render("categories", { categories: data });
            } else {
                res.render("categories", { message: "no results" });
            }
        })
        .catch(() => res.render("categories", { message: "no results" }));
});

app.get("/categories/add", (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect("/categories"))
        .catch(() => res.status(500).send("Unable to add category"));
});

app.get("/categories/delete/:id", (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect("/categories"))
        .catch(() => res.status(500).send("Unable to Remove Category / Category not found"));
});

app.use((req, res) => {
    res.status(404).render("404");
});

storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error(`Failed to initialize store service: ${err}`);
    });
