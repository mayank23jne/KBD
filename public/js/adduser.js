
current_url = window.location.origin;

const signupForm = {
    username: document.getElementById('new-username'),
    email: document.getElementById('email'),
    password: document.getElementById('new-password'),
    confirmPassword: document.getElementById('confirm-password'),
    language_select: document.getElementById('language-select'),
    question_type: document.getElementById('question_type'),
    userType: document.querySelector('input[name="userType"]:checked'),
    submit: document.getElementById('btn-signup'),
};

signupForm.submit.addEventListener('click', () => {
    const requestData = {
        username: signupForm.username.value,
        email: signupForm.email.value,
        password: signupForm.password.value,
        confirmPassword: signupForm.confirmPassword.value,
        language_select: signupForm.language_select.value,
        question_type: signupForm.question_type.value,
        userType: signupForm.userType ? signupForm.userType.value : 'registered',
    };

    fetch(current_url+'/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                // alert('User registered successfully!');
                clearSignupForm();
                window.location.href =current_url+`${data.redirectUrl}?lang=${requestData.language_select}&q_type=${requestData.question_type}`
            }
        })
        .catch((err) => console.error('Error:', err));
});

function clearSignupForm() {
    signupForm.username.value = '';
    signupForm.email.value = '';
    signupForm.password.value = '';
    signupForm.confirmPassword.value = '';
}


// Function to generate a random string of given length
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}



const loginForm = {
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    language_select: document.getElementById('language-select'),
    question_type: document.getElementById('question_type'),
    userType: document.querySelector('input[name="userType"]:checked'),
    submit: document.getElementById('btn-login'),
};

loginForm.submit.addEventListener('click', () => {

    let user_type =  document.querySelector('input[name="userType"]:checked').value

    // If user type is 'guest', generate a random string and set it into the fields.
    if (user_type === 'guest') {
        const randomStr = generateRandomString(10); // Change length as needed
        signupForm.username.value = randomStr;
        signupForm.email.value = randomStr + '@guest.com'; // Optionally, use a domain for guest emails
        signupForm.password.value = randomStr;
        signupForm.confirmPassword.value = randomStr;

        
        const requestData = {
            username: signupForm.username.value,
            email: signupForm.email.value,
            password: signupForm.password.value,
            confirmPassword: signupForm.confirmPassword.value,
            language_select: signupForm.language_select.value,
            question_type: signupForm.question_type.value,
            userType: user_type,
        };

        fetch(current_url + '/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                // Optionally, clear the signup form
                clearSignupForm();
                window.location.href = current_url + `${data.redirectUrl}?lang=${requestData.language_select}&q_type=${requestData.question_type}`;
            }
        })
        .catch((err) => console.error('Error:', err));

    }else{

        const requestData = {
            username: loginForm.username.value,
            password: loginForm.password.value,
            language_select: loginForm.language_select.value,
            question_type: loginForm.question_type.value,
            userType: loginForm.userType ? loginForm.userType.value : 'registered',
        };

        fetch(current_url+'/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log('User login successfully!');
                
                window.location.href =current_url+`${data.redirectUrl}?lang=${requestData.language_select}&q_type=${requestData.question_type}`
            }
        })
        .catch((err) => console.error('Error:', err));
    }
});
