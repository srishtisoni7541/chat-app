
const ImageKit = require("imagekit");
const fs = require('fs');

// Initialize ImageKit (use environment variables for security)
exports.imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "your_public_key_here",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "your_private_key_here",
    urlEndpoint: "https://ik.imagekit.io/g7ym2wrz6/"
});
