
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, // Use the new URL parser
    useUnifiedTopology: true, // Use the new Server Discovery and Monitoring engine
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
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
          unique: true
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
