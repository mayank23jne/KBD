// TODO Get the questions per slot
// Global Variables
const current_url = window.location.origin;
let is_correct = false;
let used_slot = 0;

let questionId = 0,
    option1 = '',
    option2 = '',
    option3 = '',
    option4 = '',
    slot = 0,
    checkpoint = 0,
    isFlip = false,
    isQuit = false;

// Time Container
const timer = {
    span: document.getElementById('progress-span'),
    left: document.getElementById('progress-left'),
    right: document.getElementById('progress-right'),
    running: false,
    timeLeft: 45,
    timeTotal: 45
};

// Question Container
const container = {
    question: document.getElementById('question'),
    option1: document.getElementById('option1'),
    option2: document.getElementById('option2'),
    option3: document.getElementById('option3'),
    option4: document.getElementById('option4')
};

// Dialog Container
const dialogs = {
    audienceDialog: document.getElementById('audience-poll-dialog'),
    flipDialog: document.getElementById('flip-the-question-message'),
    expertDialog: document.getElementById('ask-the-expert-dialog'),
    quitDialog: document.getElementById('quit-dialog'),
    quitMessage: document.getElementById('quit-message'),
    endGameDialog: document.getElementById('end-game-dialog'),
    overlay_dailog:  document.getElementById('id_overlay')
};

// Lifelines Container
const lifelines = {
    audiencePoll: document.getElementById('audience-poll'),
    fiftyFifty: document.getElementById('50-50'),
    flipTheQuestion: document.getElementById('flip-the-question'),
    askTheExpert: document.getElementById('ask-the-expert')
};

// Fifty Fifty Booleans
const fiftyFiftyDetailsContainer = {
    is50: false,
    removedOptions: []
};

// Buttons Container
const buttons = {
    lock: document.getElementById('lock-button'),
    quit: document.getElementById('quit-button')
};

// Slot Container (Started array from 1)
const slots = [
    0,
    1000,
    2000,
    3000,
    5000,
    10000,
    20000,
    40000,
    80000,
    160000,
    320000,
    640000,
    1250000,
    2500000,
    5000000,
    10000000,
    70000000
];


let timeElapsed = 0;

// Function to update time (in minutes and seconds)
function updateTimer() {
    timeElapsed++;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    console.log(`Time: ${minutes} min ${seconds} sec`);
}

// Start counting time when page loads
const timerInterval = setInterval(updateTimer, 1000);

// Access time when needed
function getTimeElapsed() {
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    return `${minutes} min ${seconds} sec`;
}

// TODO Get the slot
function startGame() {
    // Initialize slot to 1
    slot = 1;

    // Get the Question
    getQuestion(slots[slot]);
}

window.addEventListener('DOMContentLoaded', event => {
    startGame();
});

buttons.lock.addEventListener('click', () => {
    // Lock Buttons and Lifelines
    lockButtons(buttons);
    lockLifelines(lifelines);

    // Pause timer if exists
    if (slot <= 10) {
        pauseTimer();
    }

    // Gets the selected input radio button
    const selectedAnswer = Array.from(
        document.getElementsByName('answer')
    ).filter(element => element.checked == true);

    if (selectedAnswer.length == 1) {
        // Answer is selected
        // Gets the parent of input button -> Label
        const answerLabel = selectedAnswer[0].parentNode;

        // Gets all the checked spans and hides it after it has been clicked
        const spans = document.querySelectorAll('.checked');
        spans.forEach(span => {
            span.style.visibility = 'hidden';
        });

        // Gets the corrected answer option color and makes it white
        const optionColorSpan = document.getElementById(
            `option-color${selectedAnswer[0].value}`
        );
        optionColorSpan.style.color = '#ececec';

        // Sets the color of label to yellow
        answerLabel.style.background =
            'linear-gradient(90deg, rgba(240,176,0,1) 0%, rgba(224,209,70,1) 50%, rgba(240,176,0,1) 100%)';
        answerLabel.style.color = '#2a2a2a';
        console.log(selectedAnswer[0].value);

        checkAnswer(selectedAnswer[0].value);
    } else {
        // Time is up
        console.log('Game ended');
        checkAnswer(null);
    }
});

