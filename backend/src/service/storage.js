const imagekit = require("@imagekit/nodejs");
require("dotenv").config();

const image = new imagekit({
    privateKey: process.env.PRIVATE_KEY,
});

async function uploadbuffer(buffer, mimetype = "image/jpeg") {
    const isVideo = mimetype.startsWith("video/");
    const fileName = isVideo ? "video.mp4" : "image.jpg";

    const result = await image.files.upload({
        file: buffer.toString("base64"),
        fileName: fileName,
    });

    return result;
}

module.exports = uploadbuffer;