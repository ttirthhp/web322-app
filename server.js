const express = require("express");
const path = require("path");
const storeService = require("./store-service");

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// About Page
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views/about.html"));
});

// Route: /shop - Returns only published items
app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: err }));
});

app.get("/items/:categoryId", (req, res) => {
    const categoryId = parseInt(req.params.categoryId);
    storeService.getAllItems()
        .then(items => {
            const filteredItems = items.filter(item => item.category === categoryId);
            res.json(filteredItems);
        })
        .catch(err => res.status(404).json({ message: err }));
});


app.get("/shop", (req, res) => {
    console.log("DEBUG: /shop route hit."); // Debugging

    storeService.getPublishedItems()
        .then(data => {
            console.log("DEBUG: Sending JSON data to client:", data);
            res.json(data);
        })
        .catch(err => {
            console.error("DEBUG: Error in /shop route:", err);
            res.status(404).json({ message: err });
        });
});

// Route: /items - Returns all items
app.get("/items", (req, res) => {
    storeService.getAllItems()
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: err }));
});

// Route: /categories - Returns all categories
app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: err }));
});

// Handle unmatched routes with a proper 404 page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "views/404.html"));
});

// Start the server only after loading data
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT} http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("ERROR: Failed to initialize store service", err);
    });
