current_url = window.location.origin;

const signupForm = {
  username: document.getElementById('new-username'),
  email: document.getElementById('email'),
  mobile: document.getElementById('mobile'),
  password: document.getElementById('new-password'),
  confirmPassword: document.getElementById('confirm-password'),
  language_select: document.querySelector('input[name="language"]:checked'),
  question_type: document.querySelector('input[name="question_type"]:checked'),
  userType: document.querySelector('input[name="userType"]:checked'),
  submit: document.getElementById('btn-signup'),
};

signupForm.submit.addEventListener('click', () => {
  let user_type = document.querySelector(
    'input[name="userType"]:checked',
  ).value;

  let selected_level = document.querySelector(
    'input[name="level"]:checked',
  ).value;

  let username = signupForm.username.value;
  let mobile = signupForm.mobile.value;
  let email = signupForm.email.value;

  // Check if email is empty or null
  if (!email || email.trim() === '') {
    email = `${username}${mobile}@gmail.com`;
  }

  const requestData = {
    username: signupForm.username.value,
    email: email,
    mobile: signupForm.mobile.value,
    password: signupForm.password.value,
    confirmPassword: signupForm.confirmPassword.value,
    language_select: document.querySelector('input[name="language"]:checked')
      ?.value,
    question_type: document.querySelector('input[name="question_type"]:checked')
      ?.value,
    userType: document.querySelector('input[name="userType"]:checked')
      ? document.querySelector('input[name="userType"]:checked').value
      : 'registered',
  };

  fetch(current_url + '/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        if (data.error.toLowerCase().includes('username')) {
          showToast('❌ Username is already taken. Please choose another one.');
        } else if (data.error.toLowerCase().includes('email')) {
          showToast('❌ Email is already registered.');
        } else if (data.error.toLowerCase().includes('mobile')) {
          showToast('❌ Mobile number is already in use.');
        } else {
          showToast('❌ ' + data.error); // fallback for unknown errors
        }
      } else {
        // alert('User registered successfully!');
        clearSignupForm();
        window.location.href =
          current_url +
          `${data.redirectUrl}&lang=${requestData.language_select}&q_type=${requestData.question_type}&level=${selected_level}&user_type=${user_type}`;
        // window.open(current_url + `${data.redirectUrl}?lang=${requestData.language_select}&q_type=${requestData.question_type}`, "_self");
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
  language_select: document.querySelector('input[name="language"]:checked'),
  question_type: document.querySelector('input[name="question_type"]:checked'),
  userType: document.querySelector('input[name="userType"]:checked'),
  email: document.getElementById('email'),
  id: document.getElementById('id'),
  submit: document.getElementById('btn-login'),
};

loginForm.submit.addEventListener('click', () => {
  let user_type = document.querySelector(
    'input[name="userType"]:checked',
  ).value;

  let selected_level = document.querySelector(
    'input[name="level"]:checked',
  ).value;
  localStorage.setItem('user_type', user_type);
  // If user type is 'guest', generate a random string and set it into the fields.
  if (user_type === 'guest') {
    const randomStr = generateRandomString(10); // Change length as needed
    signupForm.username.value = randomStr;
    signupForm.email.value = randomStr + '@guest.com'; // Optionally, use a domain for guest emails
    signupForm.mobile.value = randomStr;
    signupForm.password.value = randomStr;
    signupForm.confirmPassword.value = randomStr;

    const requestData = {
      username: signupForm.username.value,
      email: signupForm.email.value,
      mobile: signupForm.mobile.value,
      password: signupForm.password.value,
      confirmPassword: signupForm.confirmPassword.value,
      language_select: document.querySelector('input[name="language"]:checked')
        ?.value,
      question_type: document.querySelector(
        'input[name="question_type"]:checked',
      )?.value,
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
          showToast(data.error);
        } else {
          // Optionally, clear the signup form
          clearSignupForm();
          // console.log(current_url + `${data.redirectUrl}?lang=${requestData.language_select}&q_type=${requestData.question_type}`)

          window.location.href =
            current_url +
            `${data.redirectUrl}&lang=${requestData.language_select}&q_type=${requestData.question_type}&level=${selected_level}&user_type=${user_type}`;
          // window.open(current_url + `${data.redirectUrl}?lang=${requestData.language_select}&q_type=${requestData.question_type}`, "_self");
        }
      })
      .catch((err) => console.error('Error:', err));
  } else if (user_type === 'google') {
    const requestData = {
      email: loginForm.email.value,
      language_select: document.querySelector('input[name="language"]:checked')
        ?.value,
      question_type: document.querySelector(
        'input[name="question_type"]:checked',
      )?.value,
      userType: user_type,
    };
    fetch(current_url + '/api/login-with-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error);
        } else {
          window.location.href =
            current_url +
            `${data.redirectUrl}&lang=${requestData.language_select}&q_type=${requestData.question_type}&level=${selected_level}&user_type=${user_type}`;
        }
      });
  } else {
    const requestData = {
      username: loginForm.username.value,
      password: loginForm.password.value,
      language_select: document.querySelector('input[name="language"]:checked')
        ?.value,
      question_type: document.querySelector(
        'input[name="question_type"]:checked',
      )?.value,
      userType: document.querySelector('input[name="userType"]:checked')
        ? document.querySelector('input[name="userType"]:checked').value
        : 'registered',
      id: loginForm.id.value,
    };

    fetch(current_url + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error);
        } else {
          console.log('User login successfully!');

          window.location.href =
            current_url +
            `${data.redirectUrl}&lang=${requestData.language_select}&q_type=${requestData.question_type}&level=${selected_level}&user_type=${user_type}`;
        }
      })
      .catch((err) => console.error('Error:', err));
  }
});

