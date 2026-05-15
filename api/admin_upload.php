<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';
requireAdminApi();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$file = $_FILES['image'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'message' => 'Файл не загружен или ошибка загрузки.']);
}

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowed, true)) {
    jsonResponse(['success' => false, 'message' => 'Недопустимый тип файла.']);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$filename = 'images/' . bin2hex(random_bytes(8)) . '.' . $ext;
$dest = __DIR__ . '/../frontend/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    jsonResponse(['success' => false, 'message' => 'Не удалось сохранить файл.']);
}

jsonResponse(['success' => true, 'path' => $filename]);
