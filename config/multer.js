
const ImageKit = require("imagekit");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize ImageKit (use environment variables for security)
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "your_public_key_here",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "your_private_key_here",
    urlEndpoint: "https://ik.imagekit.io/g7ym2wrz6/"
});

// Multer storage configuration for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save files in the "uploads" directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Use unique filenames
  },
});

const upload = multer({ storage });

module.exports = upload;

// Function to upload the file to ImageKit
const uploadToImageKit = (filePath, fileName) => {
  const fileBuffer = fs.readFileSync(filePath); // Read file from disk

  return new Promise((resolve, reject) => {
    imagekit.upload({
      file: fileBuffer.toString('base64'), // Convert file to base64
      fileName,                            // Set the original file name
      folder: "profiles",                  // Optional: folder to store image
    }, function(error, result) {
      if (error) {
        return reject(error);
      }
      resolve(result.url); // Return the URL of the uploaded image
    });
  });
};

// Generate a transformed URL (replace "default" with actual file path)
const generateImageURL = (filePath) => {
  return imagekit.url({
    path: filePath, // Dynamically pass the correct image path
    transformation: [
      { height: "300", width: "400" },
      { rotation: 90 }
    ],
    transformationPosition: "query" // Can also use "path"
  });
};

