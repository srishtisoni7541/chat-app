
var ImageKit = require("imagekit");
const multer = require('multer');
const path = require('path');

// Initialize ImageKit
var imagekit = new ImageKit({
    publicKey: "public_SEHrCXlroLmApFwi+b/SBSAPJbQ=",
    privateKey: "private_nz5xgfXLDRyc2JdbqAyt9oNycM4=",
    urlEndpoint: "https://ik.imagekit.io/g7ym2wrz6/"
});

// Multer storage configuration for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = upload;

// Generate URL for an image
var imageURL = imagekit.url({
  path: "default", // Ensure path is relative from the imagekit root
  transformation: [
    { height: "300", width: "400" },
    { rotation: 90 }
  ],
  transformationPosition: "query" // or "path" based on how ImageKit is set up
});

console.log("Generated Image URL: ", imageURL);
