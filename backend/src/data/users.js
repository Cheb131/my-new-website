const bcrypt = require("bcryptjs");

module.exports = [
  {
    id: 1,
    username: "admin",
    passwordHash: bcrypt.hashSync("123456", 10),
    role: "admin",
  },
  {
    id: 2,
    username: "manager",
    passwordHash: bcrypt.hashSync("123456", 10),
    role: "manager",
  },
  {
    id: 3,
    username: "user",
    passwordHash: bcrypt.hashSync("123456", 10),
    role: "user",
  },
];
