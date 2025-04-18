const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

let db;
let itemsCollection;
let categoriesCollection;

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    MongoClient.connect(process.env.MONGO_CONN_STRING)
      .then(client => {
        db = client.db(web322); // or your actual DB name
        itemsCollection = db.collection("items");
        categoriesCollection = db.collection("categories");
        console.log(" store-service connected to MongoDB");
        resolve();
      })
      .catch(err => {
        reject("Unable to connect to MongoDB in store-service");
      });
  });
};
  

// Add item
module.exports.addItem = function (itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;
    for (let prop in itemData) {
      if (itemData[prop] === "") itemData[prop] = null;
    }
    itemData.postDate = new Date();

    itemsCollection.insertOne(itemData)
      .then(() => resolve())
      .catch((err) => {
        console.error("Error creating item:", err);
        reject("unable to create post");
      });
  });
};

// Get all items
module.exports.getAllItems = function () {
  return new Promise((resolve, reject) => {
    itemsCollection.find({}).toArray()
      .then(data => resolve(data))
      .catch(err => {
        console.error(" getAllItems error:", err);
        reject("no results returned");
      });
  });
};

// Get item by ID
module.exports.getItemById = function (id) {
  return new Promise((resolve, reject) => {
    itemsCollection.findOne({ _id: new ObjectId(id) })
      .then(data => data ? resolve(data) : reject("no results returned"))
      .catch(err => {
        console.error("getItemById error:", err);
        reject("no results returned");
      });
  });
};

// Get items by category
module.exports.getItemsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    itemsCollection.find({ category }).toArray()
      .then(data => resolve(data))
      .catch(err => {
        console.error("getItemsByCategory error:", err);
        reject("no results returned");
      });
  });
};

// Get items by min date
module.exports.getItemsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
    itemsCollection.find({ postDate: { $gte: new Date(minDateStr) } }).toArray()
      .then(data => resolve(data))
      .catch(err => {
        console.error("getItemsByMinDate error:", err);
        reject("no results returned");
      });
  });
};

// Get published items
module.exports.getPublishedItems = function () {
  return new Promise((resolve, reject) => {
    itemsCollection.find({ published: true }).toArray()
      .then(data => resolve(data))
      .catch(err => {
        console.error("getPublishedItems error:", err);
        reject("no results returned");
      });
  });
};

// Get published items by category
module.exports.getPublishedItemsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    itemsCollection.find({ category: this.deleteCategoryById.toString(), published: true }).toArray()
      .then(data => resolve(data))
      .catch(err => {
        console.error(" getPublishedItemsByCategory error:", err);
        reject("no results returned");
      });
  });
};

// Get all categories
module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    categoriesCollection.find({}).toArray()
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

// Add category
module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
    for (let prop in categoryData) {
      if (categoryData[prop] === "") categoryData[prop] = null;
    }

    categoriesCollection.insertOne(categoryData)
      .then(() => resolve())
      .catch(err => {
        console.error(" addCategory error:", err);
        reject("unable to create category");
      });
  });
};

// Delete category
module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
    categoriesCollection.deleteOne({ _id: new ObjectId(id) })
      .then(() => resolve())
      .catch(() => reject("unable to delete category"));
  });
};

// Delete item
module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
    itemsCollection.deleteOne({ _id: new ObjectId(id) })
      .then(() => resolve())
      .catch(() => reject("unable to delete post"));
  });
};
