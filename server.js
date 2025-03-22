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
        let items;
        if (req.query.category) {
            items = await storeService.getItemsByCategory(req.query.category);
        } else if (req.query.minDate) {
            items = await storeService.getItemsByMinDate(req.query.minDate);
        } else {
            items = await storeService.getAllItems();
        }

        if (items.length > 0) {
            res.render("items", { items: items });
        } else {
            res.render("items", { message: "No results found" });
        }
    } catch (err) {
        res.status(500).render("items", { message: err.message || "Error fetching items" });
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

app.get("/items/add", (req, res) => {
    res.render("addItem");
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

app.use((req, res) => {
    res.status(404).render("404");
});

storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error(`❌ Failed to initialize store service: ${err}`);
    });
