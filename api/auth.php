<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../backend/helpers.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($action === 'me') {
        jsonResponse(['success' => true, 'user' => userPayload()]);
    }

    if ($method !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Метод не поддерживается.'], 405);
    }

    $data = getJsonInput();

    if ($action === 'register') {
        $email = mb_strtolower(inputString($data, 'email'));
        $password = (string) ($data['password'] ?? '');

        if (!validateEmail($email)) {
            jsonResponse(['success' => false, 'message' => 'Введите корректный email.'], 422);
        }

        if (!validatePassword($password)) {
            jsonResponse(['success' => false, 'message' => 'Пароль должен содержать от 6 до 72 символов.'], 422);
        }

        $pdo = getDb();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => 'Пользователь с таким email уже существует.'], 409);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)');
        $stmt->execute([$email, $hash, 'user']);

        authenticateUser([
            'id' => (int) $pdo->lastInsertId(),
            'email' => $email,
            'role' => 'user',
        ]);

        jsonResponse(['success' => true, 'message' => 'Регистрация выполнена.', 'user' => userPayload()]);
    }

    if ($action === 'login') {
        $email = mb_strtolower(inputString($data, 'email'));
        $password = (string) ($data['password'] ?? '');

        if (!validateEmail($email) || $password === '') {
            jsonResponse(['success' => false, 'message' => 'Проверьте email и пароль.'], 422);
        }

        $stmt = getDb()->prepare('SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonResponse(['success' => false, 'message' => 'Неверный email или пароль.'], 401);
        }

        authenticateUser($user);
        jsonResponse(['success' => true, 'message' => 'Вход выполнен.', 'user' => userPayload()]);
    }

    if ($action === 'logout') {
        clearAuth();
        jsonResponse(['success' => true, 'message' => 'Вы вышли из аккаунта.']);
    }

    jsonResponse(['success' => false, 'message' => 'Неизвестное действие.'], 404);
} catch (Throwable) {
    jsonResponse(['success' => false, 'message' => 'Ошибка сервера. Попробуйте позже.'], 500);
}