function show_overlay(){
    dialogs.overlay_dailog.classList.add('open')
}
function close_overlay(){
    dialogs.overlay_dailog.classList.remove('open')
}

buttons.quit.addEventListener('click', () => {
    // Show Dialog
    dialogs.quitDialog.style.display = 'block';
    show_overlay();

    // Pause timer if exists
    if (slot <= 10) {
        pauseTimer();
    }

    const message = document.getElementById('quit-dialog-message');
    message.innerHTML = `Are you sure you want to quit?<br />You will complete the level ${slot-1}`;
    const quitButton = document.getElementById('quit-dialog-quit');
    const cancelButton = document.getElementById('quit-dialog-cancel');

    quitButton.addEventListener('click', () => {
        isQuit = true;
        dialogs.quitDialog.style.display = 'none';
        // dialogs.quitMessage.style.display = 'block';
        close_overlay();

        endGame();
    });

    cancelButton.addEventListener('click', () => {
        dialogs.quitDialog.style.display = 'none';
        close_overlay();
        startResumeTimer();
    });
});

// function getQuestion(price) {
//     // Lock Buttons and Lifelines
//     lockButtons(buttons);
//     lockLifelines(lifelines);

//     // Set the time
//     if (slot <= 5) {
//         setTimer(45);
//         console.log('Timer Entered if');
//     } else if (slot <= 10) {
//         setTimer(60);
//         console.log('Timer Entered else if');
//     } else {
//         setTimer(null);
//         console.log('Timer Entered else');
//     }

//     console.log(slots[slot]);
//     console.log(slot);
//     // Make question AJAX request
//     let questionRequest = new XMLHttpRequest();
//     questionRequest.onload = () => {
//         let responseObject = null;

//         try {
//             responseObject = JSON.parse(questionRequest.responseText);
//         } catch (err) {
//             console.log('Could not parse JSON!');
//         }

//         if (responseObject) {
//             if (questionRequest.status == 200) {
//                 // If question is received successfully set the question
//                 console.log(responseObject[0]);
//                 setQuestion(responseObject[0]);
//             } else {
//                 // TODO Error if network issue
//                 console.log('Error');
//             }
//         }
//     };

//     if (isFlip) {
//         console.log('Entered else');
//         isFlip = false;
//         dialogs.flipDialog.style.display = 'none';
//         questionRequest.open(
//             'get',
//             `${current_url}/api/lifelines/flipthequestion/${questionId}/${price}`,
//             true
//         );
//     } else {
//         console.log('Entered if');
//         questionRequest.open(
//             'get',
//             `${current_url}/api/question/${price}`,
//             true
//         );
//     }
//     questionRequest.send();
// }

// Function to get query parameter value from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Get language from the URL (e.g., ?language=english)
// const language = getQueryParam('lang') || ''; // Default to 'english'
const question_type = getQueryParam('q_type') || ''; 

// If "Chhahdhala" is selected, switch to Hindi
const hindiRadio = document.getElementById("lang-hi");
const englishRadio = document.getElementById("lang-en");

// If "Chhahdhala" is selected, switch to Hindi and disable language change
if (question_type === "Chhahdhala") {
    hindiRadio.checked = true;
    englishRadio.disabled = true; 
} else {
    englishRadio.disabled = false; // Enable for other types
}


