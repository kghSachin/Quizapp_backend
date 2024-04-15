import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folderName, format) => {
  try {
    if (!localFilePath) {
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folderName,
      resource_type: "auto",
      // format: format,
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default uploadOnCloudinary;