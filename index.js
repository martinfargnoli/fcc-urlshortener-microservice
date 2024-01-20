require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongodb = require("mongodb");
const dns = require("dns");
const urlparser = require("url");

// Connection to the database.
const client = new mongodb.MongoClient(process.env.MONGODB_URI);
const db = client.db("urlshortener");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Endpoint to create short URLs.
app.post("/api/shorturl", function (req, res) {
  const dnsLookup = dns.lookup(
    urlparser.parse(req.body.url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        const urlNum = await urls.countDocuments({});
        const urlDoc = {
          url: req.body.url,
          short_url: urlNum,
        };
        const result = await urls.insertOne(urlDoc);
        res.json({
          original_url: req.body.url,
          short_url: urlNum,
        });
      }
    },
  );
});

// Endpoint to redirect to the original URL using the short URL.
app.get("/api/shorturl/:short_url", async (req, res) => {
  const urlDoc = await urls.findOne({ short_url: +req.params.short_url });
  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.json({ error: "URL not found." });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
