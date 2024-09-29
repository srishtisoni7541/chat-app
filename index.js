
require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const upload = require('./config/multer'); // Assuming you have multer config here
const server = http.createServer(app);
const io = socketIO(server);
const usermodel = require('./models/usermodel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ImageKit = require("imagekit");
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const fs = require('fs');

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,  // Fetch from .env file
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,  // Fetch from .env file
  urlEndpoint: "https://ik.imagekit.io/your_imagekit_id/"  // Replace with your ImageKit URL endpoint
});

// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the "public" directory

// Setup session store and cookies
app.use(expressSession({
  secret: process.env.JWT_SECRET, // Use secret from .env file
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),  // Use your MongoDB URI from .env
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
  }
}));
app.use(cookieParser());

// Setup view engine
app.set('view engine', 'ejs');

// Serve login page
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('chat');
});

// Handle login
app.post('/login', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, async function(err, hash) {
        let loginUser = await usermodel.create({
          name,
          email,
          password: hash,
        });
        let token = jwt.sign({ password, email }, process.env.JWT_SECRET);
        res.cookie('token', token);
        res.render('chat');
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
    res.redirect('/');
  });
});

// Handle profile setup and upload profile picture using ImageKit
app.post('/setprofile', upload.single('dp'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ success: false, message: 'No file uploaded' });
  }

  // Upload the file to ImageKit
  imagekit.upload({
    file: fs.readFileSync(req.file.path),  // Read file from disk
    fileName: req.file.filename,           // Use original file name
    folder: "/profiles",                   // Optional: folder name in ImageKit
  }, function(error, result) {
    if (error) {
      return res.status(500).send({ success: false, message: 'Image upload failed', error });
    } else {
      const imageUrl = result.url; // Get URL of the uploaded image from ImageKit
      const name = req.body.name;

      // Return success response with user name and profile image URL
      res.send({ success: true, name, image: imageUrl });
    }
  });
});

// Socket.io connection setup
const userids = [];
const usernames = [];
const userProfiles = {};

io.on('connection', function (socket) {
  // Message received
  socket.on('message', function (message) {
    let index = userids.indexOf(socket.id);
    let name = usernames[index];
    let time = new Date().toISOString();
    let dp = userProfiles[socket.id];
    io.emit('message', { message, name, id: socket.id, time, dp });
  });

  // User name and profile setup
  socket.on('nameset', function (data) {
    if (!userids.includes(socket.id)) {
      userids.push(socket.id);
      usernames.push(data.name);
      userProfiles[socket.id] = data.image; // Save profile picture URL
    }

    io.emit('numberofusers', usernames.length);
    socket.emit('namesetdone');
  });

  // Typing notification
  socket.on('typing', function () {
    let index = userids.indexOf(socket.id);
    let name = usernames[index];
    socket.broadcast.emit('typing', name);
  });

  // Handle user disconnect
  socket.on('disconnect', function () {
    let index = userids.indexOf(socket.id);
    if (index !== -1) {
      userids.splice(index, 1);
      usernames.splice(index, 1);
      delete userProfiles[socket.id];
      io.emit('numberofusers', usernames.length);
    }
  });
});

// Start server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
