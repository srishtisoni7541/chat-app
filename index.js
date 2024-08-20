
require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const upload = require('./config/multer');
const server = http.createServer(app);
const io = socketIO(server);
const usermodel = require('./models/usermodel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const connectflash = require('connect-flash');
const expressSession = require('express-session');

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the "public" directory
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Setup view engine
app.set('view engine', 'ejs');
app.use(expressSession({
  secret: process.env.JWT_SECRET, // Use secret from .env file
  resave: false, // Forces the session to be saved back to the session store, even if the session was never modified during the request.
  saveUninitialized: true, // Forces a session that is "uninitialized" to be saved to the store.
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
  }
}));
app.use(cookieParser())

// Serve login page
app.get('/', function (req, res) {
  res.render('login');
});

// Handle login
app.post('/login', async function (req, res) {
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

app.get('/logout',function(req,res){
  res.clearCookie('token');
  req.session.destroy(function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
    // Redirect to the login page or a confirmation page
    res.redirect('/');
  });
})
// Handle profile setup
app.post('/setprofile', upload.single('dp'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ success: false, message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const name = req.body.name;

  res.send({ success: true, name, image: imageUrl });
});

// Socket.io connection
const userids = [];
const usernames = [];
const userProfiles = {};

io.on('connection', function (socket) {
  socket.on('message', function (message) {
    let index = userids.indexOf(socket.id);
    let name = usernames[index];
    let time = new Date().toISOString();
    let dp = userProfiles[socket.id];
    io.emit('message', { message, name, id: socket.id, time, dp });
  });

  socket.on('nameset', function (data) {
    if (!userids.includes(socket.id)) {
      userids.push(socket.id);
      usernames.push(data.name);
      userProfiles[socket.id] = data.image; // Save the profile picture URL
    }

    io.emit('numberofusers', usernames.length);
    socket.emit('namesetdone');
  });

  socket.on('typing', function () {
    let index = userids.indexOf(socket.id);
    let name = usernames[index];
    socket.broadcast.emit('typing', name);
  });

  socket.on('disconnect', function () {
    console.log('disconnect');
    let index = userids.indexOf(socket.id);
    if (index !== -1) {
      userids.splice(index, 1);
      usernames.splice(index, 1);
      delete userProfiles[socket.id];
      io.emit('numberofusers', usernames.length);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
