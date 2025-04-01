// const mongoose = require('mongoose');
// const fs = require('fs');
// const xml2js = require('xml2js');
// const Question = require('./models/Question'); // Your question model

// // MongoDB connection
// mongoose.connect('mongodb://localhost:27017/kbc', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.error("❌ Connection error:", err));

// // Read and parse XML file
// const parseXML = async (filePath) => {
//     const xmlData = fs.readFileSync(filePath, 'utf-8');
//     const parser = new xml2js.Parser();
//     return await parser.parseStringPromise(xmlData);
// };

// const levels = {
//     0: 0,
//     1: 1000,
//     2: 2000,
//     3: 3000,
//     4: 5000,
//     5: 10000,
//     6: 20000,
//     7: 40000,
//     8: 80000,
//     9: 160000,
//     10: 320000,
//     11: 640000,
//     12: 1250000,
//     13: 2500000,
//     14: 5000000,
//     15: 7000000
// };


// // Main function to merge and save questions
// const mergeAndSaveQuestions = async () => {
//     try {
//         // Parse both English and Hindi XML files
//         const englishData = await parseXML('english.xml');
//         const hindiData = await parseXML('hindi.xml');

//         const englishQuestions = englishData.KBDS.Questions[0].Question;
//         const hindiQuestions = hindiData.KBDS.Questions[0].Question;

//         for (const eng of englishQuestions) {
//             const questionNumber = parseInt(eng.QuestionNumber[0]);
//             const hin = hindiQuestions.find(q => parseInt(q.QuestionNumber[0]) === questionNumber);

//             // Map to Mongoose schema format
//             const questionData = {
//                 question: {
//                     en: eng.NewQuestion[0],
//                     hi: hin ? hin.NewQuestion[0] : ""
//                 },
//                 option1: {
//                     en: eng.Option1[0],
//                     hi: hin ? hin.Option1[0] : ""
//                 },
//                 option2: {
//                     en: eng.Option2[0],
//                     hi: hin ? hin.Option2[0] : ""
//                 },
//                 option3: {
//                     en: eng.Option3[0],
//                     hi: hin ? hin.Option3[0] : ""
//                 },
//                 option4: {
//                     en: eng.Option4[0],
//                     hi: hin ? hin.Option4[0] : ""
//                 },
//                 explanation: {
//                     en: "",
//                     hi: hin?.Explanation ? hin.Explanation[0] : ""
//                 },
//                 answer: 1, // Set the correct answer (modify if required)
//                 slot: levels[parseInt(eng.Level[0])],
//                 level: parseInt(eng.Level[0]),
//                 question_type: "MCQ"
//             };

//             // Upsert (Insert if not exists, Update if exists)
//             await Question.findOneAndUpdate(
//                 { slot: levels[parseInt(eng.Level[0])] }, // Match by question number
//                 questionData,
//                 { upsert: true, new: true }
//             );
//             console.log(`✅ Saved Question #${questionNumber}`);
//         }

//         console.log("🎉 All questions processed successfully!");
//         mongoose.connection.close();
//     } catch (error) {
//         console.error("❌ Error processing questions:", error);
//         mongoose.connection.close();
//     }
// };

// mergeAndSaveQuestions();



const mongoose = require('mongoose');
const fs = require('fs');
const xml2js = require('xml2js');
const Question = require('./models/Question');

// mongoose.connect('mongodb://localhost:27017/kbc', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.error("❌ Connection error:", err));

const parseXML = async (filePath) => {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(xmlData);
};

const levels = {
    0: 0, 1: 1000, 2: 2000, 3: 3000, 4: 5000, 5: 10000, 6: 20000, 7: 40000,
    8: 80000, 9: 160000, 10: 320000, 11: 640000, 12: 1250000, 13: 2500000,
    14: 5000000, 15: 10000000, 16: 70000000
};

// Helper function to shuffle options and track the correct answer
const shuffleOptions = (options, correctIndex) => {
    const shuffled = options.map((option, index) => ({ option, index: index + 1 }));
    shuffled.sort(() => Math.random() - 0.5);

    const newAnswer = shuffled.find(item => item.index === correctIndex);

    return {
        shuffledOptions: shuffled.map(item => item.option),
        newAnswer: shuffled.findIndex(item => item.index === correctIndex) + 1
    };
};

// const mergeAndSaveQuestions = async () => {
//     try {
//         const englishData = await parseXML('english.xml');
//         const hindiData = await parseXML('hindi.xml');

//         const englishQuestions = englishData.KBDS.Questions[0].Question;
//         const hindiQuestions = hindiData.KBDS.Questions[0].Question;

//         for (const eng of englishQuestions) {
//             const questionNumber = parseInt(eng.QuestionNumber[0]);
//             const hin = hindiQuestions.find(q => parseInt(q.QuestionNumber[0]) === questionNumber);

