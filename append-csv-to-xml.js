const fs = require("fs");
const csv = require("csv-parser");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const INPUT_CSV = "input.csv";       // aapka CSV
const XML_FILE  = "chhahdhala.xml";  // aapka XML

// ---------- 1. XML base (UTF-8) ----------
if (fs.existsSync(XML_FILE)) {
  fs.copyFileSync(XML_FILE, XML_FILE + ".backup.xml");
  // console.log("Backup created:", XML_FILE + ".backup.xml");
} else {
  const baseXml =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<KBDS xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    "<Questions></Questions></KBDS>";

  fs.writeFileSync(XML_FILE, baseXml, "utf8");
  // console.log("Created new XML file:", XML_FILE);
}

// ---------- 2. Read existing XML ----------
const xmlData = fs.readFileSync(XML_FILE, "utf8");

const parser = new XMLParser({ ignoreAttributes: false });
const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  suppressEmptyNode: true
});

let json = parser.parse(xmlData);

if (!json.KBDS) json.KBDS = {};
if (!json.KBDS.Questions) json.KBDS.Questions = {};
if (!json.KBDS.Questions.Question) json.KBDS.Questions.Question = [];
if (!Array.isArray(json.KBDS.Questions.Question)) {
  json.KBDS.Questions.Question = [json.KBDS.Questions.Question];
}

// ---------- 3. Read CSV by index (no header names) ----------
const rows = [];
fs.createReadStream(INPUT_CSV, { encoding: "utf8" })
  .pipe(csv({ mapHeaders: ({ header, index }) => index.toString() }))
  .on("data", (row) => {
    // row["0"], row["1"], row["2"] ... indexes
    // Based on your sheet: [file:1]
    // 0: (optional serial / empty)
    // 1: प्रश्न
    // 2: विकल्प 1
    // 3: विकल्प 2
    // 4: विकल्प 3
    // 5: विकल्प 4
    // 6: Level
    // 7: (empty)
    // 8: FixOption
    rows.push(row);
  })
  .on("end", () => {
    rows.forEach((row) => {
      const qText  = (row["1"] || "").trim();
      const opt1   = (row["2"] || "").trim();
      const opt2   = (row["3"] || "").trim();
      const opt3   = (row["4"] || "").trim();
      const opt4   = (row["5"] || "").trim();
      const level  = (row["6"] || "1").trim();
      const fixRaw = (row["8"] || "").trim();

      if (!qText) return; // skip completely empty row

      const currentCount   = json.KBDS.Questions.Question.length;
      const questionNumber = (currentCount + 1).toString();

      json.KBDS.Questions.Question.push({
        QuestionNumber: questionNumber,
        NewQuestion: qText,
        Option1: opt1,
        Option2: opt2,
        Option3: opt3,
        Option4: opt4,
        Level: level,
        FixOption: (fixRaw === "D=4") ? "1" : "0"
      });
    });

    const newXml = builder.build(json);
    fs.writeFileSync(XML_FILE, newXml, "utf8");
    // console.log("✅ All questions and all four options copied exactly from CSV (by index).");
  })
  .on("error", (err) => {
    console.error("CSV read error:", err);
  });
