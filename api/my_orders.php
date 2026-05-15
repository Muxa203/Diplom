<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

try {
    $userId = requireUser();

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Метод не поддерживается.'], 405);
    }

    $stmt = getDb()->prepare('
        SELECT
            o.id,
            o.total_price,
            o.status,
            o.created_at,
            oi.quantity,
            oi.price,
            p.name
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        INNER JOIN products p ON p.id = oi.product_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, o.id DESC, oi.id ASC
    ');
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    $orders = [];

    foreach ($rows as $row) {
        $id = (int) $row['id'];
        if (!isset($orders[$id])) {
            $orders[$id] = [
                'id' => $id,
                'total_price' => (float) $row['total_price'],
                'status' => (string) $row['status'],
                'status_label' => orderStatusLabel($row['status']),
                'created_at' => (string) $row['created_at'],
                'items' => [],
            ];
        }
        $orders[$id]['items'][] = [
            'name' => (string) $row['name'],
            'quantity' => (int) $row['quantity'],
            'price' => (float) $row['price'],
        ];
    }

    jsonResponse(['success' => true, 'orders' => array_values($orders)]);
} catch (Throwable) {
    jsonResponse(['success' => false, 'message' => 'Не удалось загрузить заказы.'], 500);
}
