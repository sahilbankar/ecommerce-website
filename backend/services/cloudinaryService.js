const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

/**
 * Upload a single file buffer to Cloudinary
 * @param {Buffer} buffer       - File buffer from multer memoryStorage
 * @param {string} folder       - Cloudinary destination folder
 * @param {Object} [options]    - Additional Cloudinary upload options
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'ecommerce', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Upload multiple file buffers to Cloudinary in parallel
 * @param {Array<{buffer: Buffer, originalname: string}>} files
 * @param {string} folder
 * @returns {Promise<Array<{url: string, public_id: string}>>}
 */
const uploadMultipleToCloudinary = async (files, folder = 'ecommerce/products') => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} public_id - Cloudinary public ID of the image
 * @returns {Promise<Object>} Cloudinary destruction result
 */
const deleteFromCloudinary = async (public_id) => {
  if (!public_id || public_id.trim() === '') {
    return { result: 'skipped - no public_id' };
  }
  const result = await cloudinary.uploader.destroy(public_id);
  return result;
};

/**
 * Delete multiple images from Cloudinary in parallel
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>}
 */
const deleteMultipleFromCloudinary = async (publicIds = []) => {
  const validIds = publicIds.filter((id) => id && id.trim() !== '');
  if (validIds.length === 0) return [];
  const deletePromises = validIds.map((id) => deleteFromCloudinary(id));
  return Promise.all(deletePromises);
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary
};
