const Sequelize = require('sequelize');
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
  }
);

// Define models
const Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

const Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

// Set up relation
Item.belongsTo(Category, { foreignKey: 'categoryId' });

// Initialize DB
module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize.sync({ force: true })
      .then(() => resolve())
      .catch(err => reject("Unable to sync the database: " + err));
  });
};

// Add item (works with /Items/add)
module.exports.addItem = function (itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = !!itemData.published;
    itemData.postDate = new Date();

    // Clean empty strings
    for (let key in itemData) {
      if (itemData[key] === "") itemData[key] = null;
    }

    // Ensure categoryId is an integer
    if (itemData.categoryId) {
      itemData.categoryId = parseInt(itemData.categoryId);
    }

    Item.create(itemData)
      .then(() => resolve())
      .catch(err => reject("Unable to create item: " + err));
  });
};

// Get all items
module.exports.getAllItems = function () {
  return new Promise((resolve, reject) => {
    Item.findAll({ include: [Category] })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

// Get item by ID
module.exports.getItemById = function (id) {
  return new Promise((resolve, reject) => {
    Item.findByPk(id)
      .then(data => (data ? resolve(data) : reject("no result returned")))
      .catch(() => reject("no result returned"));
  });
};

// Get items by categoryId
module.exports.getItemsByCategory = function (categoryId) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { categoryId },
      include: [Category]
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

// Get published items
module.exports.getPublishedItems = function () {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true },
      include: [Category]
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

// Get published items by categoryId
module.exports.getPublishedItemsByCategory = function (categoryId) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
        categoryId
      },
      include: [Category]
    })
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

// Get all categories
module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(data => resolve(data))
      .catch(() => reject("no results returned"));
  });
};

// Add a category
module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
    for (let key in categoryData) {
      if (categoryData[key] === "") categoryData[key] = null;
    }

    Category.create(categoryData)
      .then(() => resolve())
      .catch(() => reject("unable to create category"));
  });
};

// Delete a post
module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
    Item.destroy({ where: { id } })
      .then(() => resolve())
      .catch(() => reject("unable to delete post"));
  });
};

// Delete a category
module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
    Category.destroy({ where: { id } })
      .then(() => resolve())
      .catch(() => reject("unable to delete category"));
  });
};
