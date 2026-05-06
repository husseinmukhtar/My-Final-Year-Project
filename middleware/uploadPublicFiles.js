const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'public');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeExt = ext && ext.length <= 8 ? ext : '';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
});

const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const docMime = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const docExt = new Set(['.pdf', '.doc', '.docx']);

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (file.fieldname === 'item_photo') {
        if (imageMime.has(file.mimetype)) return cb(null, true);
        return cb(new Error('Item photo must be JPG, PNG, WEBP, or GIF.'));
    }
    if (file.fieldname === 'attachment' || file.fieldname === 'supporting_document') {
        if (imageMime.has(file.mimetype) || docMime.has(file.mimetype) || docExt.has(ext)) return cb(null, true);
        return cb(new Error('Attachments must be an image, PDF, or Word document.'));
    }
    return cb(null, true);
}

function webUploadPath(file) {
    if (!file) return null;
    return `/uploads/public/${path.basename(file.path)}`;
}

function wrapUpload(upload) {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) req.fileUploadError = err.message || 'File upload failed.';
            next();
        });
    };
}

const uploadReportAttachment = wrapUpload(multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter
}).single('attachment'));

const uploadAdmissionDocument = wrapUpload(multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter
}).single('supporting_document'));

const uploadDonationItemPhoto = wrapUpload(multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter
}).single('item_photo'));

module.exports = {
    uploadDir,
    webUploadPath,
    uploadReportAttachment,
    uploadAdmissionDocument,
    uploadDonationItemPhoto
};
