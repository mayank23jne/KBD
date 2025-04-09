const express = require('express');
const router = express.Router();
const multer = require('multer');
const xml2js = require('xml2js');
const { SaveChhahdhalaQuestions, SaveBasicQuestions } = require('../services/saveQuestions');

const upload = multer();

const iconv = require('iconv-lite');

const parseXMLBuffer = async (buffer) => {
    // Try to decode buffer as UTF-16LE or fallback to UTF-8
    let xmlText;
    try {
        // Check BOM (Byte Order Mark) for UTF-16LE
        const isUTF16 = buffer[0] === 0xFF && buffer[1] === 0xFE;

        xmlText = isUTF16
            ? iconv.decode(buffer, 'utf16-le')   // decode as UTF-16LE
            : buffer.toString('utf8');           // fallback to UTF-8
    } catch (err) {
        throw new Error('Unsupported encoding in XML file.');
    }

    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(xmlText);
};


// Basic questions route
router.post('/upload/basic', upload.fields([
  { name: 'hindiFile', maxCount: 1 },
  { name: 'englishFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const hindiBuffer = req.files.hindiFile[0].buffer;
    const englishBuffer = req.files.englishFile[0].buffer;
    console.log(hindiBuffer,englishBuffer);

    const hindiData = await parseXMLBuffer(hindiBuffer);
    const englishData = await parseXMLBuffer(englishBuffer);

    await SaveBasicQuestions(hindiData, englishData);

    res.status(200).json({ message: "✅ Basic questions saved successfully!" });
  } catch (error) {
    console.error('❌ Error uploading basic:', error);
    res.status(500).json({ error: 'Failed to save Basic questions' });
  }
});

// Chhahdhala questions route
router.post('/upload/chhahdhala', upload.single('hindiFile'), async (req, res) => {
  try {
    const hindiBuffer = req.file.buffer;
    const hindiData = await parseXMLBuffer(hindiBuffer);

    await SaveChhahdhalaQuestions(hindiData);

    res.json({ message: '✅ Chhahdhala questions saved successfully!' });
  } catch (error) {
    console.error('❌ Error uploading Chhahdhala:', error);
    res.status(500).json({ error: 'Failed to save Chhahdhala questions' });
  }
});

module.exports = router;
