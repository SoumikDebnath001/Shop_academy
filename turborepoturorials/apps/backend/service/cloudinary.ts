import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

/* =========================
   CLOUDINARY CONFIG
========================= */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a single file buffer to Cloudinary.
 * Works with multer memoryStorage (req.file.buffer).
 *
 * @param req  - Express request (must have req.file)
 * @param folder - Cloudinary folder name (e.g. "products", "categories")
 */
async function doUpload(req: any, folder: string | null = null): Promise<any> {
    return new Promise((resolve) => {
        const options: any = {
            resource_type: "auto",
        };
        if (folder) {
            options.folder = "mamistore/" + folder;
        }

        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.log("Cloudinary Upload Error: ", error);
                    return resolve({ status: false, error });
                }
                console.log("Successfully uploaded to Cloudinary:", result.secure_url);
                return resolve({
                    status: true,
                    originalname: req.file.originalname,
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
}

/**
 * Upload multiple file buffers to Cloudinary.
 * Works with multer memoryStorage (req.files array).
 *
 * @param req  - Express request (must have req.files)
 * @param folder - Cloudinary folder name
 */
async function doUploadMultiple(req: any, folder: string | null = null): Promise<any[]> {
    const uploadPromises = req.files.map((file: any) => {
        return new Promise((resolve) => {
            const options: any = {
                resource_type: "auto",
            };
            if (folder) {
                options.folder = "mamistore/" + folder;
            }

            const stream = cloudinary.uploader.upload_stream(
                options,
                (error, result) => {
                    if (error) {
                        console.log("Cloudinary Upload Error: ", error);
                        return resolve({ status: false, error });
                    }
                    return resolve({
                        status: true,
                        originalname: file.originalname,
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            );

            streamifier.createReadStream(file.buffer).pipe(stream);
        });
    });

    return Promise.all(uploadPromises);
}

/**
 * Delete a file from Cloudinary by public_id.
 *
 * @param publicId - Cloudinary public_id
 */
async function doDelete(publicId: string): Promise<any> {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary Delete:", result);
        return { status: result.result === "ok" };
    } catch (error) {
        console.log("Cloudinary Delete Error: ", error);
        return { status: false, error };
    }
}

export {
    doUpload,
    doUploadMultiple,
    doDelete,
    cloudinary,
};
