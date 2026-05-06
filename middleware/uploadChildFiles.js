const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'children');
const reportUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'reports');
const donationUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'donations');

for (const dir of [uploadDir, reportUploadDir, donationUploadDir]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function makeStorage(destinationDir) {
    return multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, destinationDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeExt = ext && ext.length <= 6 ? ext : '';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
    });
}

const storage = makeStorage(uploadDir);

const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const docMime = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const docExt = new Set(['.pdf', '.doc', '.docx']);

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (file.fieldname === 'passport_photo') {
        if (imageMime.has(file.mimetype)) return cb(null, true);
        return cb(new Error('Passport photo must be JPG, PNG, WEBP, or GIF.'));
    }
    if (file.fieldname === 'supporting_document') {
        if (docMime.has(file.mimetype) || docExt.has(ext)) return cb(null, true);
        return cb(new Error('Supporting document must be PDF or Word (.doc / .docx).'));
    }
    if (file.fieldname === 'child_photo' || file.fieldname === 'item_photo') {
        if (imageMime.has(file.mimetype)) return cb(null, true);
        return cb(new Error('Photo must be JPG, PNG, WEBP, or GIF.'));
    }
    if (file.fieldname === 'supporting_doc') {
        if (imageMime.has(file.mimetype) || file.mimetype === 'application/pdf' || ext === '.pdf') return cb(null, true);
        return cb(new Error('Supporting document must be a PDF or image file.'));
    }
    return cb(null, true);
}

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter
}).fields([
    { name: 'passport_photo', maxCount: 1 },
    { name: 'supporting_document', maxCount: 1 }
]);

const reportUpload = multer({
    storage: makeStorage(reportUploadDir),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
}).single('child_photo');

const admissionUpload = multer({
    storage: makeStorage(reportUploadDir),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
}).single('supporting_doc');

const donationUpload = multer({
    storage: makeStorage(donationUploadDir),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
}).single('item_photo');

function wrapUpload(uploadHandler) {
    return (req, res, next) => {
        uploadHandler(req, res, (err) => {
            if (err) req.fileUploadError = err.message || 'File upload failed.';
            next();
        });
    };
}

function uploadChildFiles(req, res, next) {
    upload(req, res, (err) => {
        if (err) req.fileUploadError = err.message || 'File upload failed.';
        next();
    });
}

module.exports = {
    uploadChildFiles,
    uploadReportedChildPhoto: wrapUpload(reportUpload),
    uploadAdmissionSupportingDoc: wrapUpload(admissionUpload),
    uploadDonationItemPhoto: wrapUpload(donationUpload),
    uploadDir,
    reportUploadDir,
    donationUploadDir
};
