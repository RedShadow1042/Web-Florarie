<?php
// =============================================
// api/products.php — CRUD produse (buchete)
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── GET: toate produsele ─────────────────────
if ($method === 'GET' && $action === 'all') {
    $result = $db->query("SELECT * FROM products ORDER BY id ASC");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row['active'] = (bool)$row['active'];
        $products[] = $row;
    }
    echo json_encode($products);
    exit();
}

// ── GET: doar produsele active (pentru site) ─
if ($method === 'GET' && ($action === 'active' || $action === '')) {
    $result = $db->query("SELECT * FROM products WHERE active = 1 ORDER BY id ASC");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row['active'] = true;
        $products[] = $row;
    }
    echo json_encode($products);
    exit();
}

// ── GET: un produs dupa nume ─────────────────
if ($method === 'GET' && $action === 'by_name') {
    $name = $_GET['name'] ?? '';
    $stmt = $db->prepare("SELECT * FROM products WHERE name = ?");
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) {
        $row['active'] = (bool)$row['active'];
        echo json_encode($row);
    } else {
        echo json_encode(['error' => 'Produsul nu a fost gasit.']);
    }
    exit();
}

// ── POST: adauga produs ──────────────────────
if ($method === 'POST' && $action === 'add') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $name  = trim($data['name'] ?? '');
    $price = intval($data['price'] ?? 0);
    $disc  = intval($data['discount'] ?? 0);
    $desc  = trim($data['desc'] ?? '');
    $image = $data['image'] ?? 'Imagini/blank_image.jpg';

    if (!$name || !$price) {
        echo json_encode(['error' => 'Numele si pretul sunt obligatorii.']);
        exit();
    }

    $stmt = $db->prepare("INSERT INTO products (name, price, discount, description, image, active) VALUES (?, ?, ?, ?, ?, 1)");
    $stmt->bind_param('siiss', $name, $price, $disc, $desc, $image);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        echo json_encode(['error' => 'Eroare la adaugare.']);
    }
    exit();
}

// ── POST: editeaza produs ────────────────────
if ($method === 'POST' && $action === 'edit') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = intval($data['id'] ?? 0);
    $name  = trim($data['name'] ?? '');
    $price = intval($data['price'] ?? 0);
    $disc  = intval($data['discount'] ?? 0);
    $desc  = trim($data['desc'] ?? '');
    $image = $data['image'] ?? null;

    if ($image) {
        $stmt = $db->prepare("UPDATE products SET name=?, price=?, discount=?, description=?, image=? WHERE id=?");
        $stmt->bind_param('siissi', $name, $price, $disc, $desc, $image, $id);
    } else {
        $stmt = $db->prepare("UPDATE products SET name=?, price=?, discount=?, description=? WHERE id=?");
        $stmt->bind_param('siisi', $name, $price, $disc, $desc, $id);
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Eroare la editare.']);
    }
    exit();
}

// ── POST: toggle activ/inactiv ───────────────
if ($method === 'POST' && $action === 'toggle') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $active = ($data['active'] ?? true) ? 1 : 0;

    $stmt = $db->prepare("UPDATE products SET active = ? WHERE id = ?");
    $stmt->bind_param('ii', $active, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge produs ────────────────────
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
