<?php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$projectRoot = dirname(__FILE__);
$frontendRoot = $projectRoot . '/frontend';

// Serve root -> frontend/index.html
if ($uri === '/' || $uri === '') {
    header('Content-Type: text/html; charset=utf-8');
    readfile($frontendRoot . '/index.html');
    return true;
}

// API routes: /api/...
if (strpos($uri, '/api/') === 0) {
    $file = $projectRoot . $uri;
    if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        require $file;
        return true;
    }
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Not found']);
    return true;
}

// Backend routes: /backend/...
if (strpos($uri, '/backend/') === 0) {
    $file = $projectRoot . $uri;
    if (file_exists($file) && is_file($file)) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
            require $file;
            return true;
        }
        return false;
    }
    http_response_code(404);
    return true;
}

// All other requests: try to serve from frontend/ directory
$frontendFile = $frontendRoot . $uri;
if (file_exists($frontendFile) && is_file($frontendFile)) {
    $ext = strtolower(pathinfo($frontendFile, PATHINFO_EXTENSION));
    if ($ext === 'php') {
        require $frontendFile;
        return true;
    }
    // Serve static files with proper MIME types
    $mimes = [
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'html' => 'text/html',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'json' => 'application/json',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($frontendFile);
    return true;
}

// Fallback: 404
http_response_code(404);
echo '404 Not Found: ' . htmlspecialchars($uri);
return true;
