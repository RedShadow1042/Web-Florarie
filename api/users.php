<?php
// =============================================
// api/users.php — Register / Login / Update / Delete
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$db = getDB();

// ── GET: date utilizator curent ──────────────
if ($method === 'GET' && $action === 'get') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    echo $user ? json_encode($user) : json_encode(['error' => 'Utilizatorul nu a fost gasit.']);
    exit();
}

// ── POST: inregistrare ───────────────────────
if ($method === 'POST' && $action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name     = trim($data['name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');
    $role     = ($data['isAdmin'] ?? false) ? 'admin' : 'customer';

    if (!$name || !$email || !$password) {
        echo json_encode(['error' => 'Toate campurile sunt obligatorii.']);
        exit();
    }

    // Verificam daca emailul exista deja
    $check = $db->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param('s', $email);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        echo json_encode(['error' => 'Acest email este deja inregistrat!']);
        exit();
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $name, $email, $hashed, $role);

    if ($stmt->execute()) {
        $newUser = ['id' => $db->insert_id, 'name' => $name, 'email' => $email, 'role' => $role];
        echo json_encode(['success' => true, 'user' => $newUser]);
    } else {
        echo json_encode(['error' => 'Eroare la inregistrare.']);
    }
    exit();
}

// ── POST: autentificare ──────────────────────
if ($method === 'POST' && $action === 'login') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $email    = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    $stmt = $db->prepare("SELECT id, name, email, role, password FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['error' => 'Email sau parola incorecta!']);
        exit();
    }

    unset($user['password']);
    echo json_encode(['success' => true, 'user' => $user]);
    exit();
}

// ── POST: actualizare date cont ──────────────
if ($method === 'POST' && $action === 'update') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = intval($data['id'] ?? 0);
    $key   = $data['key'] ?? '';
    $value = trim($data['value'] ?? '');

    $allowed = ['name', 'email', 'password'];
    if (!in_array($key, $allowed)) {
        echo json_encode(['error' => 'Camp invalid.']);
        exit();
    }

    if ($key === 'email') {
        $check = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $check->bind_param('si', $value, $id);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(['error' => 'Acest email este deja folosit de alt cont!']);
            exit();
        }
    }

    if ($key === 'password') {
        $value = password_hash($value, PASSWORD_DEFAULT);
    }

    $stmt = $db->prepare("UPDATE users SET `$key` = ? WHERE id = ?");
    $stmt->bind_param('si', $value, $id);

    if ($stmt->execute()) {
        // Returnam datele actualizate
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

// ── POST: verificare parola curenta ─────────
if ($method === 'POST' && $action === 'check_password') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $id       = intval($data['id'] ?? 0);
    $password = $data['password'] ?? '';

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if ($row && password_verify($password, $row['password'])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Parola curenta este incorecta!']);
    }
    exit();
}

// ── DELETE: stergere cont ────────────────────
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Eroare la stergere.']);
    }
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