function changeLanguage() {

    let price = slots[slot];
    // Lock Buttons and Lifelines
    lockButtons(buttons);
    lockLifelines(lifelines);


    let language = document.querySelector('input[name="language"]:checked').value || ''; 
    console.log(`Level: ${slot}, Language: ${language}`);

    // Make question AJAX request
    let questionRequest = new XMLHttpRequest();
    questionRequest.onload = () => {
        let responseObject = null;

        try {
            responseObject = JSON.parse(questionRequest.responseText);
        } catch (err) {
            console.error('Could not parse JSON!');
        }

        if (responseObject) {
            if (questionRequest.status == 200) {
                // If question is received successfully set the question
                console.log('Question:', responseObject);
                setQuestion(responseObject);
                
                const div = document.getElementById('50-50-div');
                if ((fiftyFiftyDetailsContainer.is50) && (used_slot === slot)){
                    console.log('Entered 50-50 to Experts');
                    let removedOption1 = fiftyFiftyDetailsContainer.removedOptions[0];
                    let removedOption2 = fiftyFiftyDetailsContainer.removedOptions[1];

                    fiftyFiftyDetailsContainer.removedOptions.push(
                        responseObject.remove1,
                        responseObject.remove2
                    );
                    console.log(fiftyFiftyDetailsContainer.removedOptions);

                    // Remove two incorrect answers
                    const incorrectAnswer1 = document.getElementById(
                        `option${removedOption1}`
                    );
                    incorrectAnswer1.innerHTML = '&nbsp;';
                    const incorrectAnswer2 = document.getElementById(
                        `option${removedOption2}`
                    );
                    incorrectAnswer2.innerHTML = '&nbsp;';
                    div.classList.remove('unused');
                } 
            } 
            else if (questionRequest.status == 404) {
                console.error('No questions found');
            } else {
                console.error('Error in fetching question');
            }
        }
    };
    questionRequest.open(
        'get',
        `${current_url}/api/questionlanguage/${price}?questionId=${questionId}&question_type=${question_type}`,
        true
    );

    questionRequest.send();
    



}


// Updated getQuestion function with language parameter
function getQuestion(price) {
    // Lock Buttons and Lifelines
    lockButtons(buttons);
    lockLifelines(lifelines);

    // Set the time based on slot
    if (slot <= 5) {
        setTimer(45);
    } else if (slot <= 10) {
        setTimer(60);
    } else {
        setTimer(null);
    }

    let language = document.querySelector('input[name="language"]:checked').value || ''; 
    console.log(`Level: ${slot}, Language: ${language}`);

    // Make question AJAX request
    let questionRequest = new XMLHttpRequest();
    questionRequest.onload = () => {
        let responseObject = null;

        try {
            responseObject = JSON.parse(questionRequest.responseText);
        } catch (err) {
            console.error('Could not parse JSON!');
        }

        if (responseObject) {
            if (questionRequest.status == 200) {
                // If question is received successfully set the question
                console.log('Question:', responseObject);
                setQuestion(responseObject);
            } 
            else if (questionRequest.status == 404) {
                console.error('No questions found');
            } else {
                console.error('Error in fetching question');
            }
        }
    };

    // If "Flip the Question" lifeline is used, fetch alternate question
    if (isFlip) {
        isFlip = false;
        dialogs.flipDialog.style.display = 'none';
        questionRequest.open(
            'get',
            `${current_url}/api/lifelines/flipthequestion/${questionId}/${price}?language=${language}&question_type=${question_type}`,
            true
        );
    } else if(is_correct){
        questionRequest.open(
            'get',
            `${current_url}/api/question/${price}?questionId=${questionId}&is_correct=${is_correct}&question_type=${question_type}`,
            true
        );
    }else {
        questionRequest.open(
            'get',
            `${current_url}/api/question/${price}?language=${language}&question_type=${question_type}`,
            true
        );
    }
    questionRequest.send();
}


