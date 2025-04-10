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

app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        navLink: function (url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active"' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            return (lvalue != rvalue) ? options.inverse(this) : options.fn(this);
        },
        safeHTML: function (context) {
            return context;
        },
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            let day = dateObj.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        ifEquals: function (a, b, options) {
            return a == b ? options.fn(this) : options.inverse(this);
        }
    }
}));


app.set("view engine", ".hbs");

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split("/")[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Cloudinary setup
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
        const publishedItems = await storeService.getPublishedItems();
        const categories = await storeService.getCategories();
        const latestItem = publishedItems.length > 0 ? publishedItems[0] : null;

        res.render("shop", {
            data: {
                post: latestItem,
                posts: publishedItems,
                categories: categories,
                viewingCategory: req.query.category
            }
        });
    } catch (err) {
        res.render("shop", { data: { message: err.message || "Error fetching shop data" } });
    }
});

app.get("/shop/:id", async (req, res) => {
    try {
        const item = await storeService.getItemById(req.params.id);
        if (!item) {
            return res.status(404).render("shop", { data: { message: "Item not found" } });
        }

        const publishedItems = await storeService.getPublishedItems();
        const categories = await storeService.getCategories();

        res.render("shop", {
            data: {
                post: item,
                posts: publishedItems,
                categories: categories,
                viewingCategory: req.query.category
            }
        });
    } catch (err) {
        res.status(500).render("shop", { data: { message: err.message || "Error fetching item" } });
    }
});


  app.get("/items", async (req, res) => {
    try {
      const categories = await storeService.getCategories();
      let items;
  
      if (req.query.category) {
        items = await storeService.getItemsByCategory(req.query.category);
      } else {
        items = await storeService.getAllItems();
      }
  
      res.render("items", {
        items,
        categories,
        viewingCategory: req.query.category
      });
    } catch (err) {
      res.status(500).render("items", { message: "Error fetching items" });
    }
  });
  
app.get("/item/:id", async (req, res) => {
    try {
        const item = await storeService.getItemById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message || "Error fetching item" });
    }
});

app.get("/categories", async (req, res) => {
    try {
        const categories = await storeService.getCategories();
        if (categories.length > 0) {
            res.render("categories", { categories });
        } else {
            res.render("categories", { message: "No results found" });
        }
    } catch (err) {
        res.status(500).render("categories", { message: err.message || "Error fetching categories" });
    }
});

app.get("/Items/add", (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.render("addPost", { categories: data });
        })
        .catch(() => {
            res.render("addPost", { categories: [] });
        });
});


app.post("/items/add", upload.single("featureImage"), async (req, res) => {
    try {
        let imageUrl = "";

        if (req.file) {
            const streamUpload = (req) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream((error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    });
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };
            const uploadResult = await streamUpload(req);
            imageUrl = uploadResult.url;
        }

        const newItem = {
            title: req.body.title,
            category: req.body.category,
            price: req.body.price,
            body: req.body.body,
            published: req.body.published ? true : false,
            featureImage: imageUrl
        };

        await storeService.addItem(newItem);
        res.redirect("/items");
    } catch (err) {
        res.status(500).json({ message: err.message || "Error adding item" });
    }
});

app.get("/categories/add", (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect("/categories");
        })
        .catch((err) => {
            res.status(500).send("Unable to add category");
        });
});

app.get("/categories/delete/:id", (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.get("/Items/delete/:id", (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => {
            res.redirect("/Items");
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Post / Post not found");
        });
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
