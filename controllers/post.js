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
    console.log("reached getposts");
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
        console.log("Reached friends posts");
        friends = await User.findById(req.user.id).select("friends");
        friends = friends.friends;
        // I know what the problem is friends and public posts don't get displayed
        requestOptions = [
          {
            $or: [
              { $and: [{ user: { $in: friends } }, { privacy: "friends" }] },
              { $and: [{ privacy: "public" }, { user: { $ne: req.user.id } }] },
            ],
          },
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