function setQuestion(questionObject) {
    let language = document.querySelector('input[name="language"]:checked').value || ''; 

    if(questionObject.question_type === 'Chhahdhala'){
        language = 'hi';
    }
    // Set global variables
    questionId = questionObject._id;
    option1 = questionObject.option1[language];
    option2 = questionObject.option2[language];
    option3 = questionObject.option3[language];
    option4 = questionObject.option4[language];

    // Set the question
    container.question.innerHTML = questionObject.question[language];

    // Set options after 5 seconds
    // setTimeout(() => {
    container.option1.innerHTML = `<input type="radio" name="answer" id="1" value="1" /><span class="option-color" id="option-color1">A:&nbsp;</span> ${option1} <span class="checked"></span>`;
    container.option2.innerHTML = `<input type="radio" name="answer" id="2" value="2" /><span class="option-color" id="option-color2">B:&nbsp;</span> ${option2} <span class="checked"></span>`;
    container.option3.innerHTML = `<input type="radio" name="answer" id="3" value="3" /><span class="option-color" id="option-color3">C:&nbsp;</span> ${option3} <span class="checked"></span>`;
    container.option4.innerHTML = `<input type="radio" name="answer" id="4" value="4" /><span class="option-color" id="option-color4">D:&nbsp;</span> ${option4} <span class="checked"></span>`;

    // Unlock buttons and lifelines once options are displayed
    unlockButtons(buttons);
    if (slot != 16) unlockLifelines(lifelines);

    // Start the timer if slots < 10
    if (slot <= 10) {
        startResumeTimer();
    }
    // }, 1000);
}

function checkAnswer(selectedAnswer) {
    // Make check answer AJAX request
    let checkRequest = new XMLHttpRequest();
    checkRequest.onload = () => {
        let responseObject = null;
        try {
            responseObject = JSON.parse(checkRequest.responseText);
        } catch (err) {
            console.log('Could not parse JSON!');
        }

        if (responseObject) {
            if (checkRequest.status == 200) {
                const selectedAnswerLabel = document.getElementById(
                    `option${selectedAnswer}`
                );
                setTimeout(() => {
                    // Display answer result after 2 seconds
                    if (responseObject.answer == selectedAnswer) {
                        console.log('Correct answer!');
                        is_correct = true;
                        selectedAnswerLabel.style.background =
                            'linear-gradient(90deg, rgba(47,132,4,1) 0%, rgba(87,212,8,1) 50%, rgba(47,132,4,1) 100%)';
                        selectedAnswerLabel.style.color = '#ffffff';

                        const optionColorSpan = document.getElementById(
                            `option-color${selectedAnswer}`
                        );
                        optionColorSpan.style.color = '#f0d245';

                        // Since answer is correct, end the question and go to next question
                        setTimeout(() => {
                            endQuestion(true);
                        }, 1000);
                    } else {
                        console.log('Incorrect answer!');
                        if (selectedAnswer) {
                            // Answer is selected but is wrong
                            selectedAnswerLabel.style.background =
                                'linear-gradient(90deg, rgba(240,176,0,1) 0%, rgba(224,209,70,1) 50%, rgba(240,176,0,1) 100%)';
                        }
                        // Display correct answer
                        const correctAnswerLabel = document.getElementById(
                            `option${responseObject.answer}`
                        );
                        correctAnswerLabel.style.background =
                            'linear-gradient(90deg, rgba(47,132,4,1) 0%, rgba(87,212,8,1) 50%, rgba(47,132,4,1) 100%)';
                        correctAnswerLabel.style.color = '#ffffff';

                        // Since answer is incorrect end the game
                        setTimeout(() => {
                            endQuestion(false);
                        }, 1000);
                    }
                }, 1000);
            } else {
                console.log('Error: ' + responseObject.error);
            }
        }
    };

    checkRequest.open(
        'get',
        `${current_url}/api/checkanswer/${questionId}`,
        true
    );
    checkRequest.send();
}

