const fs = require('fs').promises;
const path = require('path');

let items = [];
let categories = [];

async function initialize() {
  try {
    const itemsData = await fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8');
    const categoriesData = await fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8');

    items = JSON.parse(itemsData);
    categories = JSON.parse(categoriesData);

    return "Initialization successful";
  } catch (error) {
    throw `Error initializing store service: ${error.message}`;
  }
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    items.length > 0 ? resolve(items) : reject("No items found");
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published);
    publishedItems.length > 0 ? resolve(publishedItems) : reject("No published items found");
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published && item.category == category);
    publishedItems.length > 0 ? resolve(publishedItems) : reject("No results returned");
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    categories.length > 0 ? resolve(categories) : reject("No categories found");
  });
}

function addItem(itemData) {
  return new Promise((resolve) => {
    const newItem = {
      id: items.length + 1,
      category: parseInt(itemData.category),
      postDate: new Date().toISOString().slice(0, 10),
      featureImage: itemData.featureImage || "https://dummyimage.com/200x200/000/fff",
      price: parseFloat(itemData.price),
      title: itemData.title,
      body: itemData.body,
      published: itemData.published === true
    };

    items.push(newItem);
    resolve(newItem);
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => item.category == category);
    filteredItems.length > 0 ? resolve(filteredItems) : reject("No results returned");
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const minDate = new Date(minDateStr);
    const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
    filteredItems.length > 0 ? resolve(filteredItems) : reject("No results returned");
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    const item = items.find(item => item.id == id);
    item ? resolve(item) : reject("No result returned");
  });
}

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getPublishedItemsByCategory,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById
};
