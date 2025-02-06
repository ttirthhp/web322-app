const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Read JSON files
const categories = JSON.parse(fs.readFileSync("./data/categories.json"));
const items = JSON.parse(fs.readFileSync("./data/items.json"));

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// Get all categories
app.get("/categories", (req, res) => {
    res.json(categories);
});

// Get items by category ID
app.get("/items/:categoryId", (req, res) => {
    const categoryId = parseInt(req.params.categoryId);
    const filteredItems = items.filter(item => item.category === categoryId);
    res.json(filteredItems);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