//             const options = [
//                 { en: eng.Option1[0], hi: hin ? hin.Option1[0] : "" },
//                 { en: eng.Option2[0], hi: hin ? hin.Option2[0] : "" },
//                 { en: eng.Option3[0], hi: hin ? hin.Option3[0] : "" },
//                 { en: eng.Option4[0], hi: hin ? hin.Option4[0] : "" }
//             ];

//             const { shuffledOptions, newAnswer } = shuffleOptions(options, 1);

//             const questionData = {
//                 question: {
//                     en: eng.NewQuestion[0],
//                     hi: hin ? hin.NewQuestion[0] : ""
//                 },
//                 option1: shuffledOptions[0],
//                 option2: shuffledOptions[1],
//                 option3: shuffledOptions[2],
//                 option4: shuffledOptions[3],
//                 explanation: {
//                     en: eng.Explanation ? eng.Explanation[0] : "No explanation available.",
//                     hi: hin?.Explanation ? hin.Explanation[0] : "कोई स्पष्टीकरण उपलब्ध नहीं है।"
//                 },
//                 answer: newAnswer,
//                 slot: levels[parseInt(eng.Level[0])],
//                 level: parseInt(eng.Level[0]),
//                 question_type: "Basic",
//                 user_id: ""
//             };

//             // Insert new question without updating existing ones
//             await Question.create(questionData);

//             console.log(`✅ Saved Question #${questionNumber}`);
//         }

//         console.log("🎉 All questions processed successfully!");
//         mongoose.connection.close();
//     } catch (error) {
//         console.error("❌ Error processing questions:", error);
//         mongoose.connection.close();
//     }
// };

// mergeAndSaveQuestions();



// const savechhahdhalaQuestions = async () => {
//     try {
//         const hindiData = await parseXML('chhahdhala.xml');

//         const hindiQuestions = hindiData.KBDS.Questions[0].Question;

//         for (const hin of hindiQuestions) {
//             // console.log(hin);
//             const options = [
//                 { hi: hin.Option1[0] , en: "N/A" },
//                 { hi: hin.Option2[0] , en: "N/A" },
//                 { hi: hin.Option3[0] , en: "N/A" },
//                 { hi: hin.Option4[0] , en: "N/A" }
//             ];

//             const { shuffledOptions, newAnswer } = shuffleOptions(options, 1);

//             const questionData = {
//                 question: {
//                     en: "N/A", 
//                     hi: hin.NewQuestion[0]
//                 },
//                 option1: shuffledOptions[0],
//                 option2: shuffledOptions[1],
//                 option3: shuffledOptions[2],
//                 option4: shuffledOptions[3],
//                 explanation: {
//                     en: "No explanation available.",
//                     hi: hin.Explanation ? hin.Explanation[0] : "कोई स्पष्टीकरण उपलब्ध नहीं है।"
//                 },
//                 answer: newAnswer,
//                 slot: levels[parseInt(hin.Level[0])],
//                 level: parseInt(hin.Level[0]),
//                 question_type: "Chhahdhala",
//                 user_id: ""
//             };

//             // Insert new question without updating existing ones
//             await Question.create(questionData);

//             console.log(`✅ Saved Hindi Question #${hin.QuestionNumber[0]}`);
//         }

//         console.log("🎉 All Hindi questions processed successfully!");
//         mongoose.connection.close();
//     } catch (error) {
//         console.error("❌ Error processing Hindi questions:", error);
//         mongoose.connection.close();
//     }
// };

// savechhahdhalaQuestions();








// for mysql database connectivity 

