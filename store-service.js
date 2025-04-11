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


// Define the Category model
const Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

// Define the Item model
const Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
  category: Sequelize.INTEGER
});

// Set up relationship
Item.belongsTo(Category, { foreignKey: 'category' });


module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("unable to sync the database: " + err);
      });
  });
};


module.exports.getAllItems = function () {
  return new Promise((resolve, reject) => {
    Item.findAll({
    })
    .then((data) => {
      if (data.length > 0) {
        resolve(data);
      } else {
        reject("no results returned");
      }
    })
    .catch(() => {
      reject("no results returned");
    });
  });
};



module.exports.getItemsByCategory = function (category) {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: { category: category },
          include: [Category]
      })
      .then((data) => {
          if (data.length > 0) {
              resolve(data);
          } else {
              reject("no results returned");
          }
      })
      .catch((err) => {
          reject("no results returned");
      });
  });
};

const { gte } = Sequelize.Op;

module.exports.getItemsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
        .then((data) => {
            if (data.length > 0) {
                resolve(data);
            } else {
                reject("no results returned");
            }
        })
        .catch((err) => {
            reject("no results returned");
        });
    });
};


module.exports.getItemById = function (id) {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: { id: id },
          include: [Category]
      })
      .then((data) => {
          if (data.length > 0) {
              resolve(data[0]); // Return only the first item
          } else {
              reject("no results returned");
          }
      })
      .catch((err) => {
          reject("no results returned");
      });
  });
};


module.exports.addItem = function (itemData) {
  return new Promise((resolve, reject) => {
      itemData.published = (itemData.published) ? true : false;

      for (let prop in itemData) {
          if (itemData[prop] === "") {
              itemData[prop] = null;
          }
      }

      if (itemData.category) {
        itemData.category = parseInt(itemData.category);
    }

      itemData.postDate = new Date();

      Item.create(itemData)
          .then(() => {
              resolve();
          })
          .catch((err) => {
              reject("unable to create post");
          });
  });
};


module.exports.getPublishedItems = function () {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: { published: true }
      })
      .then((data) => {
          if (data.length > 0) {
              resolve(data);
          } else {
              reject("no results returned");
          }
      })
      .catch((err) => {
          reject("no results returned");
      });
  });
};


module.exports.getPublishedItemsByCategory = function (category) {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: {
              published: true,
              category: category
          }
      })
      .then((data) => {
          if (data.length > 0) {
              resolve(data);
          } else {
              reject("no results returned");
          }
      })
      .catch((err) => {
          reject("no results returned");
      });
  });
};


module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
      Category.findAll()
          .then((data) => {
              if (data.length > 0) {
                  resolve(data);
              } else {
                  reject("no results returned");
              }
          })
          .catch((err) => {
              reject("no results returned");
          });
  });
};


module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
      for (let prop in categoryData) {
          if (categoryData[prop] === "") {
              categoryData[prop] = null;
          }
      }

      Category.create(categoryData)
          .then(() => {
              resolve();
          })
          .catch((err) => {
              reject("unable to create category");
          });
  });
};


module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
      Category.destroy({
          where: { id: id }
      })
      .then(() => {
          resolve();
      })
      .catch((err) => {
          reject("unable to delete category");
      });
  });
};


module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
      Item.destroy({
          where: { id: id }
      })
      .then(() => {
          resolve();
      })
      .catch((err) => {
          reject("unable to delete post");
      });
  });
};

