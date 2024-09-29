require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const usermodel = require('./models/usermodel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { imagekit } = require('./config/multer');
const { log } = require('console');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);



// Multer configuration
const upload = multer({ dest: 'uploads/' });

// Set views directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(expressSession({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Routes
app.get('/', (req, res) => res.render('login'));
app.get('/login', (req, res) => res.render('chat'));

app.post('/login', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // const existingUser = await usermodel.findOne({ email });
        // if (existingUser) {
        //     return res.status(400).json({ message: "Email already exists" });
        // }
        // const salt = await bcrypt.genSalt(10);
        // const hash = await bcrypt.hash(password, salt);
        // const loginUser = await usermodel.create({ name, email, password: hash });
        // const token = jwt.sign({ password, email }, process.env.JWT_SECRET);
        // res.cookie('token', token);
        res.render('chat');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

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

app.post('/setprofile',upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ success: false, message: 'No file uploaded' });
    }
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    imagekit.upload({
        file: fileBuffer.toString('base64'),
        fileName: req.file.originalname,
    }, (error, result) => {
        if (error) {
            console.error('Image upload failed:', error);
            return res.status(500).send({ success: false, message: 'Image upload failed', error });
        }
        const imageUrl = result.url;
        const name = req.body.name;
        res.send({ success: true, name, image: imageUrl });
    });
});

// Socket.io setup
const userids = [];
const usernames = [];
const userProfiles = {};

io.on('connection', (socket) => {
    socket.on('message', (message) => {
        const index = userids.indexOf(socket.id);
        const name = usernames[index];
        const time = new Date().toISOString();
        const dp = userProfiles[socket.id];
        io.emit('message', { message, name, id: socket.id, time, dp });
    });

    socket.on('nameset', (data) => {
        if (!userids.includes(socket.id)) {
            userids.push(socket.id);
            usernames.push(data.name);
            userProfiles[socket.id] = data.image;
        }
        io.emit('numberofusers', usernames.length);
        socket.emit('namesetdone');
    });

    socket.on('typing', () => {
        const index = userids.indexOf(socket.id);
        const name = usernames[index];
        socket.broadcast.emit('typing', name);
    });

    socket.on('disconnect', () => {
        const index = userids.indexOf(socket.id);
        if (index !== -1) {
            userids.splice(index, 1);
            usernames.splice(index, 1);
            delete userProfiles[socket.id];
            io.emit('numberofusers', usernames.length);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
