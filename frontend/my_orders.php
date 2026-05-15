<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#4D7327">
<link rel="stylesheet" href="style.css">
<title>Мои заказы — Exotic Flora</title>
<meta name="description" content="Личный кабинет Exotic Flora: текущие заказы и история покупок.">
</head>
<body id="top">
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="index.html" aria-label="На главную Exotic Flora">
      <img src="images/logo.png" alt="Логотип Exotic Flora" class="brand-logo" width="220" height="60">
    </a>
    <button class="nav-toggle" type="button" aria-label="Открыть меню" aria-expanded="false" data-nav-toggle>
      <span class="nav-toggle-line"></span>
      <span class="nav-toggle-line"></span>
      <span class="nav-toggle-line"></span>
    </button>
    <nav class="nav" data-nav>
      <a class="nav-link" href="index.html">Главная</a>
      <a class="nav-link" href="catalog.html">Каталог</a>
      <a class="nav-link" href="blog.html">Блог</a>
      <a class="nav-link" href="contact.html">Контакты</a>
      <a class="nav-link" href="checkout.html">Оформление</a>
      <span class="auth-links" data-auth-area></span>
    </nav>
  </div>
</header>
<main class="site-main">
<section class="page-head">
  <div class="container">
    <h1 class="page-title">Мои заказы</h1>
    <p class="muted">Следите за текущими заказами и просматривайте историю покупок.</p>
  </div>
</section>
<section class="section" data-my-orders-page>
  <div class="container">
    <div class="card orders-card">
      <div class="tabs" role="tablist" aria-label="Разделы заказов">
        <button class="tab-btn is-active" type="button" role="tab" aria-selected="true" data-orders-tab="current">Текущие заказы</button>
        <button class="tab-btn" type="button" role="tab" aria-selected="false" data-orders-tab="history">История заказов</button>
      </div>
      <p class="muted small status-message" data-my-orders-status aria-live="polite"></p>
      <div class="orders-list" data-orders-list></div>
    </div>
  </div>
</section>
</main>
<footer class="site-footer">
  <div class="container footer-bottom">
    <span class="muted">© <span id="year"></span> Exotic Flora. Все права защищены.</span>
    <a class="to-top" href="#top" aria-label="Наверх">↑</a>
  </div>
</footer>
<script src="script.js" defer></script>
</body>
</html>
