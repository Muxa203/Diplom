<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../helpers.php';
requireAdminPage();
$statuses = orderStatuses();
$orders = getDb()->query('
    SELECT o.id, o.customer_name, o.total_price, o.status, o.created_at, u.email
    FROM orders o
    INNER JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC, o.id DESC
')->fetchAll();
?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#4D7327">
<link rel="stylesheet" href="../../frontend/style.css">
<title>Заказы — Exotic Flora</title>
</head>
<body id="top">
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="../../frontend/index.html" aria-label="На главную Exotic Flora">
      <img src="../../frontend/images/logo.png" alt="Логотип Exotic Flora" class="brand-logo" width="220" height="60">
    </a>
    <nav class="nav">
      <a class="nav-link" href="index.php">Товары</a>
      <a class="nav-link" href="orders.php">Заказы</a>
      <a class="nav-link" href="../../frontend/catalog.html">Каталог</a>
      <span class="nav-user"><?= e($_SESSION['user_email'] ?? '') ?></span>
    </nav>
  </div>
</header>
<main class="site-main">
<section class="page-head"><div class="container"><h1 class="page-title">Управление заказами</h1><p class="muted">Просматривайте заказы покупателей и обновляйте статусы без перезагрузки страницы.</p></div></section>
<section class="section"><div class="container">
  <div class="card admin-card orders-card">
    <div class="checkout-head">
      <h2>Все заказы</h2>
      <span class="cart-badge">Всего: <strong><?= count($orders) ?></strong></span>
    </div>
    <p class="muted small status-message" data-admin-order-status aria-live="polite"></p>
    <div class="admin-table-wrap">
      <table class="admin-table orders-table">
        <thead><tr><th>ID</th><th>Дата</th><th>Покупатель</th><th>Сумма</th><th>Статус</th></tr></thead>
        <tbody>
          <?php if (!$orders): ?>
          <tr><td colspan="5" class="muted">Заказов пока нет.</td></tr>
          <?php endif; ?>
          <?php foreach ($orders as $order): ?>
          <tr class="order-row order-status-<?= e($order['status']) ?>" data-order-row>
            <td>EF-<?= (int) $order['id'] ?></td>
            <td><?= e(date('d.m.Y H:i', strtotime($order['created_at']))) ?></td>
            <td><strong><?= e($order['customer_name']) ?></strong><br><span class="muted small"><?= e($order['email']) ?></span></td>
            <td><?= e(number_format((float) $order['total_price'], 0, ',', ' ')) ?> ₽</td>
            <td>
              <select class="status-select" data-order-status-select="<?= (int) $order['id'] ?>" aria-label="Статус заказа EF-<?= (int) $order['id'] ?>">
                <?php foreach ($statuses as $value => $label): ?>
                <option value="<?= e($value) ?>" <?= $order['status'] === $value ? 'selected' : '' ?>><?= e($label) ?></option>
                <?php endforeach; ?>
              </select>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div></section>
</main>
<footer class="site-footer"><div class="container footer-bottom"><span class="muted">© <span id="year"></span> Exotic Flora. Администрирование.</span><a class="to-top" href="#top" aria-label="Наверх">↑</a></div></footer>
<script src="admin.js" defer></script>
</body>
</html>
