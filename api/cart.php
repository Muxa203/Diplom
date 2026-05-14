<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

function fetchCart($pdo, $userId)
{
    $stmt = $pdo->prepare('
        SELECT ci.id, ci.product_id, ci.quantity, p.name, p.description, p.price, p.image
        FROM cart_items ci
        INNER JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY ci.id ASC
    ');
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    $total = 0;
    $count = 0;

    foreach ($items as &$item) {
        $item['id'] = (int) $item['id'];
        $item['product_id'] = (int) $item['product_id'];
        $item['quantity'] = (int) $item['quantity'];
        $item['price'] = (float) $item['price'];
        $item['sum'] = $item['price'] * $item['quantity'];
        $total += $item['sum'];
        $count += $item['quantity'];
    }

    return ['items' => $items, 'total' => $total, 'count' => $count];
}

try {
    $userId = requireUser();
    $pdo = getDb();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        jsonResponse(['success' => true, 'cart' => fetchCart($pdo, $userId)]);
    }

    $data = getJsonInput();
    $action = $_GET['action'] ?? inputString($data, 'action');

    if ($method === 'POST' && $action === 'add') {
        $productId = normalizePositiveInt($data['product_id'] ?? 0, 0);
        $quantity = normalizePositiveInt($data['quantity'] ?? 1);

        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Товар не найден.'], 422);
        }

        $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$productId]);
        if (!$stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => 'Товар не найден.'], 404);
        }

        $stmt = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1');
        $stmt->execute([$userId, $productId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $nextQuantity = min(99, (int) $existing['quantity'] + $quantity);
            $stmt = $pdo->prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$nextQuantity, (int) $existing['id'], $userId]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)');
            $stmt->execute([$userId, $productId, min(99, $quantity)]);
        }

        jsonResponse(['success' => true, 'message' => 'Товар добавлен в корзину.', 'cart' => fetchCart($pdo, $userId)]);
    }

    if ($method === 'POST' && $action === 'update') {
        $cartItemId = normalizePositiveInt($data['cart_item_id'] ?? 0, 0);
        $quantity = (int) ($data['quantity'] ?? 0);

        if ($cartItemId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Позиция корзины не найдена.'], 422);
        }

        if ($quantity <= 0) {
            $stmt = $pdo->prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?');
            $stmt->execute([$cartItemId, $userId]);
        } else {
            $stmt = $pdo->prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([min(99, $quantity), $cartItemId, $userId]);
        }

        jsonResponse(['success' => true, 'message' => 'Корзина обновлена.', 'cart' => fetchCart($pdo, $userId)]);
    }

    if ($method === 'POST' && $action === 'remove') {
        $cartItemId = normalizePositiveInt($data['cart_item_id'] ?? 0, 0);
        $stmt = $pdo->prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?');
        $stmt->execute([$cartItemId, $userId]);
        jsonResponse(['success' => true, 'message' => 'Товар удалён.', 'cart' => fetchCart($pdo, $userId)]);
    }

    jsonResponse(['success' => false, 'message' => 'Неизвестное действие.'], 404);
} catch (Throwable $error) {
    jsonResponse(['success' => false, 'message' => 'Не удалось обновить корзину.'], 500);
}
