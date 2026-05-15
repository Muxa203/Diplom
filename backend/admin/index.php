<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../helpers.php';
requireAdminPage();
$products = getDb()->query('SELECT id, name, description, price, image, category FROM products ORDER BY id DESC')->fetchAll();
?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#4D7327">
<link rel="stylesheet" href="../../frontend/style.css">
<title>Админ-панель — Exotic Flora</title>
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
      <a class="nav-link" href="../../frontend/checkout.html">Оформление</a>
      <span class="nav-user"><?= e($_SESSION['user_email'] ?? '') ?></span>
    </nav>
  </div>
</header>
<main class="site-main">
<section class="page-head"><div class="container"><h1 class="page-title">Админ-панель</h1><p class="muted">Управление товарами каталога Exotic Flora.</p></div></section>
<section class="section"><div class="container admin-layout">
  <div class="card admin-card">
    <h2>Товар</h2>
    <form class="form" data-admin-product-form novalidate>
      <input type="hidden" name="id">
      <div class="form-grid">
        <label class="field"><span class="field-label">Название</span><input name="name" type="text" required><span class="field-hint">Минимум 2 символа.</span></label>
        <label class="field"><span class="field-label">Цена</span><input name="price" type="number" min="1" step="0.01" required><span class="field-hint">Цена больше 0.</span></label>
        <label class="field"><span class="field-label">Категория</span><select name="category" required><option value="carnivorous">Хищные</option><option value="succulents">Суккуленты</option><option value="tropical">Тропические</option><option value="rare">Редкие</option></select><span class="field-hint">Выберите категорию.</span></label>
        <label class="field"><span class="field-label">Изображение</span><input name="image" type="text" placeholder="images/monstera.webp" required><span class="field-hint">Путь к изображению.</span></label>
        <label class="field field-full"><span class="field-label">Описание</span><textarea name="description" rows="4" required></textarea><span class="field-hint">Минимум 10 символов.</span></label>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">Сохранить</button><button class="btn btn-ghost" type="button" data-admin-reset>Очистить</button></div>
      <p class="muted small status-message" data-admin-status aria-live="polite"></p>
    </form>
  </div>
  <div class="card admin-card">
    <h2>Список товаров</h2>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>ID</th><th>Название</th><th>Цена</th><th>Категория</th><th>Действия</th></tr></thead>
        <tbody data-admin-products>
          <?php foreach ($products as $product): ?>
          <tr data-product="<?= e(json_encode($product, JSON_UNESCAPED_UNICODE)) ?>">
            <td><?= (int) $product['id'] ?></td>
            <td><?= e($product['name']) ?></td>
            <td><?= e(number_format((float) $product['price'], 0, ',', ' ')) ?> ₽</td>
            <td><?= e($product['category']) ?></td>
            <td><button class="remove-btn" type="button" data-admin-edit>Редактировать</button><button class="remove-btn" type="button" data-admin-delete="<?= (int) $product['id'] ?>">Удалить</button></td>
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
