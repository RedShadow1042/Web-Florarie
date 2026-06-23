<?php
// =============================================
// api/reviews.php — Reviews CRUD
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── GET: toate review-urile aprobate (public) ─
if ($method === 'GET' && $action === 'approved') {
    $type      = $_GET['type'] ?? '';        // 'general' | 'product' | ''
    $productId = $_GET['product_id'] ?? '';

    $sql    = "SELECT * FROM reviews WHERE status = 'approved'";
    $params = [];
    $types  = '';

    if ($type === 'product' && $productId) {
        $sql    .= " AND type = 'product' AND product_id = ?";
        $params[]= intval($productId);
        $types  .= 'i';
    } elseif ($type === 'general') {
        $sql .= " AND type = 'general'";
    } elseif ($type === 'product') {
        $sql .= " AND type = 'product'";
    }

    $sql .= " ORDER BY created_at DESC";

    if ($params) {
        $stmt = $db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $db->query($sql);
    }

    $reviews = [];
    while ($row = $result->fetch_assoc()) $reviews[] = $row;
    echo json_encode($reviews);
    exit();
}

// ── GET: toate review-urile (admin) ──────────
if ($method === 'GET' && $action === 'all') {
    $result  = $db->query("SELECT * FROM reviews ORDER BY created_at DESC");
    $reviews = [];
    while ($row = $result->fetch_assoc()) $reviews[] = $row;
    echo json_encode($reviews);
    exit();
}

// ── GET: review-urile unui utilizator ────────
if ($method === 'GET' && $action === 'my') {
    $userId = intval($_GET['user_id'] ?? 0);
    $stmt   = $db->prepare("SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result  = $stmt->get_result();
    $reviews = [];
    while ($row = $result->fetch_assoc()) $reviews[] = $row;
    echo json_encode($reviews);
    exit();
}

// ── GET: rating mediu produs ──────────────────
if ($method === 'GET' && $action === 'rating') {
    $productId = intval($_GET['product_id'] ?? 0);
    
    $stmt = $db->prepare("SELECT rating, COUNT(*) as cnt FROM reviews WHERE product_id = ? AND status = 'approved' GROUP BY rating");
    $stmt->bind_param('i', $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $dist  = [1=>0, 2=>0, 3=>0, 4=>0, 5=>0];
    $total = 0;
    $sum   = 0;
    while ($row = $result->fetch_assoc()) {
        $r = intval($row['rating']);
        $c = intval($row['cnt']);
        $dist[$r] = $c;
        $total   += $c;
        $sum     += $r * $c;
    }
    
    echo json_encode([
        'avg'   => $total > 0 ? round($sum / $total, 1) : null,
        'count' => $total,
        'dist'  => $dist
    ]);
    exit();
}

// ── POST: adauga review ───────────────────────
if ($method === 'POST' && $action === 'add') {
    $data      = json_decode(file_get_contents('php://input'), true);
    $userId    = intval($data['user_id'] ?? 0);
    $userName  = trim($data['user_name'] ?? '');
    $type      = in_array($data['type'] ?? '', ['general','product']) ? $data['type'] : 'general';
    $productId = ($type === 'product' && !empty($data['product_id'])) ? intval($data['product_id']) : null;
    $prodName  = trim($data['product_name'] ?? '');

    // Daca product_name nu vine din JS, il luam din DB
    if ($type === 'product' && $productId && !$prodName) {
        $prow = $db->query("SELECT name FROM products WHERE id = $productId")->fetch_assoc();
        if ($prow) $prodName = $prow['name'];
    }
    $title     = trim($data['title'] ?? '');
    $body      = trim($data['body'] ?? '');
    $rating    = max(1, min(5, intval($data['rating'] ?? 5)));
    $image     = $data['image'] ?? null;
    $tags      = isset($data['tags']) && is_array($data['tags']) ? implode(',', array_map('trim', $data['tags'])) : '';

    if (!$userId || !$title || !$body) {
        echo json_encode(['error' => 'Titlul si textul review-ului sunt obligatorii.']);
        exit();
    }

    // Un user poate lasa un singur review per produs
    if ($type === 'product' && $productId) {
        $check = $db->prepare("SELECT id FROM reviews WHERE user_id = ? AND product_id = ?");
        $check->bind_param('ii', $userId, $productId);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(['error' => 'Ai lasat deja un review pentru acest produs.']);
            exit();
        }
    }

    $stmt = $db->prepare("INSERT INTO reviews (user_id, user_name, type, product_id, product_name, title, body, rating, image, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->bind_param('issiississ', $userId, $userName, $type, $productId, $prodName, $title, $body, $rating, $image, $tags);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Review trimis! Va fi vizibil dupa aprobare.']);
    } else {
        echo json_encode(['error' => 'Eroare la salvarea review-ului.']);
    }
    exit();
}

// ── POST: schimba status review (admin) ───────
if ($method === 'POST' && $action === 'status') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $status = in_array($data['status'] ?? '', ['pending','approved','rejected']) ? $data['status'] : 'pending';

    $stmt = $db->prepare("UPDATE reviews SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge propriul review (user) ─────
if ($method === 'DELETE' && $action === 'delete_own') {
    $data    = json_decode(file_get_contents('php://input'), true);
    $id      = intval($data['id'] ?? 0);
    $user_id = intval($data['user_id'] ?? 0);

    // Verificam ca review-ul apartine userului
    $check = $db->prepare("SELECT id FROM reviews WHERE id = ? AND user_id = ?");
    $check->bind_param('ii', $id, $user_id);
    $check->execute();
    if ($check->get_result()->num_rows === 0) {
        echo json_encode(['error' => 'Nu ai permisiunea sa stergi acest review.']);
        exit();
    }

    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $user_id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge review (admin) ─────────────
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge propriul review (user) ─────
if ($method === 'DELETE' && $action === 'delete_own') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $userId = intval($data['user_id'] ?? 0);
    // Verificam ca review-ul apartine userului
    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $userId);
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Nu ai permisiunea sa stergi acest review.']);
    }
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);