const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const jwt = require("jsonwebtoken");

const {
  lengthValidation,
  usernameExists,
  emailExists,
} = require("../helpers/checks");

const { generateToken } = require("../helpers/tokens.js");

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, password, email, username } = req.body;

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

    // check if email already exists
    if (await emailExists(email, User)) {
      return res.status(400).json({
        message: "Email already exists, try a different email",
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
      email: email,
    }).save();

    // generate jwt token
    const token = generateToken({ id: user._id.toString() }, "7d");

    console.log("reached end of signup");
    // send back info
    res.send({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      token: token,
      friends: user.friends,
      picture: user.picture,
      email: email,
      message: "Registeration with Bluedraw success!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email: email });

    if (!user) {
      // no user found
      return res
        .status(400)
        .json({ message: "This email is not connected to an account" });
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
              friends: user.friends,
              picture: user.picture,
              email: email,
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
    if (req.user.id !== req.body.id) {
      console.log("reached here 2");
      // check that you're not adding yourself as friend
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.body.id);
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
        result = await User.findById(req.user.id).select("friends");
        console.log(result);
        console.log("reached here 3");
        res.send({ result });
      } else {
        console.log("reached here 4");
        return res.status(400).json({ message: "Already friends" });
      }
    } else {
      console.log("add self");
      return res
        .status(400)
        .json({ message: "You cannot add yourself as friends" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.unFriend = async (req, res) => {
  try {
    if (req.user.id !== req.body.id) {
      // check that you're not c\unfriending yourself
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.body.id);
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
        result = await User.findById(req.user.id).select("friends");
        console.log(result);
        console.log("reached here");
        res.send({ result });
      } else {
        return res.status(400).json({ message: "Already not friends" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getPeople = async (req, res) => {
  try {
    console.log(req.query);
    const people = await User.find({}).select(
      "firstName friends id lastName picture token username"
    );
    res.status(200).json({ people: people });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
