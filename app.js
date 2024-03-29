const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const shortUrl = require("./models/url.model");
const createHttpError = require("http-errors");
const shortId = require("shortid");
const { findOne } = require("./models/url.model");
const validURL = require("./url_validate");
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
const connectMongoDb = async () => {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
    });
    console.log("mongodb connected...");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};
connectMongoDb();

// @ROUTES
// @GET
app.get("/", async (req, res, next) => {
  res.render("index");
});

// @POST
app.post("/", async (req, res, next) => {
  try {
    const { url } = req.body;
    const { custom_id } = req.body;
    if (!validURL(url)) {
      throw createHttpError.BadRequest("Provide a valid url");
    }
    const urlExist = await shortUrl.findOne({ url });
    if (urlExist) {
      res.render("index", {
        // short_url: `http://localhost:3000/${urlExist.shortId}`,
        short_url: `https://hg4.herokuapp.com/${urlExist.shortId}`,
      });
      return;
    }
    let id = shortId.generate();
    if (custom_id) {
      const custom = await shortUrl.findOne({ shortId: custom_id });
      if (custom) {
        throw createHttpError.BadRequest("Custom-id already taken");
      }
      id = custom_id;
    }
    const ShortUrl = new shortUrl({ url: url, shortId: id });
    const result = await ShortUrl.save(); // save the shortId to MongoDb
    res.render("index", {
      // short_url: `http://localhost:3000/${result.shortId}`,
      short_url: `https://hg4.herokuapp.com/${result.shortId}`,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/:shortId", async (req, res, next) => {
  try {
    const { shortId } = req.params;
    const result = await shortUrl.findOne({ shortId });
    if (!result) {
      throw createHttpError.NotFound("Short URL doesn't exist");
    }
    res.redirect(result.url);
  } catch (error) {
    next(error);
  }
});

// @APP-USE
app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("index", { error: err.message });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
