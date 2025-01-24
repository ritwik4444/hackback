const sqlite3 = require("sqlite3");

const products = new sqlite3.Database("./products.db");

const PRODUCT_FETCH_LIMIT = 10;

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function dbGet(query) {
  return new Promise((resolve, reject) => {
    products.get(query, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function dbGetAll(query) {
  return new Promise((resolve, reject) => {
    products.all(query, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

const mappings = {
  topwear: ["bottomwear", "accessories", "footwear"],
  bottomwear: ["topwear", "accessories", "footwear"],
  accessories: ["topwear", "bottomwear", "footwear"],
  footwear: ["topwear", "bottomwear", "accessories"],
  "plus size": ["bottomwear", "accessories", "footwear"],
  winterwear: ["topwear", "accessories", "footwear"],
};

// const selectedProductId = '318225';

async function main(selectedProductId) {
  const product = await dbGet(
    `select * from products where style_id = '${selectedProductId}'`
  );

  const recommendations = [];
  for (const recoCategory of mappings[product.category]) {
    try {
      let query = `select * from products 
                where category = '${recoCategory}'
                and occasion = '${product.occasion}'
                and gender = '${product.gender}'
                and colour != '${product.colour}' 
            `;

      if (product.occasion === "casual") {
        query += " and sub_category != 'belts'";
      }

      query += ` limit ${PRODUCT_FETCH_LIMIT}`;

      // console.log({query})
      const currentRecos = await dbGetAll(query);

      if (currentRecos) {
        recommendations.push(getRandomItem(currentRecos));
      }
    } catch (e) {
      console.error("SQL error:", e);
    }
  }
  return recommendations.length > 0 ? recommendations : [];
}

module.exports = main;
