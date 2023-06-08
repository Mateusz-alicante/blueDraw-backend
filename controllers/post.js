const User = require("../models/User");
const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  try {
    const { description, image, user, privacy } = req.body;
    const validUser = req.user.id; // currently signed in user on browser
    if (validUser !== user.id) {
      return res
        .status(400)
        .json({ message: "Your are not authorized to post" });
    }
    console.log(description, image, user);
    const post = await new Post({
      description: description,
      image: image,
      user: user.id,
      privacy: privacy,
    }).save();
    console.log("create Post successfully");
    res.status(200).json(post);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    // construct the object that will allow us to fewtch the correct posts based on the request otions
    let requestOptions;
    let friends;
    switch (req.query.option) {
      case "public":
        friends = await User.findById(req.user.id).select("friends");
        friends = friends.friends;
        requestOptions = [
          { user: req.user.id },
          { $and: [{ user: { $in: friends } }, { privacy: "friends" }] },
          { privacy: "public" },
        ];
        break;
      case "friends":
        friends = await User.findById(req.user.id).select("friends");
        friends = friends.friends;
        requestOptions = [
          { $and: [{ user: { $in: friends } }, { privacy: "friends" }] },
        ];
        break;
      case "private":
        requestOptions = [{ user: req.user.id }];
        break;
    }

    // find the list of friends of the user that is logged in

    const posts = await Post.find({
      $or: requestOptions,
    })
      .sort({ createdAt: "desc" })
      .skip(req.query.page * req.query.limit)
      .limit(req.query.limit)
      .populate("user", "firstName lastName username");

    res.json({ posts, hasMore: posts.length == req.query.limit });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

exports.getFriendsPosts = async (req, res) => {
  try {
    // find the list of friends of the user that is logged in
    let friends = await User.findById(req.user.id).select("friends");
    friends = friends.friends;
    // get all the non-private posts of the friends
    const promises = friends.map((user) => {
      return Post.find({
        user: user,
        privacy: { $in: ["friends", "public"] },
      }).populate("user", "firstName lastName username");
    });

    // posts is the array of posts to be displayed
    let posts = await (await Promise.all(promises)).flat();

    // find all personal posts
    let myPosts = await Post.find({ user: req.user.id }).populate(
      "user",
      "firstName lastName username"
    );

    // append personal posts to posts lists
    posts.push(...[...myPosts]);

    // sort posts by the date they are created at
    posts.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });

    res.json(posts);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

exports.getPrivatePosts = async (req, res) => {
  try {
    // find all personal posts
    let myPosts = await Post.find({ user: req.user.id }).populate(
      "user",
      "firstName lastName username"
    );

    // sort posts by the date they are created at
    myPosts.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });

    res.json(myPosts);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};