function endQuestion(isCorrect) {
    // TODO Display a dialog

    setTimeout(() => {
        // Set all label backgrounds and text color to default settings and empty labels
        container.question.innerHTML = '&nbsp;';
        document.querySelectorAll('.answer').forEach(label => {
            label.innerHTML = '&nbsp';
            label.style.background = '#390f4e';
            label.style.color = '#ffffff';
        });

        // Set color spans to yellow
        document.querySelectorAll('.option-color').forEach(span => {
            span.style.color = '#f0d245';
        });

        if (isFlip) {
            nextQuestion();
        } else if (isQuit) {
            endGame();
        } else if (isCorrect) {
            nextQuestion();
        } else {
            endGame();
        }
    }, 1000);
}

function nextQuestion() {
    // Save the checkpoint if slot is 10000 or 320000
    if (slot == 5 || slot == 10) {
        console.log('Checkpoint');
        checkpoint = slot;
    }

    if (slot == 10) {
        // Unlock 7 crore question
        lockedElements = document.querySelectorAll('.locked');
        lockedElements.forEach(lockedElement => {
            lockedElement.classList.remove('locked');
        });
    }

    if (!isFlip) {
        // Save color marker
        const marker = document.getElementById(`slot-marker-${slot}`);
        marker.style.visibility = 'visible';
    }

    if (!isFlip) slot++;
    getQuestion(slots[slot]);
}

function endGame() {
    let price = null;
    if (isQuit) {
        price = `Level  ${slot-1}`;
        // console.log(`You have won Rs ${slots[slot - 1]}`);
        console.log(`You have completed the level ${slot-1}`);
        flipTheQuestionMethod();
    } else {
        price = `Level  ${slot-1}`;
        // console.log(`You have won Rs ${slots[slot]}`);
        console.log(`You have completed the level ${slot-1}`);
    }

    dialogs.endGameDialog.style.display = 'block';
    dialogs.endGameDialog.innerHTML = price;

    get_time = getTimeElapsed();

    setTimeout(() => {
        window.location.href = `${current_url}/api/scorecard?question_type=${question_type}&level=${slot-1}&time=${get_time}`;
    }, 1000);

    // Clear markers
    document.querySelectorAll('.reached').forEach(marker => {
        marker.style.visibility = 'hidden';
    });
}

lifelines.audiencePoll.addEventListener('click', () => {
    // Pause the timer if it exists
    if (slot <= 10) {
        pauseTimer();
    }

    const div = document.getElementById('audience-poll-div');
    if (div.classList.contains('unused')) {
        // Use the lifeline

        // Send Audience Poll AJAX Request
        const audiencePollRequest = new XMLHttpRequest();
        audiencePollRequest.onload = () => {
            let responseObject = null;

            try {
                responseObject = JSON.parse(audiencePollRequest.responseText);
            } catch (err) {
                console.log('Could not parse JSON!');
            }

            if (responseObject) {
                if (audiencePollRequest.status == 200) {
                    createChart(
                        responseObject.option1,
                        responseObject.option2,
                        responseObject.option3,
                        responseObject.option4
                    );
                    div.classList.remove('unused');
                } else {
                    console.log('Error');
                }
            }
        };

        if (fiftyFiftyDetailsContainer.is50) {
            console.log('Entered 50-50 to audiencePoll');
            let removedOption1 = fiftyFiftyDetailsContainer.removedOptions[0];
            let removedOption2 = fiftyFiftyDetailsContainer.removedOptions[1];

            audiencePollRequest.open(
                'get',
                `${current_url}/api/lifelines/50-50-to-audiencepoll/${questionId}/${removedOption1}/${removedOption2}`,
                true
            );
        } else {
            audiencePollRequest.open(
                'get',
                `${current_url}/api/lifelines/audiencepoll/${questionId}`,
                true
            );
        }

        audiencePollRequest.send();

        const btnClose = document.getElementById('audience-poll-close');
        btnClose.addEventListener('click', () => {
            dialogs.audienceDialog.style.display = 'none';
            close_overlay();

            // Resume the timer if it exists
            if (slot <= 10) {
                startResumeTimer();
            }
        });

        dialogs.audienceDialog.style.display = 'block';
        show_overlay();
    } else {
        console.log('Already used');
    }
});

