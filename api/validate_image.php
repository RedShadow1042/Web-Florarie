<?php
// =============================================
// api/validate_image.php — Validare imagini base64
// Include acest fisier in orice endpoint care accepta imagini
// =============================================

define('MAX_IMAGE_SIZE_BYTES', 2 * 1024 * 1024); // 2MB
define('ALLOWED_MIME_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Magic bytes pentru fiecare format de imagine
define('IMAGE_SIGNATURES', [
    'image/jpeg' => ["\xFF\xD8\xFF"],
    'image/png'  => ["\x89PNG\r\n\x1a\n"],
    'image/webp' => ["RIFF"],   // verificam si 'WEBP' la offset 8
    'image/gif'  => ["GIF87a", "GIF89a"],
]);

/**
 * Valideaza o imagine base64.
 * Returneaza ['valid' => true, 'data' => $base64String]
 * sau       ['valid' => false, 'error' => 'mesaj']
 */
function validateBase64Image($input) {
    if (empty($input)) {
        return ['valid' => false, 'error' => 'Imaginea lipseste.'];
    }

    // Acceptam doar data URI (data:image/...;base64,...)
    if (!preg_match('/^data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+\/=]+)$/', $input, $matches)) {
        return ['valid' => false, 'error' => 'Format imagine invalid.'];
    }

    $declaredMime = strtolower($matches[1]);
    $base64Data   = $matches[2];

    // Verificam ca tipul declarat e permis
    if (!in_array($declaredMime, ALLOWED_MIME_TYPES)) {
        return ['valid' => false, 'error' => 'Tip fisier nepermis. Acceptam: JPG, PNG, WebP, GIF.'];
    }

    // Decodam si verificam marimea
    $decoded = base64_decode($base64Data, true);
    if ($decoded === false) {
        return ['valid' => false, 'error' => 'Date base64 invalide.'];
    }

    if (strlen($decoded) > MAX_IMAGE_SIZE_BYTES) {
        $mb = round(strlen($decoded) / 1024 / 1024, 1);
        return ['valid' => false, 'error' => "Imaginea este prea mare ({$mb}MB). Maxim 2MB."];
    }

    // Verificam magic bytes — tipul real trebuie sa coincida cu cel declarat
    $signatures = IMAGE_SIGNATURES[$declaredMime] ?? [];
    $matched    = false;
    foreach ($signatures as $sig) {
        if (substr($decoded, 0, strlen($sig)) === $sig) {
            $matched = true;
            break;
        }
    }
    // Caz special WebP: bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
    if ($declaredMime === 'image/webp') {
        $matched = (substr($decoded, 0, 4) === 'RIFF' && substr($decoded, 8, 4) === 'WEBP');
    }

    if (!$matched) {
        return ['valid' => false, 'error' => 'Continutul fisierului nu corespunde tipului declarat.'];
    }

    return ['valid' => true, 'data' => $input];
}
