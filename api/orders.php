<?php
// =============================================
// api/orders.php — Comenzi
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── GET: toate comenzile — DOAR ADMIN ────────
if ($method === 'GET' && $action === 'all') {
    requireAdmin();
    $result = $db->query("SELECT * FROM orders ORDER BY created_at DESC");
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $row['items'] = json_decode($row['items'], true);
        $orders[] = $row;
    }
    echo json_encode($orders);
    exit();
}

// ── GET: comenzile utilizatorului logat ───────
if ($method === 'GET' && $action === 'my') {
    requireAuth();
    // Luam emailul din sesiune, nu din GET (nu poate fi falsificat)
    $email = $_SESSION['user_email'] ?? '';
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

// ── POST: plaseaza comanda — utilizator logat ─
if ($method === 'POST' && $action === 'place') {
    requireAuth();
    $data   = json_decode(file_get_contents('php://input'), true);
    $uid    = sessionUserId();
    $cname  = trim($data['customer_name'] ?? '');
    $cemail = $_SESSION['user_email'] ?? '';

    if (!$cname || empty($data['items']) || !is_array($data['items'])) {
        echo json_encode(['error' => 'Date incomplete pentru comanda.']);
        exit();
    }

    // ── Recalculam totalul din preturile REALE din DB ──
    // Ignoram complet totalul trimis de client — nu poate fi falsificat
    $recalcTotal    = 0;
    $validatedItems = [];

    foreach ($data['items'] as $item) {
        $pid = intval($item['id'] ?? 0);
        if (!$pid) continue;

        $pstmt = $db->prepare("SELECT name, price, discount FROM products WHERE id = ? AND active = 1");
        $pstmt->bind_param('i', $pid);
        $pstmt->execute();
        $prod = $pstmt->get_result()->fetch_assoc();

        if (!$prod) continue; // produs inexistent sau dezactivat — sarim

        $basePrice  = intval($prod['price']);
        $disc       = max(0, min(100, intval($prod['discount'])));
        $finalPrice = $disc > 0 ? intval(round($basePrice * (1 - $disc / 100))) : $basePrice;

        $recalcTotal += $finalPrice;
        $validatedItems[] = [
            'id'    => $pid,
            'name'  => $prod['name'],
            'price' => $finalPrice
        ];
    }

    if (empty($validatedItems)) {
        echo json_encode(['error' => 'Niciun produs valid in comanda.']);
        exit();
    }

    $id    = 'CMD-' . time() . rand(100, 999);
    $items = json_encode($validatedItems);
    $date  = date('d.m.Y H:i:s');

    $stmt = $db->prepare("INSERT INTO orders (id, user_id, customer_name, customer_email, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)");
    $stmt->bind_param('sisssis', $id, $uid, $cname, $cemail, $items, $recalcTotal, $date);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'order_id' => $id, 'total' => $recalcTotal]);
    } else {
        echo json_encode(['error' => 'Eroare la plasarea comenzii.']);
    }
    exit();
}

// ── POST: schimba status comanda — DOAR ADMIN ─
if ($method === 'POST' && $action === 'status') {
    requireAdmin();
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = $data['id'] ?? '';
    $status = in_array($data['status'] ?? '', ['active', 'completed']) ? $data['status'] : 'active';

    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->bind_param('ss', $status, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge comanda — DOAR ADMIN ───────
if ($method === 'DELETE' && $action === 'delete') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = $data['id'] ?? '';

    $stmt = $db->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->bind_param('s', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