lifelines.fiftyFifty.addEventListener('click', () => {
    const div = document.getElementById('50-50-div');
    if (div.classList.contains('unused')) {
        // Use the lifeline

        fiftyFiftyDetailsContainer.is50 = true;

        used_slot = slot;

        // Send Fifty Fifty AJAX Request
        const fiftyFiftyRequest = new XMLHttpRequest();
        fiftyFiftyRequest.onload = () => {
            let responseObject = null;

            try {
                responseObject = JSON.parse(fiftyFiftyRequest.responseText);
            } catch (err) {
                console.log('Could not parse JSON!');
            }

            if (responseObject) {
                if (fiftyFiftyRequest.status == 200) {
                    console.log(responseObject);
                    // Adding to 50-50 -> Experts advice .removed array
                    fiftyFiftyDetailsContainer.removedOptions.push(
                        responseObject.remove1,
                        responseObject.remove2
                    );
                    console.log(fiftyFiftyDetailsContainer.removedOptions);

                    // Remove two incorrect answers
                    const incorrectAnswer1 = document.getElementById(
                        `option${responseObject.remove1}`
                    );
                    incorrectAnswer1.innerHTML = '&nbsp;';
                    const incorrectAnswer2 = document.getElementById(
                        `option${responseObject.remove2}`
                    );
                    incorrectAnswer2.innerHTML = '&nbsp;';
                    div.classList.remove('unused');
                } else {
                    console.log('Error');
                }
            }
        };
        fiftyFiftyRequest.open(
            'get',
            `${current_url}/api/lifelines/fiftyfifty/${questionId}`,
            true
        );
        fiftyFiftyRequest.send();
    } else {
        console.log('Already used');
    }
});

lifelines.flipTheQuestion.addEventListener('click', () => {
    const div = document.getElementById('flip-the-question-div');
    if (div.classList.contains('unused')) {
        // Use the lifeline
        // dialogs.flipDialog.style.display = 'block';
        isFlip = true;
        div.classList.remove('unused');
        flipTheQuestionMethod();
    } else {
        console.log('Already used');
    }
});

function flipTheQuestionMethod() {
    // Pause the timer if it exists
    if (slot <= 10) {
        pauseTimer();
    }

    lockLifelines(lifelines);
    // getQuestion(slots[slot]);
    setTimeout(() => {
        endQuestion(false);
    }, 1000);
}

// Ask the expert
lifelines.askTheExpert.addEventListener('click', () => {
    // Pause the timer if it exists
    if (slot <= 10) {
        pauseTimer();
    }

    const div = document.getElementById('ask-the-expert-div');
    if (div.classList.contains('unused')) {
        // Use the lifeline

        // Send Ask The Expert AJAX Request
        const askTheExpertRequest = new XMLHttpRequest();
        askTheExpertRequest.onload = () => {
            let responseObject = null;

            try {
                responseObject = JSON.parse(askTheExpertRequest.responseText);
            } catch (err) {
                console.log('Could not parse JSON!');
            }

            if (responseObject) {
                if (askTheExpertRequest.status == 200) {
                    console.log(responseObject);
                    const text = document.getElementById('ask-the-expert-p');
                    const answerLabelText = document.getElementById(
                        `option${responseObject.answer}`
                    ).textContent;
                    text.innerHTML = `Expert thinks the answer is ${answerLabelText}`;
                    div.classList.remove('unused');
                } else {
                    console.log('Error');
                }
            }
        };

        if (fiftyFiftyDetailsContainer.is50) {
            console.log('Entered 50-50 to Experts');
            let removedOption1 = fiftyFiftyDetailsContainer.removedOptions[0];
            let removedOption2 = fiftyFiftyDetailsContainer.removedOptions[1];

            askTheExpertRequest.open(
                'get',
                `${current_url}/api/lifelines/50-50-to-asktheexpert/${questionId}/${removedOption1}/${removedOption2}`,
                true
            );
        } else {
            askTheExpertRequest.open(
                'get',
                `${current_url}/api/lifelines/asktheexpert/${questionId}`,
                true
            );
        }

        askTheExpertRequest.send();

        const btnClose = document.getElementById('ask-the-expert-close');
        btnClose.addEventListener('click', () => {
            dialogs.expertDialog.style.display = 'none';
            close_overlay();

            // Resume the timer if it exists
            if (slot <= 10) {
                startResumeTimer();
            }
        });

        dialogs.expertDialog.style.display = 'block';
        show_overlay();
    } else {
        console.log('Already used');
    }
});

