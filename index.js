// Required dependencies
const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const app = express();
const PORT = 3000;

// File path to the CSV fileS
const csvFilePath = path.join(__dirname, "data.csv");

// Function to load CSV data on demand
const loadCsvData = () => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
          rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

// Occasion compatibility rules
const occasionCompatibility = {
  casual: ["casual", "formal"],
  formal: ["semi-formal", "partywear", "casual"],
  "semi-formal": ["formal"],
  partywear: ["formal"],
  athleisure: ["athleisure"],
};

// Category pairing rules
const categoryPairing = {
  topwear: ["bottomwear", "accessories", "footwear"],
  bottomwear: ["topwear", "accessories", "footwear"],
  accessories: ["topwear", "bottomwear", "footwear"],
  footwear: ["topwear", "bottomwear", "accessories"],
  "plus size": ["bottomwear", "accessories", "footwear"],
  winterwear: ["topwear", "accessories", "footwear"],
};

// API endpoint to get recommendations
app.get("/recommendations/:style_id", async (req, res) => {
  try {
    const styleId = req.params.style_id;

    if (!styleId) {
      return res.status(400).json({ error: "Invalid style_id" });
    }

    // Load CSV data dynamically
    const data = await loadCsvData();

    // Find the product with the given style_id
    const product = data.find((item) => item.style_id == styleId);

    if (!product) {
      return res
        .status(404)
        .json({ error: `No product found with style_id ${styleId}` });
    }

    const category = product.category.trim();

    // Validate category against pairing rules
    if (!categoryPairing[category]) {
      return res
        .status(400)
        .json({ error: `Unknown category '${category}' in product data.` });
    }

    // Get the array of paired categories for the given category
    const pairedCategories = categoryPairing[category];

    const recommendedDataArray = pairedCategories.map((pair) => {
      let categorydata = [];
      data.map((item) => {
        if (item.category === pair) categorydata.push(item);
      });
      return categorydata;
    });

    const recommendations = recommendedDataArray.map((recommendation) => {
      const itemLength = recommendation.length;
      const randomIndex = Math.floor(Math.random() * itemLength);
      return recommendation[randomIndex];
    });

    res.json({
      productDetails: product,
      recommendedProducts: recommendations,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
