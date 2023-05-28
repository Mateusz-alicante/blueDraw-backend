const User = require("../models/User");
const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  try {
    const { description, image, user } = req.body;
    const validUser = req.user.id; // currently signed in user on browser
    if (validUser !== user.id) {
      console.log("reached here");
      return res
        .status(400)
        .json({ message: "Your are not authorized to post" });
    }
    console.log(description, image, user);
    const post = await new Post({
      description: description,
      image: image,
      user: user.id,
    }).save();
    res.status(200).json(post);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    console.log("reached here");
    let friends = await User.findById(req.user.id).select("friends");
    friends = friends.friends;
    const promises = friends.map((user) => {
      return Post.find({ user: user }).populate(
        "user",
        "firstName lastName username"
      );
    });
    let posts = await (await Promise.all(promises)).flat();
    let myPosts = await Post.find({ user: req.user.id }).populate(
      "user",
      "firstName lastName username"
    );
    posts.push(...[...myPosts]);
    posts.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    console.log(posts);
    res.json(posts);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
