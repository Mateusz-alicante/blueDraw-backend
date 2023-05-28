const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
require("dotenv").config();

const app = express();

app.use(express.json());

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(
  fileUpload({
    useTempFiles: true,
  })
);

app.get("/", (req, res) => {
  res.send("This is the homepage");
});

// database
mongoose
  .connect(process.env.MONGOURL, {
    useNewUrlParser: true,
  })
  .then(
    (good) => {
      console.log("database connected successfully");
    },
    (bad) => {
      console.log("error connecting to database", bad);
    }
  );

// routes
const { register, login } = require("./controllers/user"); // user.js
const { createPost, getAllPosts } = require("./controllers/post"); // post.js
const { authUser } = require("./middlewares/auth");

app.post("/register", register);
app.post("/login", login);
app.post("/createPost", authUser, createPost);
app.get("/getAllPosts", authUser, getAllPosts);

const PORT = process.env.PORT || 8000;

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
