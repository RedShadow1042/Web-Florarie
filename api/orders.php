<?php
// =============================================
// api/orders.php — Comenzi
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── GET: toate comenzile (admin) ─────────────
if ($method === 'GET' && $action === 'all') {
    $result = $db->query("SELECT * FROM orders ORDER BY created_at DESC");
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $row['items'] = json_decode($row['items'], true);
        $orders[] = $row;
    }
    echo json_encode($orders);
    exit();
}

// ── GET: comenzile unui utilizator ───────────
if ($method === 'GET' && $action === 'my') {
    $email = $_GET['email'] ?? '';
    $stmt  = $db->prepare("SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $row['items'] = json_decode($row['items'], true);
        $orders[] = $row;
    }
    echo json_encode($orders);
    exit();
}

// ── POST: plaseaza comanda noua ───────────────
if ($method === 'POST' && $action === 'place') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = 'CMD-' . time() . rand(100, 999);
    $uid   = intval($data['user_id'] ?? 0);
    $cname = $data['customer_name'] ?? '';
    $cemail= $data['customer_email'] ?? '';
    $items = json_encode($data['items'] ?? []);
    $total = intval($data['total'] ?? 0);
    $date  = date('d.m.Y H:i:s');

    $stmt = $db->prepare("INSERT INTO orders (id, user_id, customer_name, customer_email, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)");
    $stmt->bind_param('sisssis', $id, $uid, $cname, $cemail, $items, $total, $date);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'order_id' => $id]);
    } else {
        echo json_encode(['error' => 'Eroare la plasarea comenzii.']);
    }
    exit();
}

// ── POST: schimba statusul comenzii (admin) ──
if ($method === 'POST' && $action === 'status') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = $data['id'] ?? '';
    $status = $data['status'] ?? 'active';

    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->bind_param('ss', $status, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge comanda (admin) ───────────
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = $data['id'] ?? '';

    $stmt = $db->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->bind_param('s', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
