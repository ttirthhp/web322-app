const fs = require("fs");

let items = [];
let categories = [];

// Initialize: Load JSON files into memory
function initialize() {
    return new Promise((resolve, reject) => {
        fs.readFile("./data/items.json", "utf8", (err, data) => {
            if (err) {
                reject("Unable to read items.json file");
                return;
            }
            items = JSON.parse(data);

            fs.readFile("./data/categories.json", "utf8", (err, data) => {
                if (err) {
                    reject("Unable to read categories.json file");
                    return;
                }
                categories = JSON.parse(data);
                resolve();
            });
        });
    });
}

// Get all items
function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) resolve(items);
        else reject("No items found");
    });
}

// Get published items only
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) resolve(publishedItems);
        else reject("No published items found.");
    });
}

// Get all categories
function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) resolve(categories);
        else reject("No categories found");
    });
}

// Export functions
module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
