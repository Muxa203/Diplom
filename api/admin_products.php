<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

function validateProductData($data)
{
    $name = inputString($data, 'name');
    $description = inputString($data, 'description');
    $image = inputString($data, 'image');
    $category = inputString($data, 'category');
    $price = (float) str_replace(',', '.', (string) ($data['price'] ?? '0'));

    if (mb_strlen($name) < 2 || mb_strlen($name) > 160) {
        jsonResponse(['success' => false, 'message' => 'Название должно содержать от 2 до 160 символов.'], 422);
    }

    if (mb_strlen($description) < 10 || mb_strlen($description) > 1000) {
        jsonResponse(['success' => false, 'message' => 'Описание должно содержать от 10 до 1000 символов.'], 422);
    }

    if ($price <= 0 || $price > 999999) {
        jsonResponse(['success' => false, 'message' => 'Укажите корректную цену.'], 422);
    }

    if (!in_array($category, ['carnivorous', 'succulents', 'tropical', 'rare'], true)) {
        jsonResponse(['success' => false, 'message' => 'Выберите корректную категорию.'], 422);
    }

    if (mb_strlen($image) < 3 || mb_strlen($image) > 255) {
        jsonResponse(['success' => false, 'message' => 'Укажите путь к изображению.'], 422);
    }

    return [$name, $description, $price, $image, $category];
}

try {
    requireAdminApi();
    $pdo = getDb();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $data = getJsonInput();
    $action = $_GET['action'] ?? inputString($data, 'action');

    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT id, name, description, price, image, category FROM products ORDER BY id DESC');
        jsonResponse(['success' => true, 'products' => $stmt->fetchAll()]);
    }

    if ($method === 'POST' && $action === 'create') {
        [$name, $description, $price, $image, $category] = validateProductData($data);
        $stmt = $pdo->prepare('INSERT INTO products (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$name, $description, $price, $image, $category]);
        jsonResponse(['success' => true, 'message' => 'Товар добавлен.']);
    }

    if ($method === 'POST' && $action === 'update') {
        $id = normalizePositiveInt($data['id'] ?? 0, 0);
        [$name, $description, $price, $image, $category] = validateProductData($data);
        $stmt = $pdo->prepare('UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ? WHERE id = ?');
        $stmt->execute([$name, $description, $price, $image, $category, $id]);
        jsonResponse(['success' => true, 'message' => 'Товар обновлён.']);
    }

    if ($method === 'POST' && $action === 'delete') {
        $id = normalizePositiveInt($data['id'] ?? 0, 0);
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'message' => 'Товар удалён.']);
    }

    jsonResponse(['success' => false, 'message' => 'Неизвестное действие.'], 404);
} catch (Throwable $error) {
    jsonResponse(['success' => false, 'message' => 'Операция не выполнена.'], 500);
}
