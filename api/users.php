<?php
// =============================================
// api/users.php — Register / Login / Update / Delete
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── GET: verifica daca sesiunea curenta este admin ───
// Folosit de admin.html pentru verificare server-side la incarcare
if ($method === 'GET' && $action === 'check_admin') {
    echo json_encode([
        'isAdmin' => !empty($_SESSION['user_id']) && ($_SESSION['user_role'] ?? '') === 'admin'
    ]);
    exit();
}

// ── GET: date utilizator ──────────────────────
if ($method === 'GET' && $action === 'get') {
    requireAuth();
    // Un utilizator poate vedea doar propriile date
    $id = intval($_GET['id'] ?? 0);
    if ($id !== sessionUserId()) {
        http_response_code(403);
        echo json_encode(['error' => 'Acces interzis.']);
        exit();
    }
    $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    echo $user ? json_encode($user) : json_encode(['error' => 'Utilizatorul nu a fost gasit.']);
    exit();
}

// ── POST: inregistrare ────────────────────────
if ($method === 'POST' && $action === 'register') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $name     = trim($data['name'] ?? '');
    $email    = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    if (!$name || !$email || !$password) {
        echo json_encode(['error' => 'Toate campurile sunt obligatorii.']);
        exit();
    }
    if (strlen($password) < 6) {
        echo json_encode(['error' => 'Parola trebuie sa aiba cel putin 6 caractere.']);
        exit();
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['error' => 'Adresa de email nu este valida.']);
        exit();
    }

    // Rolul este INTOTDEAUNA customer — ignoram orice trimite clientul
    $role = 'customer';

    $check = $db->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param('s', $email);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        echo json_encode(['error' => 'Acest email este deja inregistrat!']);
        exit();
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt   = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $name, $email, $hashed, $role);

    if ($stmt->execute()) {
        $userId  = $db->insert_id;
        $newUser = ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => $role];

        // Pornim sesiunea imediat dupa inregistrare
        session_regenerate_id(true);
        $_SESSION['user_id']   = $userId;
        $_SESSION['user_role'] = $role;
        $_SESSION['user_email']= $email;

        echo json_encode(['success' => true, 'user' => $newUser]);
    } else {
        echo json_encode(['error' => 'Eroare la inregistrare.']);
    }
    exit();
}

// ── POST: autentificare ───────────────────────
if ($method === 'POST' && $action === 'login') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $email    = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $ip       = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ip       = trim(explode(',', $ip)[0]); // primul IP daca e lista

    // ── Rate limiting: max 5 incercari / 15 minute per IP si email ──
    $window  = date('Y-m-d H:i:s', strtotime('-15 minutes'));

    $chkIp = $db->prepare("SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND attempted_at > ?");
    $chkIp->bind_param('ss', $ip, $window);
    $chkIp->execute();
    $ipCount = $chkIp->get_result()->fetch_assoc()['cnt'];

    $chkEmail = $db->prepare("SELECT COUNT(*) as cnt FROM login_attempts WHERE email = ? AND attempted_at > ?");
    $chkEmail->bind_param('ss', $email, $window);
    $chkEmail->execute();
    $emailCount = $chkEmail->get_result()->fetch_assoc()['cnt'];

    if ($ipCount >= 5 || $emailCount >= 5) {
        http_response_code(429);
        echo json_encode(['error' => 'Prea multe incercari. Incearca din nou dupa 15 minute.']);
        exit();
    }

    $stmt = $db->prepare("SELECT id, name, email, role, password FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        // Inregistram incercarea esuata
        $ins = $db->prepare("INSERT INTO login_attempts (ip, email) VALUES (?, ?)");
        $ins->bind_param('ss', $ip, $email);
        $ins->execute();

        http_response_code(401);
        echo json_encode(['error' => 'Email sau parola incorecta!']);
        exit();
    }

    // Login reusit — stergem incercarile anterioare ale acestui email
    $del = $db->prepare("DELETE FROM login_attempts WHERE email = ? OR ip = ?");
    $del->bind_param('ss', $email, $ip);
    $del->execute();

    session_regenerate_id(true);
    $_SESSION['user_id']    = $user['id'];
    $_SESSION['user_role']  = $user['role'];
    $_SESSION['user_email'] = $user['email'];

    unset($user['password']);
    echo json_encode(['success' => true, 'user' => $user]);
    exit();
}

// ── POST: deconectare ─────────────────────────
if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['success' => true]);
    exit();
}

// ── POST: actualizare date cont ───────────────
if ($method === 'POST' && $action === 'update') {
    requireAuth();
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = intval($data['id'] ?? 0);
    $key   = $data['key'] ?? '';
    $value = trim($data['value'] ?? '');

    // Un utilizator poate modifica DOAR propriul cont
    if ($id !== sessionUserId()) {
        http_response_code(403);
        echo json_encode(['error' => 'Acces interzis.']);
        exit();
    }

    $allowed = ['name', 'email', 'password'];
    if (!in_array($key, $allowed)) {
        echo json_encode(['error' => 'Camp invalid.']);
        exit();
    }

    if ($key === 'email') {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['error' => 'Email invalid.']);
            exit();
        }
        $check = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $check->bind_param('si', $value, $id);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(['error' => 'Acest email este deja folosit!']);
            exit();
        }
    }

    if ($key === 'password') {
        if (strlen($value) < 6) {
            echo json_encode(['error' => 'Parola prea scurta (minim 6 caractere).']);
            exit();
        }
        $value = password_hash($value, PASSWORD_DEFAULT);
    }

    // Folosim un whitelist pentru numele coloanei (previne SQL injection)
    $columnMap = ['name' => 'name', 'email' => 'email', 'password' => 'password'];
    $column    = $columnMap[$key];

    $stmt = $db->prepare("UPDATE users SET `$column` = ? WHERE id = ?");
    $stmt->bind_param('si', $value, $id);

    if ($stmt->execute()) {
        $fetch = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $fetch->bind_param('i', $id);
        $fetch->execute();
        $updated = $fetch->get_result()->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $updated]);
    } else {
        echo json_encode(['error' => 'Eroare la actualizare.']);
    }
    exit();
}

// ── POST: verificare parola curenta ──────────
if ($method === 'POST' && $action === 'check_password') {
    requireAuth();
    $data     = json_decode(file_get_contents('php://input'), true);
    $id       = intval($data['id'] ?? 0);
    $password = $data['password'] ?? '';

    // Poate verifica doar propria parola
    if ($id !== sessionUserId()) {
        http_response_code(403);
        echo json_encode(['error' => 'Acces interzis.']);
        exit();
    }

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    echo ($row && password_verify($password, $row['password']))
        ? json_encode(['success' => true])
        : json_encode(['error' => 'Parola curenta este incorecta!']);
    exit();
}

// ── DELETE: stergere cont ─────────────────────
if ($method === 'DELETE' && $action === 'delete') {
    requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    // Poate sterge doar propriul cont
    if ($id !== sessionUserId()) {
        http_response_code(403);
        echo json_encode(['error' => 'Acces interzis.']);
        exit();
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        // Distrugem si sesiunea
        $_SESSION = [];
        session_destroy();
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Eroare la stergere.']);
    }
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
