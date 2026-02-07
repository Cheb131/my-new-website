const bcrypt = require("bcryptjs");

const users = [
  {
    id: 1,
    username: "admin",
    // mật khẩu: 123456
    passwordHash: bcrypt.hashSync("123456", 10),
    role: "admin",
  },
];

module.exports = users;
