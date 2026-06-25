<?php
// =============================================
// api/gallery.php — Galerie
// =============================================
require_once 'config.php';
require_once 'validate_image.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET: toate pozele (public) ────────────────
if ($action === 'all' && $method === 'GET') {
    $res   = $db->query("SELECT * FROM gallery ORDER BY id DESC");
    $items = $res->fetch_all(MYSQLI_ASSOC);
    echo json_encode($items);
    exit();
}

// ── POST: adauga poza — DOAR ADMIN ────────────
if ($action === 'add' && $method === 'POST') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Date invalide.']);
        exit();
    }

    $image   = $data['image'] ?? '';
    $title   = trim($data['title'] ?? 'Fara titlu');
    $made_by = trim($data['made_by'] ?? 'Admin');

    if (empty($image)) {
        echo json_encode(['error' => 'Imaginea lipseste.']);
        exit();
    }

    // Validare imagine
    $imgCheck = validateBase64Image($image);
    if (!$imgCheck['valid']) {
        echo json_encode(['error' => $imgCheck['error']]);
        exit();
    }

    if (strlen($title) > 200)   { echo json_encode(['error' => 'Titlul este prea lung.']); exit(); }
    if (strlen($made_by) > 100) { echo json_encode(['error' => 'Numele autorului este prea lung.']); exit(); }

    $stmt = $db->prepare("INSERT INTO gallery (image, title, made_by) VALUES (?, ?, ?)");
    $stmt->bind_param('sss', $image, $title, $made_by);

    echo $stmt->execute()
        ? json_encode(['success' => true])
        : json_encode(['error' => 'Eroare SQL: ' . $stmt->error]);
    exit();
}

// ── DELETE: sterge poza — DOAR ADMIN ──────────
if ($action === 'delete' && $method === 'DELETE') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM gallery WHERE id = ?");
    $stmt->bind_param('i', $id);

    echo $stmt->execute()
        ? json_encode(['success' => true])
        : json_encode(['error' => 'Eroare la stergere.']);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Metoda sau actiune invalida.']);
