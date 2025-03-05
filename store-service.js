const fs = require("fs");
const path = require("path");

let items = [];
let categories = [];

function readJSONFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            reject(`File not found: ${filePath}`);
            return;
        }
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                reject(`Error reading file: ${filePath}`);
                return;
            }
            resolve(JSON.parse(data));
        });
    });
}

function initialize() {
    return new Promise((resolve, reject) => {
        Promise.all([
            readJSONFile(path.join(__dirname, "data", "items.json")),
            readJSONFile(path.join(__dirname, "data", "categories.json"))
        ]).then(([itemsData, categoriesData]) => {
            items = itemsData;
            categories = categoriesData;
            resolve();
        }).catch(err => reject(err));
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned.");
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No published items found.");
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No categories found.");
        }
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        if (!itemData.title || !itemData.category || !itemData.postDate) {
            reject("Missing required fields");
            return;
        }
        
        if (itemData.published === undefined) {
            itemData.published = false;
        } else {
            itemData.published = true;
        }

        itemData.id = items.length + 1;
        items.push(itemData);
        resolve(itemData);
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        let item = items.find(item => item.id == id);
        if (item) {
            resolve(item);
        } else {
            reject("No result returned");
        }
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById
};