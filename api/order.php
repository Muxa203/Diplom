<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

function deliveryCost($delivery, $subtotal)
{
    if ($subtotal <= 0) {
        return 0;
    }

    return $delivery === 'courier' ? 600 : 0;
}

try {
    $userId = requireUser();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Метод не поддерживается.'], 405);
    }

    $data = getJsonInput();
    $fullname = inputString($data, 'fullname');
    $phone = inputString($data, 'phone');
    $address = inputString($data, 'address');
    $delivery = inputString($data, 'delivery');
    $payment = inputString($data, 'payment');

    if (mb_strlen($fullname) < 3 || mb_strlen($fullname) > 120) {
        jsonResponse(['success' => false, 'message' => 'Укажите имя получателя.'], 422);
    }

    if (!preg_match('/^[+0-9 ()-]{10,20}$/u', $phone)) {
        jsonResponse(['success' => false, 'message' => 'Укажите корректный телефон.'], 422);
    }

    if (!validateDeliveryMethod($delivery) || !validatePaymentMethod($payment)) {
        jsonResponse(['success' => false, 'message' => 'Выберите доставку и оплату.'], 422);
    }

    if ($delivery === 'courier' && (mb_strlen($address) < 6 || mb_strlen($address) > 255)) {
        jsonResponse(['success' => false, 'message' => 'Укажите адрес доставки.'], 422);
    }

    $pdo = getDb();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('
        SELECT ci.product_id, ci.quantity, p.price
        FROM cart_items ci
        INNER JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        FOR UPDATE
    ');
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();

    if (!$items) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Корзина пуста.'], 422);
    }

    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += (float) $item['price'] * (int) $item['quantity'];
    }
    $total = $subtotal + deliveryCost($delivery, $subtotal);

    $stmt = $pdo->prepare('
        INSERT INTO orders (user_id, customer_name, phone, address, delivery_method, payment_method, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([$userId, $fullname, $phone, $address, $delivery, $payment, $total]);
    $orderId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    foreach ($items as $item) {
        $stmt->execute([$orderId, (int) $item['product_id'], (int) $item['quantity'], (float) $item['price']]);
    }

    $stmt = $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?');
    $stmt->execute([$userId]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Заказ успешно оформлен. Менеджер свяжется для подтверждения.',
        'order' => [
            'id' => $orderId,
            'total_price' => $total,
        ],
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'message' => 'Не удалось оформить заказ.'], 500);
}
