const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

const authFormsContainer = document.getElementById('auth-forms');
const loggedInPanel = document.getElementById('logged-in-panel');
const welcomeMessage = document.getElementById('welcome-message');

const displayName = document.getElementById('display-name');
const displayEmail = document.getElementById('display-email');

let users = JSON.parse(localStorage.getItem('floraria_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

// Comută vizibilitatea parolei adăugând/eliminând clasa controlată de CSS
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    
    const eyeIcon = passwordInput.nextElementSibling;
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        if (eyeIcon && eyeIcon.classList.contains('toggle-password-eye')) {
            eyeIcon.classList.add('visible'); // Schimbă textul în "Ascunde"
        }
    } else {
        passwordInput.type = "password";
        if (eyeIcon && eyeIcon.classList.contains('toggle-password-eye')) {
            eyeIcon.classList.remove('visible'); // Revine la textul "Arată"
        }
    }
}

function toggleAuthInterface() {
    if (currentUser) {
        if (authFormsContainer) authFormsContainer.style.display = 'none';
        if (loggedInPanel) loggedInPanel.style.display = 'flex';
        if (welcomeMessage) welcomeMessage.textContent = `Salut, ${currentUser.name}!`;

        if (displayName) displayName.textContent = currentUser.name;
        if (displayEmail) displayEmail.textContent = currentUser.email;

        setupProfileModals();
    } else {
        if (authFormsContainer) authFormsContainer.style.display = 'flex';
        if (loggedInPanel) loggedInPanel.style.display = 'none';
    }
}

if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const isAdmin = document.getElementById('reg-is-admin').checked;

        let currentUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
        const userExists = currentUsers.some(user => user.email === email);
        
        if (userExists) {
            alert('Acest email este deja înregistrat!');
            return;
        }

        const newUser = { name, email, password, role: isAdmin ? 'admin' : 'customer' };
        currentUsers.push(newUser);
        localStorage.setItem('floraria_users', JSON.stringify(currentUsers));
        localStorage.setItem('floraria_current_user', JSON.stringify(newUser));

        alert(`Contul a fost creat cu succes! Bine ai venit, ${name}!`);
        registerForm.reset();
        
        if (newUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        let currentUsersList = JSON.parse(localStorage.getItem('floraria_users')) || [];
        const userFound = currentUsersList.find(user => user.email === email && user.password === password);

        if (!userFound) {
            alert('Email sau parolă incorectă!');
            return;
        }

        localStorage.setItem('floraria_current_user', JSON.stringify(userFound));
        alert(`Bine ai revenit, ${userFound.name}!`);
        
        window.location.href = 'index.html';
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('floraria_current_user');
        alert('Te-ai deconectat cu succes.');
        window.location.href = 'index.html';
    });
}

const deleteAccountBtn = document.getElementById('delete-account-btn');
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
        const confirmFirst = confirm("Ești absolut sigur că vrei să îți ștergi contul? Această acțiune este ireversibilă și vei pierde istoricul!");
        
        if (confirmFirst) {
            const confirmSecond = prompt("Pentru confirmare finală, scrie cuvântul 'STERGE':");
            
            if (confirmSecond === "STERGE" || confirmSecond === "sterge") {
                let allUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
                allUsers = allUsers.filter(u => u.email !== currentUser.email);
                localStorage.setItem('floraria_users', JSON.stringify(allUsers));
                localStorage.removeItem('floraria_current_user');
                
                alert('Contul tău a fost eliminat definitiv.');
                window.location.href = 'index.html';
            } else if (confirmSecond !== null) {
                alert('Confirmare respinsă. Textul introdus este greșit.');
            }
        }
    });
}

function setupProfileModals() {
    const btnName = document.getElementById('open-modal-name');
    const btnEmail = document.getElementById('open-modal-email');
    const btnPass = document.getElementById('open-modal-password');

    if (btnName) {
        btnName.onclick = () => {
            const newName = prompt("Introdu noul tău nume complet:", currentUser.name);
            if (newName && newName.trim() !== "") {
                updateUserData('name', newName.trim());
            }
        };
    }

    if (btnEmail) {
        btnEmail.onclick = () => {
            const newEmail = prompt("Introdu noua adresă de email:", currentUser.email);
            if (newEmail && newEmail.trim() !== "") {
                let allUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
                const emailTaken = allUsers.some(u => u.email === newEmail.trim() && u.email !== currentUser.email);
                
                if (emailTaken) {
                    alert("Acest email este deja folosit de alt cont!");
                } else {
                    updateUserData('email', newEmail.trim());
                }
            }
        };
    }

    if (btnPass) {
        btnPass.onclick = () => {
            const oldPass = prompt("Introdu parola curentă pentru verificare:");
            if (oldPass === currentUser.password) {
                const newPass = prompt("Introdu noua parolă dorită:");
                if (newPass && newPass.trim().length >= 4) {
                    updateUserData('password', newPass.trim());
                    alert("Parola a fost modificată cu succes!");
                } else {
                    alert("Parola este prea scurtă (minim 4 caractere).");
                }
            } else if (oldPass !== null) {
                alert("Parola curentă este incorectă!");
            }
        };
    }
}

function updateUserData(key, newValue) {
    let allUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
    const index = allUsers.findIndex(u => u.email === currentUser.email);
    
    if (index !== -1) {
        allUsers[index][key] = newValue;
        localStorage.setItem('floraria_users', JSON.stringify(allUsers));
        
        currentUser[key] = newValue;
        localStorage.setItem('floraria_current_user', JSON.stringify(currentUser));
        
        toggleAuthInterface();
    }
}

toggleAuthInterface();