function handleCredentialResponse(response) {
  language_select = document.querySelector(
    'input[name="language"]:checked',
  ).value;
  questiontype = document.querySelector(
    'input[name="question_type"]:checked',
  ).value;
  usertype = document.querySelector('input[name="userType"]:checked');
  selectedLevel = document.querySelector('input[name="level"]:checked').value;

  // Send ID token to backend
  fetch('/api/google-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: response.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.redirectUrl) {
        window.location.href = `${data.redirectUrl}?lang=${language_select}&q_type=${questiontype}&level=${selectedLevel}&user_type=${usertype}`;
      } else {
        showToast('Login failed: ' + data.error);
      }
    });
}

async function shareAppLink() {
  const shareMessage = 'Hey! I am playing KBDS – an amazing Jain quiz game.\nDownload the app from Play Store:';
  const shareUrl = 'https://play.google.com/store/apps/details?id=com.pepcus.kbds';
  const fullMessage = `${shareMessage}\n${shareUrl}`;

  const payload = {
    type: 'share',
    message: shareMessage,
    url: shareUrl, // Separate URL for the bridge to handle
    image: null,
  };

  // 🔥 InAppBrowser bridge
  if (window.cordova_iab?.postMessage) {
    console.log('📲 Sharing via Ionic bridge');
    window.cordova_iab.postMessage(JSON.stringify(payload));
    return;
  }

  // 🌐 Web Share API fallback
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'KBDS Game',
        text: shareMessage,
        url: shareUrl,
      });
      return;
    } catch (err) {
      console.log('Share cancelled or failed:', err);
      if (err.name === 'AbortError') return; // Don't fallback to clipboard if cancelled
    }
  }

  // 📋 Clipboard fallback
  try {
    await navigator.clipboard.writeText(fullMessage);
    showToast('Link copied to clipboard');
  } catch (err) {
    console.error('Clipboard failed:', err);
  }
}

function startEditUsername() {
  const text = document.getElementById('username_text');
  const input = document.getElementById('update_user_name');
  const editBtn = document.getElementById('edit_btn');
  const saveBtn = document.getElementById('save_btn');

  input.value = text.innerText;
  // text.style.display = "none";
  input.style.display = 'block';
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';

  input.focus();
}

function saveUsername() {
  const userId = document.getElementById('session_user_id')?.value;
  console.log('User ID:', userId);
  const params = new URLSearchParams(window.location.search);
  const encodedId = params.get('id');
  const id = encodedId ? atob(encodedId) : null;
  const updatedUserId = userId || id;
  const input = document.getElementById('update_user_name');
  const text = document.getElementById('username_text');
  const editBtn = document.getElementById('edit_btn');
  const saveBtn = document.getElementById('save_btn');

  const newName = input.value.trim();
  if (!newName) return showToast('Username cannot be empty');

  // ✅ API Call
  fetch(`/api/update-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: updatedUserId, username: newName }),
  })
    .then((res) => res.json())
    .then(() => {
      // console.log("Username updated successfully!");
      text.innerText = newName;

      input.style.display = 'none';
      text.style.display = 'inline';
      saveBtn.style.display = 'none';
      editBtn.style.display = 'inline-block';
    })
    .catch(() => showToast('Update failed'));
}