function setTimer(time) {
    timer.running = false;
    if (time) {
        // Time is either 45 or 60 seconds
        timer.span.innerHTML = time;
        timer.timeLeft = time;
        timer.timeTotal = time;
        timer.left.style.width = '0%';
        timer.right.style.width = '0%';
    } else {
        // Time is infinity
        timer.span.innerHTML = 0;
        timer.timeLeft = 0;
        timer.timeTotal = 0;
        timer.left.style.width = '100%';
        timer.right.style.width = '100%';
    }
}

function startResumeTimer() {
    if (!timer.running) {
        // Start or Resume Timer
        timer.running = true;
        decrementTimer(timer.timeLeft);
    }
}

function pauseTimer() {
    if (timer.running) {
        // Pause Timer
        timer.running = false;
    }
}

function decrementTimer() {
    if (timer.running) {
        setTimeout(() => {
            if (timer.timeLeft >= 1) {
                timer.timeLeft--;
                let progress =
                    100 - Math.floor((timer.timeLeft / timer.timeTotal) * 100);
                timer.left.style.width = progress + '%';
                timer.right.style.width = progress + '%';
                timer.span.innerHTML = timer.timeLeft;
                decrementTimer();
            } else {
                console.log('Time is up');
                buttons.lock.click();
            }
        }, 1000);
    }
}



// Function to move the lifelines on mobile and restore on desktop
function moveLifeline() {
    const lifelineDiv = document.getElementById('desk_lifeline'); // Lifelines div
    const languageContainer = document.querySelector('.language-container'); // Language container
    // const aside = document.querySelector('aside'); // Sidebar
    const aside = document.getElementById('side_aside'); // Sidebar

    // Ensure all required elements exist
    if (!lifelineDiv || !languageContainer || !aside) return;

    // Check screen width: Mobile is <= 768px
    const isMobile = window.innerWidth <= 768;

    // If in mobile view, move lifelines to main after language container
    if (isMobile) {
        if (!languageContainer.nextElementSibling?.isSameNode(lifelineDiv)) {
            languageContainer.parentNode.insertBefore(lifelineDiv, languageContainer.nextSibling);
        }
    }
    // If in desktop view, move lifelines back to the aside
    else {
        if (!aside.contains(lifelineDiv)) {
            // aside.appendChild(lifelineDiv);
            aside.insertBefore(lifelineDiv, aside.firstChild);
        }
    }
}

// Ensure the function runs on page load and window resize
document.addEventListener('DOMContentLoaded', moveLifeline);
window.addEventListener('resize', moveLifeline);







// Get elements
const levelsBtn = document.getElementById('levels-btn');
const sideAside = document.getElementById('side_aside');
const closePopup = document.getElementById('close-popup');

// Create overlay for dimming background
const overlay = document.createElement('div');
overlay.className = 'level_overlay';
document.body.appendChild(overlay);

// Open popup
levelsBtn.addEventListener('click', () => {
    sideAside.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable scrolling
});

// Close popup
const closePopupFunc = () => {
    sideAside.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
};

closePopup.addEventListener('click', closePopupFunc);
overlay.addEventListener('click', closePopupFunc);
