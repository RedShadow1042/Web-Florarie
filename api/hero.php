<?php
// =============================================
// api/hero.php — Hero Slides
// =============================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── GET: toate slide-urile (admin) ───────────
if ($method === 'GET' && $action === 'all') {
    $result = $db->query("SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC");
    $slides = [];
    while ($row = $result->fetch_assoc()) {
        $row['active'] = (bool)$row['active'];
        $slides[] = $row;
    }
    echo json_encode($slides);
    exit();
}

// ── GET: doar cele active (pentru site) ──────
if ($method === 'GET' && ($action === 'active' || $action === '')) {
    $result = $db->query("SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC, id ASC");
    $slides = [];
    while ($row = $result->fetch_assoc()) {
        $row['active'] = true;
        $slides[] = $row;
    }
    echo json_encode($slides);
    exit();
}

// ── POST: adauga slide ───────────────────────
if ($method === 'POST' && $action === 'add') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $title    = $data['title']    ?? '';
    $subtitle = $data['subtitle'] ?? '';
    $btnText  = $data['btnText']  ?? '';
    $btnLink  = $data['btnLink']  ?? '';
    $bg       = $data['bg']       ?? '#f5ebe1';
    $bgImage  = $data['bgImage']  ?? null;
    $posX     = intval($data['posX'] ?? 50);
    $posY     = intval($data['posY'] ?? 50);
    $gradDir  = $data['gradDir']  ?? 'to right';
    $gradStr  = intval($data['gradStr'] ?? 55);

    $maxOrder = $db->query("SELECT MAX(sort_order) as m FROM hero_slides")->fetch_assoc()['m'] ?? 0;
    $order    = intval($maxOrder) + 1;

    $stmt = $db->prepare("
        INSERT INTO hero_slides
            (title, subtitle, btn_text, btn_link, bg, bg_image,
             pos_x, pos_y, grad_dir, grad_str, active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ");
    $stmt->bind_param(
        'ssssssiisii',
        $title, $subtitle, $btnText, $btnLink, $bg, $bgImage,
        $posX, $posY, $gradDir, $gradStr, $order
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        echo json_encode(['error' => 'Eroare la adaugare: ' . $db->error]);
    }
    exit();
}

// ── POST: editeaza slide ─────────────────────
if ($method === 'POST' && $action === 'edit') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $id       = intval($data['id']       ?? 0);
    $title    = $data['title']    ?? '';
    $subtitle = $data['subtitle'] ?? '';
    $btnText  = $data['btnText']  ?? '';
    $btnLink  = $data['btnLink']  ?? '';
    $bg       = $data['bg']       ?? '#f5ebe1';
    $bgImage  = $data['bgImage']  ?? null;
    $posX     = intval($data['posX'] ?? 50);
    $posY     = intval($data['posY'] ?? 50);
    $gradDir  = $data['gradDir']  ?? 'to right';
    $gradStr  = intval($data['gradStr'] ?? 55);

    $stmt = $db->prepare("
        UPDATE hero_slides SET
            title=?, subtitle=?, btn_text=?, btn_link=?, bg=?, bg_image=?,
            pos_x=?, pos_y=?, grad_dir=?, grad_str=?
        WHERE id=?
    ");
    $stmt->bind_param(
        'ssssssiisii',
        $title, $subtitle, $btnText, $btnLink, $bg, $bgImage,
        $posX, $posY, $gradDir, $gradStr, $id
    );

    echo json_encode(['success' => $stmt->execute(), 'error' => $stmt->error ?: null]);
    exit();
}

// ── POST: toggle activ/inactiv ───────────────
if ($method === 'POST' && $action === 'toggle') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $active = ($data['active'] ?? true) ? 1 : 0;

    $stmt = $db->prepare("UPDATE hero_slides SET active = ? WHERE id = ?");
    $stmt->bind_param('ii', $active, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

// ── POST: reordoneaza (sus/jos) ──────────────
if ($method === 'POST' && $action === 'reorder') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $id    = intval($data['id'] ?? 0);
    $dir   = $data['direction'] ?? 'up';

    $current = $db->query("SELECT sort_order FROM hero_slides WHERE id = $id")->fetch_assoc();
    if (!$current) { echo json_encode(['error' => 'Slide negasit.']); exit(); }

    $curOrder = intval($current['sort_order']);
    $compare  = $dir === 'up' ? '<' : '>';
    $sortDir  = $dir === 'up' ? 'DESC' : 'ASC';

    $neighbor = $db->query("SELECT id, sort_order FROM hero_slides WHERE sort_order $compare $curOrder ORDER BY sort_order $sortDir LIMIT 1")->fetch_assoc();

    if ($neighbor) {
        $nid  = intval($neighbor['id']);
        $nOrd = intval($neighbor['sort_order']);
        $db->query("UPDATE hero_slides SET sort_order = $nOrd WHERE id = $id");
        $db->query("UPDATE hero_slides SET sort_order = $curOrder WHERE id = $nid");
    }

    echo json_encode(['success' => true]);
    exit();
}

// ── DELETE: sterge slide ─────────────────────
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM hero_slides WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit();
}

echo json_encode(['error' => 'Actiune necunoscuta.']);