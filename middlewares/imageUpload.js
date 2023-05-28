const fs = require("fs");

module.exports = async function (req, res, next) {
  try {
    // req.files is from the express-fileUpload package!
    // Object.values(arr) put all the object values into an array
    // eliminateNest eliminates all nested arrays in array
    let files = Object.values(req.files).flat();
    // no files selected
    if (!req.files || files.length === 0) {
      return res.status(400).json({ message: "No files selected" });
    }

    // file type not supported and file size too big
    // first initialize error
    error = new Object({
      type: false,
      size: false,
    });
    // now see which ones have error
    for (let i = 0; i < files.length; i++) {
      fileType = files[i].mimetype.split("/")[0]; // this is the file type (eg. "video", "image")
      fileSize = files[i].size;
      if (fileType !== "image" && fileType !== "video") {
        removeFile(files[i].tempFilePath);
        error["type"] = true;
      }
      if (fileSize > 1024 * 1024 * 100) {
        removeFile(files[i].tempFilePath);
        error["size"] = true;
      }
    }
    // return error message
    if (error.type) {
      return res.status(400).json({ message: "Unsupported file type" });
    }
    if (error.size) {
      return res.status(400).json({ message: "File size too big" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//remove file from tmp folder
function removeFile(path) {
  fs.unlink(path, (err) => {
    // unlink is a litttle bit faster than rm
    if (err) {
      console.log(err.message);
    }
  });
}
