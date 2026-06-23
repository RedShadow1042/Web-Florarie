<?php
// Încărcăm configurația bazei de date
require_once 'config.php';
$db = getDB();

// Identificăm acțiunea și metoda
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// 1. GET: Returnează toate pozele (pentru afișare în galerie)
if ($action === 'all' && $method === 'GET') {
    $res = $db->query("SELECT * FROM gallery ORDER BY id DESC");
    $items = $res->fetch_all(MYSQLI_ASSOC);
    echo json_encode($items);
}

// 2. POST: Adaugă o poză nouă (folosit în admin)
elseif ($action === 'add' && $method === 'POST') {
    // Preluăm datele trimise prin JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Verificăm dacă am primit datele
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Date invalide trimise']);
        exit;
    }

    $image = $data['image'] ?? '';
    $title = $db->real_escape_string($data['title'] ?? 'Fără titlu');
    $made_by = $db->real_escape_string($data['made_by'] ?? 'Admin');

    if (empty($image)) {
        echo json_encode(['error' => 'Imaginea lipsește']);
        exit;
    }

    // Inserăm în baza de date
    $stmt = $db->prepare("INSERT INTO gallery (image, title, made_by) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $image, $title, $made_by);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        // Aici vei vedea eroarea în Network -> Response dacă ceva nu merge
        echo json_encode(['error' => 'Eroare SQL: ' . $stmt->error]);
    }
}

// 3. DELETE: Șterge o poză
elseif ($action === 'delete' && $method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM gallery WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Eroare la ștergere: ' . $stmt->error]);
    }
}

// Dacă metoda nu este recunoscută
else {
    http_response_code(405);
    echo json_encode(['error' => 'Metodă sau acțiune invalidă']);
}
?>