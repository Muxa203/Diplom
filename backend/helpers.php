<?php

function startSession()
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirectTo($path)
{
    header('Location: ' . $path);
    exit;
}

function jsonResponse($payload, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput()
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return $_POST;
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function inputString($data, $key)
{
    return trim((string) ($data[$key] ?? ''));
}

function validateEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false && mb_strlen($email) <= 255;
}

function validatePassword($password)
{
    return mb_strlen($password) >= 6 && mb_strlen($password) <= 72;
}

function currentUserId()
{
    startSession();
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function currentUserRole()
{
    startSession();
    return isset($_SESSION['user_role']) ? (string) $_SESSION['user_role'] : null;
}

function isAdmin()
{
    return currentUserRole() === 'admin';
}

function requireUser()
{
    $userId = currentUserId();
    if ($userId === null) {
        jsonResponse(['success' => false, 'message' => 'Необходимо войти в аккаунт.'], 401);
    }

    return $userId;
}

function requireAdminPage()
{
    startSession();
    if (!isAdmin()) {
        redirectTo('../../frontend/login.html');
    }
}

function requireAdminApi()
{
    if (!isAdmin()) {
        jsonResponse(['success' => false, 'message' => 'Доступ разрешён только администратору.'], 403);
    }
}

function userPayload()
{
    startSession();
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'email' => (string) $_SESSION['user_email'],
        'role' => (string) $_SESSION['user_role'],
    ];
}

function authenticateUser($user)
{
    startSession();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_email'] = (string) $user['email'];
    $_SESSION['user_role'] = (string) $user['role'];
}

function clearAuth()
{
    startSession();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function normalizePositiveInt($value, $default = 1)
{
    $number = (int) $value;
    return $number > 0 ? $number : $default;
}

function validatePaymentMethod($payment)
{
    return in_array($payment, ['card', 'cash'], true);
}

function validateDeliveryMethod($delivery)
{
    return in_array($delivery, ['courier', 'pickup'], true);
}
