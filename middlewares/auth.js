const jwt = require("jsonwebtoken");

//authentication middleware
exports.authUser = async (req, res, next) => {
  try {
    let temp = req.header("Authorization"); // get token from header (this is currently logged in user)
    const token = temp.slice(7, temp.length); // token must be sliced since "bearer " is not part of the token
    if (!token) {
      return res.status(400).json({ message: "invalid Authentication" });
    }
    // check if this is a valid token (does it link to a user?)
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) {
        console.log("Reached here");
        return res.status(400).json({ message: "invalid Authentication" });
      }
      req.user = user;
      next(); // goes to http request
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
