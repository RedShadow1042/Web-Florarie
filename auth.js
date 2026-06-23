// =============================================
// auth.js — Autentificare via API MySQL
// =============================================

const API = 'api/users.php';

// Functie helper: apel API
async function apiCall(action, method, body) {
    try {
        const res = await fetch(`${API}?action=${action}`, {
            method: method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        return await res.json();
    } catch (e) {
        return { error: 'Eroare de conexiune la server.' };
    }
}

// Sesiune stocata in sessionStorage (se sterge la inchiderea browserului)
// Folosim sessionStorage doar ca cache al datelor userului, nu ca autentificare reala
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('floraria_current_user'));
}
function setCurrentUser(user) {
    if (user) {
        sessionStorage.setItem('floraria_current_user', JSON.stringify(user));
        // Pastram si in localStorage pentru compatibilitate cu cart.js, orders.js etc.
        localStorage.setItem('floraria_current_user', JSON.stringify(user));
    } else {
        sessionStorage.removeItem('floraria_current_user');
        localStorage.removeItem('floraria_current_user');
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const eye = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        if (eye) eye.classList.add('visible');
    } else {
        input.type = 'password';
        if (eye) eye.classList.remove('visible');
    }
}

// ── UI: afiseaza panoul corect ────────────────
const authFormsContainer = document.getElementById('auth-forms');
const loggedInPanel      = document.getElementById('logged-in-panel');
const welcomeMessage     = document.getElementById('welcome-message');
const displayName        = document.getElementById('display-name');
const displayEmail       = document.getElementById('display-email');

function toggleAuthInterface() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        if (authFormsContainer) authFormsContainer.style.display = 'none';
        if (loggedInPanel)      loggedInPanel.style.display = 'flex';
        if (welcomeMessage)     welcomeMessage.textContent = `Salut, ${currentUser.name}!`;
        if (displayName)        displayName.textContent = currentUser.name;
        if (displayEmail)       displayEmail.textContent = currentUser.email;
        setupProfileModals();
    } else {
        if (authFormsContainer) authFormsContainer.style.display = 'flex';
        if (loggedInPanel)      loggedInPanel.style.display = 'none';
    }
}

// ── Inregistrare ─────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Se proceseaza...';

        const data = {
            name:    document.getElementById('reg-name').value.trim(),
            email:   document.getElementById('reg-email').value.trim(),
            password:document.getElementById('reg-password').value.trim(),
            isAdmin: false
        };

        const res = await apiCall('register', 'POST', data);
        btn.disabled = false;
        btn.textContent = 'Inregistrare';

        if (res.error) {
            alert(res.error);
            return;
        }

        setCurrentUser(res.user);
        alert(`Contul a fost creat cu succes! Bine ai venit, ${res.user.name}!`);
        window.location.href = res.user.role === 'admin' ? 'admin.html' : 'index.html';
    });
}

// ── Autentificare ─────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Se verifica...';

        const data = {
            email:    document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value.trim()
        };

        const res = await apiCall('login', 'POST', data);
        btn.disabled = false;
        btn.textContent = 'Intra in cont';

        if (res.error) {
            alert(res.error);
            return;
        }

        setCurrentUser(res.user);
        alert(`Bine ai revenit, ${res.user.name}!`);
        window.location.href = 'index.html';
    });
}

// ── Deconectare ───────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        setCurrentUser(null);
        alert('Te-ai deconectat cu succes.');
        window.location.href = 'index.html';
    });
}

// ── Stergere cont ─────────────────────────────
const deleteAccountBtn = document.getElementById('delete-account-btn');
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const confirmFirst = confirm('Esti absolut sigur ca vrei sa iti stergi contul? Aceasta actiune este ireversibila!');
        if (!confirmFirst) return;

        const confirmText = prompt("Pentru confirmare finala, scrie cuvantul 'STERGE':");
        if (confirmText !== 'STERGE' && confirmText !== 'sterge') {
            if (confirmText !== null) alert('Confirmare respinsa. Textul introdus este gresit.');
            return;
        }

        const res = await apiCall('delete', 'DELETE', { id: currentUser.id });
        if (res.error) { alert(res.error); return; }

        setCurrentUser(null);
        alert('Contul tau a fost eliminat definitiv.');
        window.location.href = 'index.html';
    });
}

// ── Modificare date cont ──────────────────────
function setupProfileModals() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const btnName  = document.getElementById('open-modal-name');
    const btnEmail = document.getElementById('open-modal-email');
    const btnPass  = document.getElementById('open-modal-password');

    if (btnName) {
        btnName.onclick = async () => {
            const newName = prompt('Introdu noul tau nume complet:', currentUser.name);
            if (!newName || !newName.trim()) return;
            const res = await apiCall('update', 'POST', { id: currentUser.id, key: 'name', value: newName.trim() });
            if (res.error) { alert(res.error); return; }
            setCurrentUser(res.user);
            toggleAuthInterface();
        };
    }

    if (btnEmail) {
        btnEmail.onclick = async () => {
            const newEmail = prompt('Introdu noua adresa de email:', currentUser.email);
            if (!newEmail || !newEmail.trim()) return;
            const res = await apiCall('update', 'POST', { id: currentUser.id, key: 'email', value: newEmail.trim() });
            if (res.error) { alert(res.error); return; }
            setCurrentUser(res.user);
            toggleAuthInterface();
        };
    }

    if (btnPass) {
        btnPass.onclick = async () => {
            const oldPass = prompt('Introdu parola curenta pentru verificare:');
            if (oldPass === null) return;

            const checkRes = await apiCall('check_password', 'POST', { id: currentUser.id, password: oldPass });
            if (checkRes.error) { alert(checkRes.error); return; }

            const newPass = prompt('Introdu noua parola dorita (minim 4 caractere):');
            if (!newPass || newPass.trim().length < 4) {
                alert('Parola este prea scurta (minim 4 caractere).');
                return;
            }
            const res = await apiCall('update', 'POST', { id: currentUser.id, key: 'password', value: newPass.trim() });
            if (res.error) { alert(res.error); return; }
            alert('Parola a fost modificata cu succes!');
        };
    }
}

toggleAuthInterface();
