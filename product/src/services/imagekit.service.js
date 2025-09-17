const ImageKit = require("imagekit");
const {v4: uuidv4} = require("uuid")

// TODO: Add these variables to your .env file
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadImage({buffer, filename, folder = "/products"}) {
  const res=await imagekit.upload({
    file: buffer,
    fileName: uuidv4(),
    folder: folder,
  });
  return {
    url: res.url,
    thumbnailUrl: res.thumbnailUrl||res.url,
    fileId: res.fileId,
  };
}

module.exports = {
  uploadImage,
  imagekit,
};
