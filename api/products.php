<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Метод не поддерживается.'], 405);
    }

    $stmt = getDb()->query('SELECT id, name, description, price, image, category FROM products ORDER BY id ASC');
    jsonResponse(['success' => true, 'products' => $stmt->fetchAll()]);
} catch (Throwable) {
    jsonResponse(['success' => false, 'message' => 'Не удалось загрузить каталог.'], 500);
}
