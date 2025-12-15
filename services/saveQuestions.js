
const fs = require('fs');
const xml2js = require('xml2js');
const Question = require('../models/Question');


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




// for mysql database connectivity 

// const SaveChhahdhalaQuestions = async () => {
exports.SaveChhahdhalaQuestions = async (hindiData) => {
    try {
        // const hindiData = await parseXML('chhahdhala.xml');
        console.log("hi hello")

        const hindiQuestions = hindiData.KBDS.Questions[0].Question;

        for (const hin of hindiQuestions) {

            const questionTextHi = hin.NewQuestion[0];
            const questionType = "Chhahdhala";

    
            const isDuplicate = await Question.CheckDuplicateQuestion(questionTextHi, questionType);


            if (isDuplicate) {
                console.log(`⚠️ Skipped duplicate question: ${questionTextHi}`);
                continue;
            }

            // Prepare options and shuffle them
            const options = [
                { en: "N/A", hi: hin.Option1[0] },
                { en: "N/A", hi: hin.Option2[0] },
                { en: "N/A", hi: hin.Option3[0] },
                { en: "N/A", hi: hin.Option4[0] },
            ];
             
            let FixOptionRaw = null;

            if (Array.isArray(hin?.FixOption)) {
                FixOptionRaw = hin.FixOption[0];
            } else if (typeof hin?.FixOption === 'string') {
                FixOptionRaw = hin.FixOption;
            }


            const FixOption = FixOptionRaw === '1' ? 1 : null;

            console.log('FixOptionRaw:', FixOptionRaw, '=> FixOption:', FixOption);

            const correctIndex = FixOption ?? 1;


            const { shuffledOptions, newAnswer } = shuffleOptions(options, correctIndex);

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
                FixOption: JSON.stringify(FixOption),
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
                    question, option1, option2, option3, option4,FixOption, explanation, answer, slot, level, question_type, user_id
                ) VALUES (?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?)
            `;

            const values = [
                questionData.question,
                questionData.option1,
                questionData.option2,
                questionData.option3,
                questionData.option4,
                questionData.FixOption,
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
                FixOption: FixOption,
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
    } catch (error) {
        console.error("❌ Error processing Hindi questions:", error);
    }
};

// Run the function
// SaveChhahdhalaQuestions();


// const SaveBasicQuestions = async () => {
exports.SaveBasicQuestions = async (hindiData, englishData) => {
    try {
        const englishData = await parseXML('english.xml');
        const hindiData = await parseXML('hindi.xml');
        const englishQuestions = englishData.KBDS.Questions[0].Question;
        const hindiQuestions = hindiData.KBDS.Questions[0].Question;

        for (const eng of englishQuestions) {
            const questionNumber = parseInt(eng.QuestionNumber[0]);
            const hin = hindiQuestions.find(q => parseInt(q.QuestionNumber[0]) === questionNumber);
            
            const questionTextHi = hin ? hin.NewQuestion[0] : "";
            const questionTextEn = eng.NewQuestion[0];
            const questionType = "Basic";
            
            const isDuplicate = await Question.CheckDuplicateQuestion(questionTextHi, questionType);

            if (isDuplicate) {
            console.log(`⚠️ Skipped duplicate Basic question: ${questionTextEn}`);
            continue;
            }

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
    } 
};

// Run the function
// SaveBasicQuestions();