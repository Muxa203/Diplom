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
<style>
.image-picker-wrap {
  display: flex;
  align-items: stretch;
  gap: 12px;
}
.image-picker-thumb {
  width: auto;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #ddd;
  background: #f5f5f5;
  flex-shrink: 0;
}
.image-picker-thumb[src=""] { display: none; }
.image-picker-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.image-picker-meta input[type="text"] {
  width: 100%;
}
.image-picker-choose {
  align-self: flex-start;
  cursor: pointer;
  padding: 4px 12px;
  font-size: 0.82rem;
}
.price-nowrap { white-space: nowrap; }
</style>
</head>
<body id="top">
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="../../frontend/index.html" aria-label="На главную Exotic Flora">
      <img src="../../frontend/images/logo.png" alt="Логотип Exotic Flora" class="brand-logo" width="220" height="60">
    </a>
    <nav class="nav">
      <a class="nav-link" href="../../frontend/index.html">Главная</a>
      <a class="nav-link" href="index.php">Товары</a>
      <a class="nav-link" href="orders.php">Заказы</a>
      <button class="nav-link nav-button" type="button" data-admin-logout>Выйти</button>
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
        <div class="field field-full">
          <span class="field-label">Изображение</span>
          <div class="image-picker-wrap">
            <img id="admin-img-preview" class="image-picker-thumb" src="" alt="Превью" style="display:none">
            <div class="image-picker-meta">
              <input name="image" id="admin-img-path" type="text" placeholder="images/monstera.webp" required>
              <label class="btn btn-ghost image-picker-choose" for="admin-img-file">Выбрать файл…</label>
              <input type="file" id="admin-img-file" accept="image/*" style="display:none">
            </div>
          </div>
          <span class="field-hint">Путь к изображению.</span>
        </div>
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
            <td><span class="price-nowrap"><?= e(number_format((float) $product['price'], 0, ',', ' ')) ?> ₽</span></td>
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
