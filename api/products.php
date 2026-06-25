<?php
// =============================================
// api/products.php — CRUD produse
// =============================================
require_once 'config.php';
require_once 'validate_image.php';
if ($method === 'GET' && $action === 'all') {
    requireAdmin();
    $result   = $db->query("SELECT * FROM products ORDER BY id ASC");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row['active'] = (bool)$row['active'];
        $products[] = $row;
    }
    echo json_encode($products);
    exit();
}

// ── GET: produse active (public) ──────────────
if ($method === 'GET' && ($action === 'active' || $action === '')) {
    $result   = $db->query("SELECT * FROM products WHERE active = 1 ORDER BY id ASC");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row['active'] = true;
        $products[] = $row;
    }
    echo json_encode($products);
    exit();
}

// ── GET: produs dupa nume (public) ────────────
if ($method === 'GET' && $action === 'by_name') {
    $name = $_GET['name'] ?? '';
    $stmt = $db->prepare("SELECT * FROM products WHERE name = ? AND active = 1");
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

// ── POST: adauga produs — DOAR ADMIN ──────────
if ($method === 'POST' && $action === 'add') {
    requireAdmin();
    $data  = json_decode(file_get_contents('php://input'), true);
    $name  = trim($data['name'] ?? '');
    $price = intval($data['price'] ?? 0);
    $disc  = max(0, min(100, intval($data['discount'] ?? 0)));
    $desc  = trim($data['desc'] ?? '');
    $image = $data['image'] ?? null;

    if (!$name || !$price) {
        echo json_encode(['error' => 'Numele si pretul sunt obligatorii.']);
        exit();
    }
    if (strlen($name) > 200) { echo json_encode(['error' => 'Numele produsului este prea lung.']); exit(); }
    if (strlen($desc) > 2000) { echo json_encode(['error' => 'Descrierea este prea lunga (max 2000 caractere).']); exit(); }

    // Validare imagine daca e trimisa
    if ($image && $image !== 'Imagini/blank_image.jpg') {
        $imgCheck = validateBase64Image($image);
        if (!$imgCheck['valid']) {
            echo json_encode(['error' => $imgCheck['error']]);
            exit();
        }
    } else {
        $image = 'Imagini/blank_image.jpg';
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

// ── POST: editeaza produs — DOAR ADMIN ────────
if ($method === 'POST' && $action === 'edit') {
    requireAdmin();
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = intval($data['id'] ?? 0);
    $name  = trim($data['name'] ?? '');
    $price = intval($data['price'] ?? 0);
    $disc  = max(0, min(100, intval($data['discount'] ?? 0)));
    $desc  = trim($data['desc'] ?? '');
    $image = $data['image'] ?? null;

    if ($image) {
        $stmt = $db->prepare("UPDATE products SET name=?, price=?, discount=?, description=?, image=? WHERE id=?");
        $stmt->bind_param('siissi', $name, $price, $disc, $desc, $image, $id);
    } else {
        $stmt = $db->prepare("UPDATE products SET name=?, price=?, discount=?, description=? WHERE id=?");
        $stmt->bind_param('siisi', $name, $price, $disc, $desc, $id);
    }

    echo json_encode(['success' => $stmt->execute(), 'error' => $stmt->error ?: null]);
    exit();
}

// ── POST: toggle activ — DOAR ADMIN ───────────
if ($method === 'POST' && $action === 'toggle') {
    requireAdmin();
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $active = ($data['active'] ?? true) ? 1 : 0;

    $stmt = $db->prepare("UPDATE products SET active = ? WHERE id = ?");
    $stmt->bind_param('ii', $active, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge produs — DOAR ADMIN ────────
if ($method === 'DELETE' && $action === 'delete') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
