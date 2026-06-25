<?php
// =============================================
// api/reviews.php — Reviews CRUD
// =============================================
require_once 'config.php';
require_once 'validate_image.php';
if ($method === 'GET' && $action === 'approved') {
    $type      = $_GET['type'] ?? '';
    $productId = intval($_GET['product_id'] ?? 0);

    $sql    = "SELECT * FROM reviews WHERE status = 'approved'";
    $params = [];
    $types  = '';

    if ($type === 'product' && $productId) {
        $sql     .= " AND type = 'product' AND product_id = ?";
        $params[] = $productId;
        $types   .= 'i';
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

// ── GET: toate review-urile — DOAR ADMIN ──────
if ($method === 'GET' && $action === 'all') {
    requireAdmin();
    $result  = $db->query("SELECT * FROM reviews ORDER BY created_at DESC");
    $reviews = [];
    while ($row = $result->fetch_assoc()) $reviews[] = $row;
    echo json_encode($reviews);
    exit();
}

// ── GET: review-urile utilizatorului logat ────
if ($method === 'GET' && $action === 'my') {
    requireAuth();
    $userId = sessionUserId();
    $stmt   = $db->prepare("SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result  = $stmt->get_result();
    $reviews = [];
    while ($row = $result->fetch_assoc()) $reviews[] = $row;
    echo json_encode($reviews);
    exit();
}

// ── GET: rating mediu produs (public) ─────────
if ($method === 'GET' && $action === 'rating') {
    $productId = intval($_GET['product_id'] ?? 0);
    $stmt = $db->prepare("SELECT rating, COUNT(*) as cnt FROM reviews WHERE product_id = ? AND status = 'approved' GROUP BY rating");
    $stmt->bind_param('i', $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    $dist  = [1=>0, 2=>0, 3=>0, 4=>0, 5=>0];
    $total = 0; $sum = 0;
    while ($row = $result->fetch_assoc()) {
        $r = intval($row['rating']); $c = intval($row['cnt']);
        $dist[$r] = $c; $total += $c; $sum += $r * $c;
    }
    echo json_encode(['avg' => $total > 0 ? round($sum / $total, 1) : null, 'count' => $total, 'dist' => $dist]);
    exit();
}

// ── POST: adauga review — utilizator logat ────
if ($method === 'POST' && $action === 'add') {
    requireAuth();
    $data      = json_decode(file_get_contents('php://input'), true);
    // ID-ul vine din sesiune, nu din request (nu poate fi falsificat)
    $userId    = sessionUserId();
    $userName  = trim($data['user_name'] ?? '');
    $type      = in_array($data['type'] ?? '', ['general','product']) ? $data['type'] : 'general';
    $productId = ($type === 'product' && !empty($data['product_id'])) ? intval($data['product_id']) : null;
    $prodName  = trim($data['product_name'] ?? '');
    $title     = trim($data['title'] ?? '');
    $body      = trim($data['body'] ?? '');
    $rating    = max(1, min(5, intval($data['rating'] ?? 5)));
    $image     = $data['image'] ?? null;
    $tags      = isset($data['tags']) && is_array($data['tags']) ? implode(',', array_map('trim', $data['tags'])) : '';

    if (!$title || !$body) {
        echo json_encode(['error' => 'Titlul si textul review-ului sunt obligatorii.']);
        exit();
    }
    if (strlen($title) > 200)  { echo json_encode(['error' => 'Titlul este prea lung (max 200 caractere).']); exit(); }
    if (strlen($body)  > 3000) { echo json_encode(['error' => 'Recenzia este prea lunga (max 3000 caractere).']); exit(); }

    // Validare imagine daca e trimisa
    if ($image) {
        $imgCheck = validateBase64Image($image);
        if (!$imgCheck['valid']) {
            echo json_encode(['error' => $imgCheck['error']]);
            exit();
        }
    }

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

// ── POST: schimba status review — DOAR ADMIN ──
if ($method === 'POST' && $action === 'status') {
    requireAdmin();
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $status = in_array($data['status'] ?? '', ['pending','approved','rejected']) ? $data['status'] : 'pending';

    $stmt = $db->prepare("UPDATE reviews SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── DELETE: sterge propriul review ────────────
if ($method === 'DELETE' && $action === 'delete_own') {
    requireAuth();
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $userId = sessionUserId(); // Din sesiune, nu din request

    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $userId);
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Nu ai permisiunea sa stergi acest review.']);
    }
    exit();
}

// ── DELETE: sterge orice review — DOAR ADMIN ──
if ($method === 'DELETE' && $action === 'delete') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);
