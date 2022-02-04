const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const shortUrl = require("./models/url.model");
const createHttpError = require("http-errors");
const shortId = require("shortid");
const { findOne } = require("./models/url.model");
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

app.get("/:shortId", async (req, res, next) => {
  try {
    const { shortId } = req.params;
    console.log(shortId);
    const result = await shortUrl.findOne({ shortId });
    if (!result) {
      throw createHttpError.NotFound("Short URL does not exist");
    }
    res.redirect(result.url);
  } catch (error) {
    next(error);
  }
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
        // short_url: `${req.headers.host}/${urlExists.shortId}`,
        short_url: `https://hg4.herokuapp.com/${urlExist.shortId}`,
      });
      return;
    }
    const ShortUrl = new shortUrl({ url: url, shortId: shortId.generate() });
    const result = await ShortUrl.save(); // save the shortId to MongoDb
    res.render("index", {
      //   short_url: `${req.headers.host}/${result.shortId}`,
      short_url: `https://hg4.herokuapp.com/${result.shortId}`,
    });
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
