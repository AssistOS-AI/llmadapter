import * as s3 from '../handlers/S3.js';
import * as Request from '../utils/request.js'
import {getObject} from "../handlers/S3.js";
const devBucket = process.env.DEV_BUCKET;
const fileTypes = Object.freeze({
    audios: {
        contentType: "audio/mp3",
        extension: "mp3"
    },
    images: {
        contentType: "image/png",
        extension: "png"
    },
    videos: {
        contentType: "video/mp4",
        extension: "mp4"
    }
});

async function getDownloadURL(req, res) {
    try {
        const {type, fileId} = Request.extractQueryParams(req);
        if (!type || !fileId) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Missing required parameters" + `:${type ? "" : " type"}${fileId ? "" : " fileId"}`,
            });
        }
        if (!Object.keys(fileTypes).includes(type)) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Invalid upload type",
            });
        }
        const objectPath = fileId + `.${fileTypes[type].extension}`;
        const downloadURL = await s3.getDownloadURL(devBucket, objectPath);
        Request.sendResponse(res, 200, "application/json", {
            message: "Download URL generated successfully",
            data: downloadURL
        });
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get download URL:" + error.message,
        });
    }
}

async function getUploadURL(req, res) {
    try {
        const {type, fileId} = Request.extractQueryParams(req);
        if (!type || !fileId) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Missing required parameters" + `:${type ? "" : " uploadType"}${fileId ? "" : " fileId"}`,
            });
        }
        if (!Object.keys(fileTypes).includes(type)) {
            return Request.sendResponse(res, 400, "application/json", {
                message: "Invalid upload type",
            });
        }
        const objectPath = fileId + `.${fileTypes[type].extension}`;
        const uploadURL = await s3.getUploadURL(devBucket, objectPath, fileTypes[type].contentType);
        Request.sendResponse(res, 200, "application/json", {
            message: "Upload URL generated successfully",
            data: uploadURL
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get upload URL" + error.message,
        });
    }
}

async function getS3File(req, res, fileExtension) {
    let {fileName} = Request.extractQueryParams(req);
    if (!fileName) {
        return Request.sendResponse(res, 400, "application/json", {
            message: "Missing required parameters" + `:${fileName ? "" : " fileName"}`,
        });
    }
    fileName += `.${fileExtension}`;

    const rangeHeader = req.headers.range;
    const headers = rangeHeader ? {Range: rangeHeader} : {};

    const startRangeRequest= rangeHeader ? rangeHeader.split('=')[1].split('-')[0]:0;

    const S3Response = await s3.getObject(devBucket, fileName, headers);

    const fileSize = S3Response.ContentLength + parseInt(startRangeRequest);

    if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;

        const head = {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': end - start + 1,
            'Content-Type': S3Response.ContentType,
            'cache-control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': 0,
        };
        /*  if (end !== fileSize - 1) {
              head['Transfer-Encoding'] = 'chunked';
          }*/
        res.writeHead(206, head);
        S3Response.Body.pipe(res);
    } else {
        const head = {
            'Accept-Ranges': 'bytes',
            'Content-Length': fileSize,
            'Content-Type': S3Response.ContentType,
        };

        res.writeHead(200, head);
        S3Response.Body.pipe(res);
    }
}

async function getImage(req, res) {
    try {
        return await getS3File(req, res, "png");
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to retrieve image:" + error.message
        });
    }
}

async function getAudio(req, res) {
    try {
        return await getS3File(req, res, "mp3");
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to retrieve Audio:" + error.message,
        });
    }
}

async function getVideo(req, res) {
    try {
        return await getS3File(req, res, "mp4");
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to retrieve Video:" + error.message,
        });
    }
}

async function putImage(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".png";
        const data = req.body;
        await s3.uploadObject(devBucket, fileName, data, "image/png");
        return Request.sendResponse(res, 200, "application/json", {
            message: "Image stored successfully",
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to store image",
        })
    }
}

async function putAudio(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".mp3";
        const data = req.body;
        await s3.uploadObject(devBucket, fileName, data, "audio/mp3");
        return Request.sendResponse(res, 200, "application/json", {
            message: "Audio stored successfully",
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to store Audio",
        })
    }
}

async function putVideo(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".mp4";
        const data = req.body;
        await s3.uploadObject(devBucket, fileName, data, "video/mp4");
        return Request.sendResponse(res, 200, "application/json", {
            message: "Video stored successfully",
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to store Video",
        })
    }
}

async function deleteImage(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        await s3.deleteObject(devBucket, fileName);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Image stored successfully",
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete Image",
        })
    }
}

async function deleteAudio(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        await s3.deleteObject(devBucket, fileName);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Audio stored successfully",
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete Audio"
        })
    }
}

async function deleteVideo(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        await s3.deleteObject(devBucket, fileName);
        return Request.sendResponse(res, 200, "application/json", {
            message: "Video stored successfully"
        })
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete Video"
        })
    }
}

async function headImage(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".png";
        const head = await s3.headObject(devBucket, fileName);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Length",head.ContentLength);
        res.setHeader("Last-Modified", head.LastModified);
        res.setHeader("Accept-Ranges", "bytes");
        res.end();
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get image metadata"
        })
    }
}

async function headAudio(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".mp3";
        const head = await s3.headObject(devBucket, fileName);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Length",head.ContentLength);
        res.setHeader("Last-Modified", head.LastModified);
        res.setHeader("Accept-Ranges", "bytes");
        res.end();
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get audio metadata"
        })
    }
}

async function headVideo(req, res) {
    try {
        let {fileName} = Request.extractQueryParams(req);
        fileName += ".mp4";
        const head = await s3.headObject(devBucket, fileName);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Length",head.ContentLength);
        res.setHeader("Last-Modified", head.LastModified);
        res.setHeader("Accept-Ranges", "bytes");
        res.end();
    } catch (error) {
        return Request.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get video metadata"
        })
    }
}

export {
    getUploadURL,
    getDownloadURL,
    getImage,
    getAudio,
    getVideo,
    putImage,
    putAudio,
    putVideo,
    deleteImage,
    deleteAudio,
    deleteVideo,
    headImage,
    headAudio,
    headVideo,
    devBucket
}
