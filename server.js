const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

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
const {
  register,
  login,
  getPeople,
  addFriend,
  unFriend,
} = require("./controllers/user"); // user.js
const { createPost, getPosts } = require("./controllers/post"); // post.js
const { authUser } = require("./middlewares/auth");
const { uploadImage, uploadImageLink } = require("./controllers/upload");

app.post("/register", register);
app.post("/login", login);
app.post("/createPost", authUser, createPost);
app.get("/getPosts", authUser, getPosts);
app.get("/getPeople", getPeople);
app.post("/addFriend", authUser, addFriend);
app.post("/unFriend", authUser, unFriend);
app.post("/uploadImage", authUser, uploadImage);
app.post("/uploadImageLink", authUser, uploadImageLink);

const PORT = process.env.PORT || 8000;

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
