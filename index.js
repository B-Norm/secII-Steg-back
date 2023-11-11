require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const app = express();
const mongoose = require("mongoose");
const UserModel = require("./models/users.js");
const FileModel = require("./models/files.js");
const API_KEY = process.env.API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3001;
const jwt = require("jsonwebtoken");

mongoose.connect(MONGO_URI);

const db = mongoose.connection;

// app stuff
app.use(express.json({ limit: "50mb" }));
app.use(helmet());

const cors = require("cors");
app.use(cors());

// CHECK IF USING API_KEY
const authAPI = (API_KEY) => {
  return (req, res, next) => {
    const token = req.headers["x-my-api-key"] || req.headers["api_key"];
    if (!token) {
      return res.status(403).json({
        status: 403,
        message: "Missing Authorization header",
        SERVER_API: API_KEY,
        HEADERS: req.headers,
      });
    } else {
      if (API_KEY != token) {
        return res.status(401).json({
          status: 511,
          message: "Invalid API Key",
        });
      } else {
        next();
      }
    }
  };
};

// REGISTER USERS
app.post("/api/register", authAPI(API_KEY), async (req, res) => {
  if (!validateParams(req.body, ["username", "password"])) {
    console.log("/api/register: wrong input");
    return res.status(400);
  }

  var new_user = new UserModel({
    username: req.body.username,
  });
  new_user.password = new_user.generateHash(req.body.password);

  // if username is unique create new
  // user, else send 401 error
  await new_user
    .save()
    .then(() => {
      return res.json({
        msg: "User Created",
        status: 200,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(401).json({
        msg: "username taken",
        status: 401,
      });
    });
});

// find username and compare entered password with hash
app.post("/api/login", authAPI(API_KEY), async (req, res) => {
  if (!validateParams(req.body, ["username", "password"])) {
    console.log("/api/login: wrong input");

    return res.status(400);
  }

  db.on("error", (err) => {
    res
      .status(469)
      .res.json({ message: `Failed to connect to MongoDB Atlas: ${err}` });
  });

  db.once("open", () => {
    console.log("Connected to MongoDB Atlas");
  });

  UserModel.findOne({ username: req.body.username }).then((user) => {
    if (user == null) {
      res.status(401).json({
        msg: "username or password is incorrect",
        status: 401,
      });
    } else if (!user.validPassword(req.body.password, user.password)) {
      res.status(401).json({
        msg: "username or password is incorrect",
        status: 401,
      });
    } else {
      // password is correct
      const token = jwt.sign({ username: req.body.username }, PRIVATE_KEY, {
        expiresIn: "1hr",
      });
      return res.json({
        status: 200,
        token: token,
      });
    }
  });
});

// add steg image to db
app.post("/api/upload", authToken, async (req, res) => {
  if (!validateParams(req.body, ["stegName", "file", "mName", "mSize"])) {
    console.log("/api/upload: wrong input");
    return res.status(400);
  }
  var new_file = new FileModel({
    stegName: req.body.stegName,
    file: req.body.file,
    mName: req.body.mName,
    mSize: req.body.mSize,
  });

  await new_file
    .save()
    .then(() => {
      return res.status(200).json({
        msg: "file added",
        status: 200,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(401).json({
        msg: "File Error",
        status: 400,
        error: err,
      });
    });
});

// get all files from DB
app.get("/api/getFiles", authAPI(API_KEY), async (req, res) => {
  try {
    console.log("Loading Files to Client");
    const files = await FileModel.find();
    res.status(200).json(files);
  } catch (err) {
    console.log("Error sending files to client");
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/deleteFile", authToken, async (req, res) => {
  if (!validateParams(req.body, ["_id"])) {
    console.log("/api/deleteFile: wrong input");
    return res.status(400);
  }
  FileModel.deleteOne({ _id: req.body._id })
    .then(() => {
      return res.json({
        msg: "File Deleted",
        status: 200,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: err.message });
    });
});

const validateParams = (body, params) => {
  let res = true;
  for (let i = 0; i < params.length; i++) {
    if (!body.hasOwnProperty(params[i])) {
      res = false;
      break;
    }
  }
  return res;
};

function authToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    console.log("Token failed");
    return res.sendStatus(401);
  }
  jwt.verify(token, PRIVATE_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.listen(PORT, () => {
  console.log("Server Running at: " + PORT);
});
