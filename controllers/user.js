const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const jwt = require("jsonwebtoken");

const { lengthValidation, usernameExists } = require("../helpers/checks");

const { generateToken } = require("../helpers/tokens.js");

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, password } = req.body;

    // generate username
    d = new Date();
    num = Math.floor(d.getTime() * Math.random()).toString();
    username = firstName + lastName + num.slice(num.length - 2, num.length);
    while (await User.findOne({ username: username })) {
      num = Math.floor(d.getTime() * Math.random()).toString();
      username = firstName + lastName + num.slice(num.length - 2, num.length);
    }

    // check if lengths are okay
    if (!lengthValidation(firstName, 2, 30)) {
      return res.status(400).json({
        message: "First name must be between 3 and 30 characters",
      });
    }
    if (!lengthValidation(lastName, 2, 30)) {
      return res.status(400).json({
        message: "Last name must be between 3 and 30 characters",
      });
    }
    if (!lengthValidation(password, 6, 40)) {
      return res.status(400).json({
        message: "Password must be between 6 and 40 characters",
      });
    }

    // check if username already exists
    if (await usernameExists(username, User)) {
      return res.status(400).json({
        message: "Username already exists, try a different username",
      });
    }

    // encrypt password
    const cryptedPassword = await bcrypt.hash(password, 12);

    // save new user
    const user = await new User({
      firstName: firstName,
      lastName: lastName,
      username: username,
      password: cryptedPassword,
    }).save();

    // generate jwt token
    const token = generateToken({ id: user._id.toString() }, "7d");

    // send back info
    res.send({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      token: token,
      message: "Registeration with Bluedraw success!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log(req.body);
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({ username: username });

    if (!user) {
      // no user found
      return res
        .status(400)
        .json({ message: "This username is not connected to an account" });
    } else {
      // compare password with hash in database
      bcrypt.compare(password, user.password, (err, comparison) => {
        if (!err) {
          if (comparison) {
            // correct password
            const token = generateToken({ id: user._id.toString() }, "7d");
            res.send({
              id: user._id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              token: token,
            });
          } else {
            return res
              .status(400)
              .json({ message: "Wrong password. Please try again." });
          }
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// not tested yet
exports.addFriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      // check that you're not adding yourself as friend
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (!receiver.friends.includes(sender._id)) {
        await User.bulkWrite([
          {
            updateOne: {
              filter: { _id: receiver._id },
              update: {
                $push: { friends: sender._id },
              },
            },
          },
          {
            updateOne: {
              filter: { _id: sender._id },
              update: {
                $push: { friends: receiver._id },
              },
            },
          },
        ]);
        res.json({ message: "Friend has been added" });
      } else {
        return res.status(400).json({ message: "Already friends" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You cannot add yourself as friends" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.unfriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      // check that you're not c\unfriending yourself
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.friends.includes(sender._id) &&
        sender.friends.includes(receiver._id)
      ) {
        await User.bulkWrite([
          {
            updateOne: {
              filter: { _id: sender._id },
              update: {
                $pull: {
                  friends: receiver._id,
                },
              },
            },
          },
          {
            updateOne: {
              filter: { _id: receiver._id },
              update: {
                $pull: {
                  friends: sender._id,
                },
              },
            },
          },
        ]);
        res.json({ message: "Unfriend success" });
      } else {
        return res.status(400).json({ message: "Already not friends" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    let users = await User.find({ $text: { $search: searchTerm } }).select(
      "firstName lastName username"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const validUser = req.user.id; // currently signed in user on browser
    if (validUser !== user.id) {
      console.log("reached here");
      return res
        .status(400)
        .json({ message: "Your are not authorized to get friend list" });
    }
    const friends = await User.findById(user.id).select("friends");
    res.status(200).json({ friends: friends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPeople = async (req, res) => {
  try {
    const validUser = req.user.id; // currently signed in user on browser
    if (validUser !== user.id) {
      console.log("reached here");
      return res
        .status(400)
        .json({ message: "Your are not authorized to get people list" });
    }
    const people = await User.find();
    res.status(200).json({ people: people });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
