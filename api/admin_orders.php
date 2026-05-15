<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

try {
    requireAdminApi();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Метод не поддерживается.'], 405);
    }

    $data = getJsonInput();
    $orderId = normalizePositiveInt($data['order_id'] ?? 0, 0);
    $status = inputString($data, 'status');

    if ($orderId <= 0 || !validateOrderStatus($status)) {
        jsonResponse(['success' => false, 'message' => 'Укажите заказ и корректный статус.'], 422);
    }

    $stmt = getDb()->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $stmt->execute([$status, $orderId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'message' => 'Заказ не найден.'], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Статус заказа обновлён.',
        'order' => [
            'id' => $orderId,
            'status' => $status,
            'status_label' => orderStatusLabel($status),
        ],
    ]);
} catch (Throwable) {
    jsonResponse(['success' => false, 'message' => 'Не удалось обновить статус заказа.'], 500);
}
