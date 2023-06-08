const cloudinary = require("cloudinary");
const fs = require("fs");
const User = require("../models/User.js");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

exports.uploadImage = async (req, res) => {
  try {
    const { userID, path } = req.body;
    const validUser = req.user.id;
    if (validUser != userID) {
      return res
        .status(400)
        .json({ message: "Your are not authorized to upload images" });
    }
    let file = req.files.file;
    let image = "";
    await cloudinary.v2.uploader
      .upload(file.tempFilePath, {
        resource_type: file.mimetype.split("/")[0],
        public_id: `${path}/${file.name}`,
        chunk_size: 1048576000,
      })
      .then((result) => {
        image = result.secure_url;
      });
    console.log(image);
    removeFile(file.tempFilePath);
    res.json(image);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.uploadImageLink = async (req, res) => {
  const { user, image } = req.body;
  const validUser = req.user.id;
  if (validUser != user.id) {
    return res
      .status(400)
      .json({ message: "Your are not authorized to upload images" });
  }
  console.log(user.id);
  await User.findByIdAndUpdate(user.id, { picture: image });
  console.log(await User.findById(user.id));
  res.status(200).json({ message: "Update success" });
};

// remove file from tmp folder
function removeFile(path) {
  fs.unlink(path, (err) => {
    // unlink is a litttle bit faster than rm
    if (err) {
      console.log(err.message);
    }
  });
}