const saveChhahdhalaQuestions = async () => {
    try {
        const hindiData = await parseXML('chhahdhala.xml');
        const hindiQuestions = hindiData.KBDS.Questions[0].Question;

        for (const hin of hindiQuestions) {
            // Prepare options and shuffle them
            const options = [
                { en: "N/A", hi: hin.Option1[0] },
                { en: "N/A", hi: hin.Option2[0] },
                { en: "N/A", hi: hin.Option3[0] },
                { en: "N/A", hi: hin.Option4[0] }
            ];

            const { shuffledOptions, newAnswer } = shuffleOptions(options, 1);

            // Prepare JSON data for each field
            const questionData = {
                question: JSON.stringify({
                    en: "N/A",
                    hi: hin.NewQuestion[0]
                }),
                option1: JSON.stringify(shuffledOptions[0]),
                option2: JSON.stringify(shuffledOptions[1]),
                option3: JSON.stringify(shuffledOptions[2]),
                option4: JSON.stringify(shuffledOptions[3]),
                explanation: JSON.stringify({
                    en: "No explanation available.",
                    hi: hin.Explanation ? hin.Explanation[0] : "कोई स्पष्टीकरण उपलब्ध नहीं है।"
                }),
                answer: newAnswer,
                slot: levels[parseInt(hin.Level[0])],
                level: parseInt(hin.Level[0]),
                question_type: "Chhahdhala",
                user_id: ""
            };

            // MySQL INSERT query
            const query = `
                INSERT INTO questions (
                    question, option1, option2, option3, option4, explanation, answer, slot, level, question_type, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                questionData.question,
                questionData.option1,
                questionData.option2,
                questionData.option3,
                questionData.option4,
                questionData.explanation,
                questionData.answer,
                questionData.slot,
                questionData.level,
                questionData.question_type,
                questionData.user_id
            ];

            await Question.createQuestion({
                question: JSON.stringify({
                    en: "N/A",
                    hi: hin.NewQuestion[0]
                }),
                option1: JSON.stringify(shuffledOptions[0]),
                option2: JSON.stringify(shuffledOptions[1]),
                option3: JSON.stringify(shuffledOptions[2]),
                option4: JSON.stringify(shuffledOptions[3]),
                explanation: JSON.stringify({
                    en: "No explanation available.",
                    hi: hin.Explanation ? hin.Explanation[0] : "कोई स्पष्टीकरण उपलब्ध नहीं है।"
                }),
                answer: newAnswer,
                slot: levels[parseInt(hin.Level[0])],
                level: parseInt(hin.Level[0]),
                question_type: "Chhahdhala",
                user_id: ""
            });
            console.log(`✅ Saved Hindi Question: ${hin.QuestionNumber[0]}`);
        }

        console.log("🎉 All Hindi questions processed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error processing Hindi questions:", error);
        process.exit(1);
    }
};

// Run the function
// saveChhahdhalaQuestions();


const mergeAndSaveQuestions = async () => {
    try {
        const englishData = await parseXML('english.xml');
        const hindiData = await parseXML('hindi.xml');

        const englishQuestions = englishData.KBDS.Questions[0].Question;
        const hindiQuestions = hindiData.KBDS.Questions[0].Question;

        for (const eng of englishQuestions) {
            const questionNumber = parseInt(eng.QuestionNumber[0]);
            const hin = hindiQuestions.find(q => parseInt(q.QuestionNumber[0]) === questionNumber);

            const options = [
                { en: eng.Option1[0], hi: hin ? hin.Option1[0] : "" },
                { en: eng.Option2[0], hi: hin ? hin.Option2[0] : "" },
                { en: eng.Option3[0], hi: hin ? hin.Option3[0] : "" },
                { en: eng.Option4[0], hi: hin ? hin.Option4[0] : "" }
            ];

            const { shuffledOptions, newAnswer } = shuffleOptions(options, 1);

            const questionData = {
                question: JSON.stringify({
                    en: eng.NewQuestion[0],
                    hi: hin ? hin.NewQuestion[0] : ""
                }),
                option1: JSON.stringify(shuffledOptions[0]),
                option2: JSON.stringify(shuffledOptions[1]),
                option3: JSON.stringify(shuffledOptions[2]),
                option4: JSON.stringify(shuffledOptions[3]),
                explanation: JSON.stringify({
                    en: eng.Explanation ? eng.Explanation[0] : "No explanation available.",
                    hi: hin?.Explanation ? hin.Explanation[0] : "कोई स्पष्टीकरण उपलब्ध नहीं है।"
                }),
                answer: newAnswer,
                slot: levels[parseInt(eng.Level[0])],
                level: parseInt(eng.Level[0]),
                question_type: "Basic",
                user_id: ""
            };

            // Insert into MySQL
            const query = `
                INSERT INTO questions (question, option1, option2, option3, option4, explanation, answer, slot, level, question_type, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await Question.createQuestion(
                {
                    question: JSON.stringify({
                        en: eng.NewQuestion[0],
                        hi: hin ? hin.NewQuestion[0] : ""
                    }),
                    option1: JSON.stringify(shuffledOptions[0]),
                    option2: JSON.stringify(shuffledOptions[1]),
                    option3: JSON.stringify(shuffledOptions[2]),
                    option4: JSON.stringify(shuffledOptions[3]),
                    explanation: JSON.stringify({
                        en: eng.Explanation ? eng.Explanation[0] : "No explanation available.",
                        hi: hin?.Explanation ? hin.Explanation[0] : "कोई स्पष्टीकरण उपलब्ध नहीं है।"
                    }),
                    answer: newAnswer,
                    slot: levels[parseInt(eng.Level[0])],
                    level: parseInt(eng.Level[0]),
                    question_type: "Basic",
                    user_id: ""
                }
            );

            console.log(`✅ Saved Question #${questionNumber}`);
        }

        console.log("🎉 All questions processed successfully!");
    } catch (error) {
        console.error("❌ Error processing questions:", error);
    } finally {
        process.exit(0); // Ensure MySQL connection closes
    }
};

// Run the function
// mergeAndSaveQuestions();