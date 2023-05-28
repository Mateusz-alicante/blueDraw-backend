exports.usernameExists = (username, User) => {
  return User.findOne({ username: username });
};

exports.lengthValidation = (text, min, max) => {
  if (text.length < min || text.length > max) {
    return false;
  }
  return true;
};
