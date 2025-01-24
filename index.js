// Required dependencies
const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const cors = require("cors");
const main = require('./temp.js');


const app = express();
const PORT = 3001;
app.use(cors());

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
  topwear: ["bottomwear", "bottomwear", "footwear"],
  bottomwear: ["topwear", "topwear", "footwear"],
  accessories: ["topwear", "bottomwear", "footwear"],
  footwear: ["topwear", "bottomwear", "accessories"],
  "plus size": ["bottomwear", "accessories", "footwear"],
  winterwear: ["topwear", "accessories", "footwear"],
};
function getRandomItems(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random()); // Shuffle the array
  return shuffled.slice(0, count); // Pick the first 'count' items
}
app.get("/api/products", (req, res) => {
  const csvFilePath = path.join(__dirname, "data.csv"); // Replace 'data.csv' with your CSV file name
  const results = [];

  // Read and parse the CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const randomProducts = getRandomItems(results, 100); // Get 100 random products
      res.json({ data: randomProducts });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Failed to read CSV file." });
    });
});

app.get("/api/product", (req, res) => {
  const { style_id } = req.query; // Extract style_id from query parameters

  if (!style_id) {
    return res.status(400).json({ error: "style_id parameter is required." });
  }

  const csvFilePath = path.join(__dirname, "data.csv"); // Replace 'data.csv' with your CSV file name
  const results = [];

  // Read and parse the CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      // Find the product with the matching style_id
      const product = results.find((item) => item.style_id === style_id);

      if (product) {
        res.json({ product });
      } else {
        res
          .status(404)
          .json({ error: `Product with style_id "${style_id}" not found.` });
      }
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Failed to read CSV file." });
    });
});
// API endpoint to get recommendations
app.get("/recommendations/:style_id", async (req, res) => {
  try {
    const styleId = req.params.style_id;
    const recommendations=await main(styleId)

     res.json({
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
