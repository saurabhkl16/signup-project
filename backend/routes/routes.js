const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = Router();

router.post("/", async (req, res) => {
  console.log("/");
  res.send("Running");
});

router.post("/signup", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let name = req.body.name;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const record = await User.findOne({ email: email });
  if (record) {
    return res.status(400).send({
      message: "Email Allredy registred",
    });
  }

  const user = new User({
    name: name,
    email: email,
    password: hashedPassword,
  });
  const result = await user.save();

  //JWT token
  const { _id } = await result.toJSON();
  const token = jwt.sign({ _id: _id }, "secret");
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.send({
    message: "Success",
  });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).send({
      message: "user not found",
    });
  }
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).send({
      message: "password is incorrect",
    });
  }
  console.log(user._id)
  const token = jwt.sign({ _id: user._id }, "secret");
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 100,
  });
  res.send({ message: "User Login Succesfully" });
});

router.post("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.send({ message: "User Logout Succesfully" });
});

router.get("/user", async (req, res) => {
  try {
    const cookie = req.cookies["jwt"];
    const claims = jwt.verify(cookie, "secret");
    if (!claims) {
      return res.status(401).send({
        message: "unauthenticate",
      });
    }
    const user = await User.findOne({ _id: claims._id });
    console.log(user, "user");
    const { password, ...data } = await user.toJSON();
    res.send(data);
  } catch (err) {
    return res.status(401).send({
      message: "unauthenticate",
    });
  }
});

module.exports = router;
