



// for mysql database 


const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// router.get('/questions', async (req, res) => {
//     try {
//         const questions = await Question.find();
//         Question.res.json(questions);
//     } catch (err) {
//         res.json({ message: err });
//     }
// });


// GET question by slot with optional language and question_type filters
// Get a random question
router.get('/question/:slot', async (req, res) => {
    try {
        const { slot } = req.params;
        const { questionId, is_correct, question_type } = req.query;

        // Get user_id from session
        const user_id = req.session?.user?.id || null;
        // console.log(slot,questionId, is_correct, question_type,user_id)
        if (questionId && is_correct === 'true' && user_id) {
            await Question.updateUserId(questionId, user_id);
        }

        const question = await Question.findRandomBySlot({
            slot: parseInt(slot),
            user_id: '',
            question_type: question_type || null,
        });

        if (!question) return res.status(404).json({ message: 'No questions found' });

        res.status(200).json(question);
    } catch (error) {
        console.error('❌ Error in GET /question/:slot:', error);
        res.status(500).json({ error: error.message });
    }
});



router.get('/questionlanguage/:slot', async (req, res) => {
    try {
        const { questionId, question_type } = req.query; 
        const { slot } = req.params;

        // Ensure slot is an integer
        const parsedSlot = parseInt(slot);

        // Validate input
        if (!questionId) {
            return res.status(400).json({ message: "Missing questionId" });
        }

        // Get total count of matching questions
        const count = await Question.countByFilter({ slot: parsedSlot, user_id: '', question_type });
        if (count === 0) {
            return res.status(404).json({ message: "No questions found" });
        }

        // Fetch the question
        const question = await Question.findById(questionId);
        
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json(question);

    } catch (err) {
        console.error("❌ Error fetching question:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Get A Specific Question
// Check answer by questionId (Returns the correct answer)
router.get('/check/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;

        // Validate questionId
        if (!questionId) {
            return res.status(400).json({ error: "Missing questionId" });
        }

        // Find the question by ID
        const question = await Question.findById(questionId);

        // If question not found
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        res.status(200).json({ answer: question.answer });
    } catch (err) {
        console.error("❌ Error fetching answer:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Duplicate route for checking answer (if needed for another purpose)
router.get('/checkanswer/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;

        // Validate questionId
        if (!questionId) {
            return res.status(400).json({ error: "Missing questionId" });
        }

        // Find the question by ID
        const question = await Question.findById(questionId);

        // If question not found
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        res.status(200).json({ answer: question.answer });
    } catch (err) {
        console.error("❌ Error fetching answer:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/lifelines/audiencepoll/:questionId', async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (question.slot <= 40000)
            options = audiencePoll(question.answer - 1, 50);
        else if (question.slot <= 320000)
            options = audiencePoll(question.answer - 1, 30);
        else options = audiencePoll(question.answer - 1, 10);
        const data = {
            option1: options[0],
            option2: options[1],
            option3: options[2],
            option4: options[3]
        };
        res.status(200).json(data);
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err });
    }
});

router.get(
    '/lifelines/50-50-to-audiencepoll/:questionId/:removedOption1/:removedOption2',
    async (req, res) => {
        try {
            const question = await Question.findById(req.params.questionId);
            const removedOption1 = req.params.removedOption1 - 1;
            const removedOption2 = req.params.removedOption2 - 1;

            if (question.slot <= 40000)
                options = fiftyFiftyToAudiencePoll(
                    question.answer - 1,
                    removedOption1,
                    removedOption2,
                    50
                );
            else if (question.slot <= 320000)
                options = fiftyFiftyToAudiencePoll(
                    question.answer - 1,
                    removedOption1,
                    removedOption2,
                    30
                );
            else
                options = fiftyFiftyToAudiencePoll(
                    question.answer - 1,
                    removedOption1,
                    removedOption2,
                    10
                );
            const data = {
                option1: options[0],
                option2: options[1],
                option3: options[2],
                option4: options[3]
            };
            res.status(200).json(data);
        } catch (err) {
            console.log(err);
            res.status(400).json({ error: err });
        }
    }
);

function audiencePoll(answer, value) {
    let options = [0, 0, 0, 0];
    options[answer] = Math.floor(Math.random() * 50) + value;
    let total = options[answer];
    for (let i = 0; i < 3; i++) {
        let zeroAt = options.indexOf(0);
        if (i == 2) options[zeroAt] = 100 - total;
        else {
            options[zeroAt] = Math.floor(Math.random() * (100 - total));
            total += options[zeroAt];
        }
    }
    return options;
}

function fiftyFiftyToAudiencePoll(answer, removed1, removed2, value) {
    let options = [0, 0, 0, 0];
    options[answer] = Math.floor(Math.random() * 50) + value;
    for (let i = 0; i < 4; i++) {
        if (i != removed1 && i != removed2 && options[i] == 0) {
            options[i] = 100 - options[answer];
            break;
        }
    }
    return options;
}

router.get('/lifelines/fiftyfifty/:questionId', async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        let randomOption1 = Math.floor(Math.random() * 4) + 1;
        while (randomOption1 == question.answer)
            randomOption1 = Math.floor(Math.random() * 4) + 1;
        let randomOption2 = Math.floor(Math.random() * 4) + 1;
        while (
            randomOption2 == question.answer ||
            randomOption2 == randomOption1
        )
            randomOption2 = Math.floor(Math.random() * 4) + 1;
        res.status(200).json({
            remove1: randomOption1,
            remove2: randomOption2
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err });
    }
});

router.get('/lifelines/flipthequestion/:questionId/:slot', async (req, res) => {
    try {
        const { question_type } = req.query; 
        const count = await Question.countByFilter({
            slot: req.params.slot, user_id:"", question_type: question_type
        });
        // const random = Math.floor(Math.random() * (count - 1));
        const question = await Question.findRandomBySlot({
            slot: req.params.slot,
            user_id:"", 
            question_type: question_type,
            questionId: req.params.questionId
        });
        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err });
    }
});

router.get('/lifelines/asktheexpert/:questionId', async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        res.status(200).json({ answer: question.answer });
        
        // const random = Math.floor(Math.random() * 100);
        // if (random > 20) {
        //     // Return correct answer
        //     res.status(200).json({ answer: question.answer });
        // } else {
        //     // Return any random answer -> Maybe correct or incorrect
        //     const randomAnswer = Math.floor(Math.random() * 4) + 1;
        //     res.status(200).json({ answer: randomAnswer });
        // }
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err });
    }
});

router.get(
    '/lifelines/50-50-to-asktheexpert/:questionId/:removedOption1/:removedOption2',
    async (req, res) => {
        try {
            const question = await Question.findById(req.params.questionId);
            // console.log(question);
            const removedOption1 = req.params.removedOption1;
            const removedOption2 = req.params.removedOption2;

            // An array to store remaining Options
            let remainingOptionsArray = [1, 2, 3, 4];
            remainingOptionsArray = remainingOptionsArray.filter(
                item => item != removedOption1 && item != removedOption2
            );

            res.status(200).json({ answer: question.answer });

            // const random = Math.floor(Math.random() * 100);
            // if (random > 10) {
            //     // Return correct answer
            //     res.status(200).json({ answer: question.answer });
            // } else {
            //     // Return any random answer -> Maybe correct or incorrect
            //     const randomAnswer = Math.floor(Math.random() * 2);

            //     res.status(200).json({
            //         answer: remainingOptionsArray[randomAnswer]
            //     });
            // }
        } catch (err) {
            console.log(err);
            res.status(400).json({ error: err });
        }
    }
);

module.exports = router;
