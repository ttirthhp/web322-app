require("dotenv").config();
const express = require("express");
const path = require("path");
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const app = express();
const PORT = process.env.PORT || 8080;

// Debugging: Print Cloudinary API keys to verify they are loaded
console.log("Cloudinary Config:", process.env.CLOUD_NAME, process.env.API_KEY, process.env.API_SECRET);

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dqgydijd0",
    api_key: process.env.API_KEY || "115735492794245",
    api_secret: process.env.API_SECRET || "G4o2rsCNecxGLBHAKrv_HkBfYkA",
    secure: true
});

// Multer for file uploads
const upload = multer();

// Serve static files & middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views/about.html"));
});

app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: err }));
});

app.get("/items", (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => res.json(data))
            .catch(err => res.status(404).json({ message: err }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(data => res.json(data))
            .catch(err => res.status(404).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then(data => res.json(data))
            .catch(err => res.status(404).json({ message: err }));
    }
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: err }));
});

app.get("/items/add", (req, res) => {
    res.sendFile(path.join(__dirname, "views/addItem.html"));
});

app.post("/items/add", upload.single("featureImage"), async (req, res) => {
    let imageUrl = "";

    if (req.file) {
        try {
            const uploaded = await new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
            imageUrl = uploaded.secure_url;
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).send("Image upload failed.");
        }
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body)
            .then(() => res.redirect("/items"))
            .catch(err => {
                console.error("Item processing error:", err);
                res.status(500).send(err);
            });
    }

    processItem(imageUrl);
});

app.get("/item/:id", (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: err }));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "views/404.html"));
});

storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("ERROR: Failed to initialize store service", err);
    });