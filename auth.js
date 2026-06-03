const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

const authFormsContainer = document.getElementById('auth-forms');
const loggedInPanel = document.getElementById('logged-in-panel');
const welcomeMessage = document.getElementById('welcome-message');

// Elemente pentru afișarea datelor curente
const displayName = document.getElementById('display-name');
const displayEmail = document.getElementById('display-email');

// Selectăm Pop-up-urile (Modalele)
const modalName = document.getElementById('modal-name');
const modalEmail = document.getElementById('modal-email');
const modalPassword = document.getElementById('modal-password');

let users = JSON.parse(localStorage.getItem('floraria_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

// FUNCȚIE PENTRU VERIFICAREA STĂRII PAGINII ȘI POPULAREA INTERFEȚEI
function toggleAuthInterface() {
    if (currentUser) {
        if (authFormsContainer) authFormsContainer.style.display = 'none';
        if (loggedInPanel) loggedInPanel.style.display = 'flex';
        if (welcomeMessage) welcomeMessage.textContent = `Salut, ${currentUser.name}!`;

        // Afișăm datele text în listă
        if (displayName) displayName.textContent = currentUser.name;
        if (displayEmail) displayEmail.textContent = currentUser.email;

        // --- EVENIMENTE DESCHIDERE POP-UP-URI ---
        document.getElementById('open-name-modal').onclick = () => {
            document.getElementById('new-name').value = currentUser.name;
            modalName.style.display = 'flex';
        };
        
        document.getElementById('open-email-modal').onclick = () => {
            document.getElementById('new-email').value = currentUser.email;
            modalEmail.style.display = 'flex';
        };
        
        document.getElementById('open-password-modal').onclick = () => {
            // Resetăm căsuțele de parole la deschidere ca să fie goale
            document.getElementById('old-password').value = '';
            document.getElementById('new-password').value = '';
            modalPassword.style.display = 'flex';
        };

        // --- EVENIMENTE ÎNCHIDERE POP-UP-URI (Butoanele Anulează) ---
        document.querySelectorAll('.btn-close-modal').forEach(button => {
            button.onclick = () => {
                modalName.style.display = 'none';
                modalEmail.style.display = 'none';
                modalPassword.style.display = 'none';
            };
        });

        // Logica pentru butonul de Log Out
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                localStorage.removeItem('floraria_current_user');
                alert('Te-ai deconectat cu succes!');
                window.location.href = 'index.html';
            };
        }

        // Logica pentru butonul de Ștergere Cont
        const deleteBtn = document.getElementById('delete-acc-btn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (confirm('Ești absolut sigur că vrei să îți ștergi definitiv contul?')) {
                    let allUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
                    allUsers = allUsers.filter(user => user.email !== currentUser.email);
                    localStorage.setItem('floraria_users', JSON.stringify(allUsers));
                    localStorage.removeItem('floraria_current_user');
                    alert('Contul tău a fost șters definitiv.');
                    window.location.href = 'index.html';
                }
            };
        }
    } else {
        if (authFormsContainer) authFormsContainer.style.display = 'flex';
        if (loggedInPanel) loggedInPanel.style.display = 'none';
    }
}

// Funcție ajutătoare pentru actualizarea bazei de date globale și a sesiunii
function saveUserData(updatedFields) {
    let allUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
    const userIndex = allUsers.findIndex(user => user.email === currentUser.email);

    if (userIndex !== -1) {
        // Actualizăm câmpurile în lista generală
        allUsers[userIndex] = { ...allUsers[userIndex], ...updatedFields };
        localStorage.setItem('floraria_users', JSON.stringify(allUsers));

        // Actualizăm câmpurile în sesiunea curentă
        currentUser = { ...currentUser, ...updatedFields };
        localStorage.setItem('floraria_current_user', JSON.stringify(currentUser));
        
        alert('Modificare salvată cu succes!');
        
        // Închidem toate pop-up-urile și reîmprospătăm interfața
        modalName.style.display = 'none';
        modalEmail.style.display = 'none';
        modalPassword.style.display = 'none';
        toggleAuthInterface();
    }
}

// --- LOGICA SALVĂRII DIN POP-UP-URI ---

// 1. Schimbare Nume
document.getElementById('form-change-name').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('new-name').value;
    saveUserData({ name: val });
});

// 2. Schimbare Email
document.getElementById('form-change-email').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('new-email').value;

    let allUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
    const emailTaken = allUsers.some(user => user.email === val && user.email !== currentUser.email);

    if (emailTaken) {
        alert('Acest email este deja utilizat de altcineva!');
        return;
    }
    saveUserData({ email: val });
});

// 3. Schimbare Parolă (CU VERIFICARE PAROLĂ VECHE)
document.getElementById('form-change-password').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const oldPasswordInput = document.getElementById('old-password').value;
    const newPasswordInput = document.getElementById('new-password').value;

    // Verificăm dacă parola veche introdusă coincide cu cea din cont
    if (oldPasswordInput !== currentUser.password) {
        alert('Parola actuală este incorectă! Modificarea a fost respinsă.');
        return;
    }

    // Verificăm dacă noua parolă nu este identică cu cea veche
    if (oldPasswordInput === newPasswordInput) {
        alert('Noua parolă nu poate fi identică cu cea veche!');
        return;
    }

    saveUserData({ password: newPasswordInput });
});


// --- LOGICA DIN FORMULARELE INIȚIALE (LOGIN / REGISTER) ---

if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const isAdmin = document.getElementById('reg-is-admin').checked;

        // Reîncărcăm utilizatorii din local storage ca să fim la zi
        let currentUsers = JSON.parse(localStorage.getItem('floraria_users')) || [];
        const userExists = currentUsers.some(user => user.email === email);
        
        if (userExists) {
            alert('Acest email este deja înregistrat!');
            return;
        }

        const newUser = { name, email, password, role: isAdmin ? 'admin' : 'customer' };
        currentUsers.push(newUser);
        localStorage.setItem('floraria_users', JSON.stringify(currentUsers));

        alert('Contul a fost creat cu succes! Te poți conecta acum.');
        registerForm.reset();
        
        // Actualizăm și variabila locală globală
        users = currentUsers;
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

// Lansăm funcția la încărcarea paginii
toggleAuthInterface();