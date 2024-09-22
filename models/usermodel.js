
const mongoose = require('mongoose');

// Connecting to the MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/letschat', {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Defining the user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure unique email
    },
    password: {
        type: String,
        required: true
    }
});

// Creating the User model
const User = mongoose.model('User', userSchema);

// Exporting the model for use in other files
module.exports = User;
