const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const shortUrl = require("./models/url.model");
const createHttpError = require("http-errors");
const shortId = require("shortid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// @setting up middleware:
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// @setting up view engine
app.set("view engine", "ejs");

// @MONGO-DB Connection
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
mongoose
  .connect(mongoUrl, {
    dbName: "url-shrinker",
  })
  .then(() => console.log("mongodb connected..."))
  .catch(() => console.log("Error Connecting to mongodb"));

// @ROUTES

// @GET
app.get("/", async (req, res, next) => {
  res.render("index");
});

// @POST
app.post("/", async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      throw createHttpError.BadRequest("Provide a valid url");
    }
    const urlExist = await shortUrl.findOne({ url });
    if (urlExist) {
      res.render("index", {
        short_url: `http://localhost:${PORT}/${urlExist.shortId}`,
      });
      return;
    }
    const ShortUrl = new shortUrl({ url: url, shortId: shortId.generate() });
    const result = await ShortUrl.save(); // save the shortId to MongoDb
    res.render("index", {
      short_url: `http://localhost:${PORT}/${result.shortId}`,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/:shortId", async (req, res, next) => {
  try {
    const { shortId } = req.params;
    const result = await shortUrl.findOne({ shortId: shortId });
    if (!result) {
      throw createHttpError.NotFound("Short URL does not exist");
    }
    res.redirect(result.url);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("index", { error: err.message });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
