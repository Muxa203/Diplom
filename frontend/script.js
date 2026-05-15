(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const API_BASE = "../api";

  let currentUser = null;
  let cartState = { items: [], total: 0, count: 0 };

  function formatRUB(value) {
    return new Intl.NumberFormat("ru-RU").format(Number(value) || 0) + " ₽";
  }

  function getDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function isValidPhone(value) {
    const digits = getDigits(value);
    return digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      '"': "&quot;"
    }[char]));
  }

  async function requestJSON(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({ success: false, message: "Некорректный ответ сервера." }));
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Ошибка запроса.");
    }
    return data;
  }

  function formatPhoneInput(value) {
    let digits = getDigits(value);
    if (!digits) return "";
    if (digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits[0] !== "7") digits = "7" + digits;
    digits = digits.slice(0, 11);

    const p1 = digits.slice(1, 4);
    const p2 = digits.slice(4, 7);
    const p3 = digits.slice(7, 9);
    const p4 = digits.slice(9, 11);

    let result = "+7";
    if (p1) result += " (" + p1;
    if (p1.length === 3) result += ")";
    if (p2) result += " " + p2;
    if (p3) result += "-" + p3;
    if (p4) result += "-" + p4;
    return result;
  }

  function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener("input", () => {
      input.value = formatPhoneInput(input.value);
    });
    input.addEventListener("blur", () => {
      input.value = formatPhoneInput(input.value);
    });
  }

  function setInvalid(fieldEl, isInvalid) {
    if (!fieldEl) return;
    fieldEl.classList.toggle("is-invalid", Boolean(isInvalid));
  }

  function setDisabled(fieldEl, isDisabled) {
    if (!fieldEl) return;
    fieldEl.classList.toggle("is-disabled", Boolean(isDisabled));
  }

  function setStatus(target, message, type) {
    if (!target) return;
    target.textContent = message || "";
    target.classList.remove("status-success", "status-error");
    if (type === "success") target.classList.add("status-success");
    if (type === "error") target.classList.add("status-error");
  }

  function cartTotal() {
    return Number(cartState.total) || 0;
  }

  function updateCartBadges() {
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = String(cartState.count || 0);
    });
  }

  function requireLoginMessage() {
    return "Войдите или зарегистрируйтесь, чтобы добавить товар в корзину.";
  }

  async function loadUser() {
    try {
      const data = await requestJSON(`${API_BASE}/auth.php?action=me`);
      currentUser = data.user || null;
    } catch {
      currentUser = null;
    }
    renderUserControls();
  }

  async function loadCart() {
    if (!currentUser) {
      cartState = { items: [], total: 0, count: 0 };
      updateCartBadges();
      return;
    }

    try {
      const data = await requestJSON(`${API_BASE}/cart.php`);
      cartState = data.cart;
      updateCartBadges();
    } catch {
      cartState = { items: [], total: 0, count: 0 };
      updateCartBadges();
    }
  }

  function renderUserControls() {
    $$('[data-auth-area]').forEach((area) => {
      if (currentUser) {
        const adminLink = currentUser.role === "admin" ? '<a class="nav-link" href="../backend/admin/index.php">Админ</a>' : '';
        area.innerHTML = `
          ${adminLink}
          <a class="nav-link" href="my_orders.php">Мои заказы</a>
          <span class="nav-user">${escapeHTML(currentUser.email)}</span>
          <button class="nav-link nav-button" type="button" data-logout>Выйти</button>
        `;
      } else {
        area.innerHTML = '<a class="nav-link" href="login.html">Вход</a><a class="nav-link" href="register.html">Регистрация</a>';
      }
    });

    $$('[data-logout]').forEach((button) => {
      button.addEventListener("click", async () => {
        await requestJSON(`${API_BASE}/auth.php?action=logout`, { method: "POST", body: "{}" }).catch(() => null);
        currentUser = null;
        cartState = { items: [], total: 0, count: 0 };
        updateCartBadges();
        renderUserControls();
        if (location.pathname.endsWith("checkout.html")) location.href = "login.html";
      });
    });
  }

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$(".nav-link").forEach((link) => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === path) link.classList.add("is-active");
  });

  const navToggle = $("[data-nav-toggle]");
  const nav = $("[data-nav]");
  const header = $(".site-header");
  if (navToggle && nav) {
    const navBackdrop = document.createElement("div");
    navBackdrop.className = "nav-backdrop";
    navBackdrop.hidden = true;
    document.body.append(navBackdrop);

    const syncNavOffset = () => {
      if (header) document.documentElement.style.setProperty("--mobile-nav-top", `${header.offsetHeight + 8}px`);
    };

    const closeNav = () => {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Открыть меню");
      document.body.classList.remove("mobile-menu-open");
      navBackdrop.classList.remove("is-visible");
      navBackdrop.hidden = true;
    };

    const openNav = () => {
      syncNavOffset();
      nav.classList.add("is-open");
      navToggle.classList.add("is-active");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Закрыть меню");
      document.body.classList.add("mobile-menu-open");
      navBackdrop.hidden = false;
      requestAnimationFrame(() => navBackdrop.classList.add("is-visible"));
    };

    navToggle.addEventListener("click", () => nav.classList.contains("is-open") ? closeNav() : openNav());
    navBackdrop.addEventListener("click", closeNav);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) closeNav();
    });
    window.addEventListener("resize", () => {
      syncNavOffset();
      if (window.innerWidth > 860) closeNav();
    });
    syncNavOffset();
    $$(".nav-link", nav).forEach((link) => link.addEventListener("click", closeNav));
  }

  async function addToCart(productId, button) {
    if (!currentUser) {
      alert(requireLoginMessage());
      location.href = "login.html";
      return;
    }

    const prevText = button.textContent;
    button.disabled = true;
    try {
      const data = await requestJSON(`${API_BASE}/cart.php?action=add`, {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      cartState = data.cart;
      updateCartBadges();
      button.textContent = "Добавлено";
      setTimeout(() => { button.textContent = prevText; button.disabled = false; }, 900);
    } catch (error) {
      button.disabled = false;
      alert(error.message);
    }
  }

  function productCard(product, index) {
    const pageNumber = Math.floor(index / 8) + 1;
    return `
      <article class="product-card" data-category="${escapeHTML(product.category)}" data-page="${pageNumber}" data-default-index="${index}" data-price="${Number(product.price) || 0}" data-name="${escapeHTML(product.name)}">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">
        <div class="product-body">
          <h3 class="product-title">${escapeHTML(product.name)}</h3>
          <p class="product-desc">${escapeHTML(product.description)}</p>
          <div class="product-meta">
            <span class="price">${formatRUB(product.price)}</span>
            <button class="btn btn-small" data-add-to-cart="${Number(product.id)}">В корзину</button>
          </div>
        </div>
      </article>
    `;
  }

  const productsRoot = $("[data-products]");
  const filterButtons = $$("[data-filter]");
  const searchInput = $("[data-catalog-search]");
  const sortSelect = $("[data-catalog-sort]");
  const pageButtons = $$("[data-page]");
  let currentFilter = "all";
  let currentPage = 1;
  let searchQuery = "";
  let currentSort = "default";

  function bindAddButtons(root = document) {
    $$("[data-add-to-cart]", root).forEach((button) => {
      if (button.dataset.cartBound === "true") return;
      button.dataset.cartBound = "true";
      button.addEventListener("click", () => {
        const productId = Number(button.getAttribute("data-add-to-cart") || "0");
        if (productId > 0) addToCart(productId, button);
      });
    });
  }

  function getTitle(card) {
    return ($(".product-title", card)?.textContent || "").trim().toLowerCase();
  }

  function getDescription(card) {
    return ($(".product-desc", card)?.textContent || "").trim().toLowerCase();
  }

  function compareNames(a, b, direction) {
    const nameA = a.getAttribute("data-name") || getTitle(a);
    const nameB = b.getAttribute("data-name") || getTitle(b);
    return direction * nameA.localeCompare(nameB, "ru", { sensitivity: "base" });
  }

  function sortCatalogCards() {
    if (!productsRoot) return;
    const cards = $$(".product-card", productsRoot);
    const sorted = cards.slice().sort((a, b) => {
      const priceA = Number(a.getAttribute("data-price") || "0");
      const priceB = Number(b.getAttribute("data-price") || "0");
      if (currentSort === "default") return Number(a.getAttribute("data-default-index") || "0") - Number(b.getAttribute("data-default-index") || "0");
      if (currentSort === "price-asc") return priceA - priceB;
      if (currentSort === "price-desc") return priceB - priceA;
      if (currentSort === "name-asc") return compareNames(a, b, 1);
      if (currentSort === "name-desc") return compareNames(a, b, -1);
      return 0;
    });
    sorted.forEach((card) => productsRoot.append(card));
  }

  function updateDynamicPages(cards) {
    cards.forEach((card, index) => {
      card.setAttribute("data-dynamic-page", String(Math.floor(index / 8) + 1));
    });
  }

  function applyCatalog() {
    if (!productsRoot) return;
    sortCatalogCards();
    const eligibleCards = $$(".product-card", productsRoot).filter((card) => {
      const category = card.getAttribute("data-category") || "";
      const matchesFilter = currentFilter === "all" || category === currentFilter;
      const matchesSearch = !searchQuery || getTitle(card).includes(searchQuery) || getDescription(card).includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
    updateDynamicPages(eligibleCards);
    const totalPages = Math.max(1, Math.ceil(eligibleCards.length / 8));
    if (currentPage > totalPages) currentPage = totalPages;
    const pagingEnabled = currentFilter === "all" && !searchQuery && currentSort === "default";

    filterButtons.forEach((button) => {
      const value = button.getAttribute("data-filter") || "all";
      button.classList.toggle("is-active", value === currentFilter);
    });

    pageButtons.forEach((button) => {
      const page = Number(button.getAttribute("data-page") || "1");
      button.classList.toggle("is-active", page === currentPage);
      button.disabled = page > totalPages;
      button.hidden = page > totalPages;
    });

    $$(".product-card", productsRoot).forEach((card) => {
      const page = pagingEnabled ? Number(card.getAttribute("data-page") || "1") : Number(card.getAttribute("data-dynamic-page") || "1");
      const matchesPage = page === currentPage;
      card.hidden = !(eligibleCards.includes(card) && matchesPage);
    });
  }

  async function loadCatalog() {
    if (!productsRoot) return;
    try {
      const data = await requestJSON(`${API_BASE}/products.php`);
      const products = data.products || [];
      productsRoot.innerHTML = products.map(productCard).join("");
      bindAddButtons();
      applyCatalog();
    } catch {
      bindAddButtons();
      applyCatalog();
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.getAttribute("data-filter") || "all";
      currentPage = 1;
      applyCatalog();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      currentPage = 1;
      applyCatalog();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value || "default";
      currentPage = 1;
      applyCatalog();
    });
  }

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = Number(button.getAttribute("data-page") || "1");
      applyCatalog();
    });
  });

  const cartModal = $("[data-cart-modal]");
  const cartList = $("[data-cart-list]");
  const cartTotalEl = $("[data-cart-total]");
  const cartEmptyEl = $("[data-cart-empty]");
  const openCartBtn = $("[data-open-cart]");
  const closeCartBtns = $$("[data-close-cart]");
  const checkoutBtn = $("[data-checkout]");

  function renderCartModal() {
    if (!cartList || !cartTotalEl || !cartEmptyEl) return;
    cartList.innerHTML = "";

    if (!currentUser) {
      cartEmptyEl.style.display = "block";
      cartEmptyEl.textContent = requireLoginMessage();
      cartTotalEl.textContent = formatRUB(0);
      return;
    }

    if (!cartState.items.length) {
      cartEmptyEl.style.display = "block";
      cartEmptyEl.textContent = "Пока пусто. Добавьте пару растений.";
      cartTotalEl.textContent = formatRUB(0);
      return;
    }

    cartEmptyEl.style.display = "none";
    cartState.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${escapeHTML(item.name)} × ${item.quantity}</span>
        <span>
          <strong>${formatRUB(item.sum)}</strong>
          <button type="button" data-remove="${item.id}">Удалить</button>
        </span>
      `;
      cartList.appendChild(li);
    });

    cartTotalEl.textContent = formatRUB(cartState.total);

    $$('[data-remove]', cartList).forEach((button) => {
      button.addEventListener("click", async () => {
        const cartItemId = Number(button.getAttribute("data-remove"));
        const data = await requestJSON(`${API_BASE}/cart.php?action=remove`, {
          method: "POST",
          body: JSON.stringify({ cart_item_id: cartItemId })
        });
        cartState = data.cart;
        updateCartBadges();
        renderCartModal();
      });
    });
  }

  async function openCart() {
    if (!cartModal) return;
    if (currentUser) await loadCart();
    cartModal.hidden = false;
    document.body.style.overflow = "hidden";
    renderCartModal();
  }

  function closeCart() {
    if (!cartModal) return;
    cartModal.hidden = true;
    document.body.style.overflow = "";
  }

  if (openCartBtn) openCartBtn.addEventListener("click", openCart);
  closeCartBtns.forEach((button) => button.addEventListener("click", closeCart));
  if (cartModal) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !cartModal.hidden) closeCart();
    });
  }
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => { window.location.href = "checkout.html"; });

  $$("[data-post-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-post-toggle") || "";
      const details = $(`[data-post-more="${id.replace(/"/g, '\\"')}"]`);
      if (!details) return;
      const shouldOpen = details.hidden;
      details.hidden = !shouldOpen;
      button.setAttribute("aria-expanded", String(shouldOpen));
      button.textContent = shouldOpen ? "Скрыть ↑" : "Читать далее →";
    });
  });

  const authForm = $("[data-auth-form]");
  if (authForm) {
    const authMode = authForm.getAttribute("data-auth-form");
    const status = $("[data-auth-status]");

    authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = authForm.elements.namedItem("email");
      const password = authForm.elements.namedItem("password");
      const emailOk = email && isValidEmail(email.value);
      const passwordOk = password && String(password.value).length >= 6;

      setInvalid(email?.closest(".field"), !emailOk);
      setInvalid(password?.closest(".field"), !passwordOk);
      if (!emailOk || !passwordOk) {
        setStatus(status, "Проверьте email и пароль.", "error");
        return;
      }

      try {
        const data = await requestJSON(`${API_BASE}/auth.php?action=${authMode}`, {
          method: "POST",
          body: JSON.stringify({ email: email.value, password: password.value })
        });
        currentUser = data.user;
        setStatus(status, data.message, "success");
        setTimeout(() => { location.href = currentUser.role === "admin" ? "../backend/admin/index.php" : "catalog.html"; }, 500);
      } catch (error) {
        setStatus(status, error.message, "error");
      }
    });
  }

  const checkoutPage = $("[data-checkout-page]");
  if (checkoutPage) {
    const listEl = $("[data-checkout-list]");
    const emptyEl = $("[data-checkout-empty]");
    const totalEl = $("[data-checkout-total]");
    const countEl = $("[data-checkout-count]");
    const orderForm = $("[data-order-form]");
    const orderStatus = $("[data-order-status]");
    const submitBtn = $("[data-order-submit]");
    const subtotalEl = $("[data-summary-subtotal]");
    const deliverySumEl = $("[data-summary-delivery]");
    const grandEl = $("[data-summary-grand]");
    const addressFieldEl = $("[data-address-field]");

    function getDeliveryCost(delivery) {
      if (!cartState.items.length) return 0;
      return delivery === "courier" ? 600 : 0;
    }

    function updateAddressState() {
      if (!orderForm) return;
      const delivery = orderForm.elements.namedItem("delivery");
      const address = orderForm.elements.namedItem("address");
      const isPickup = delivery && String(delivery.value) === "pickup";

      if (address instanceof HTMLInputElement) {
        address.disabled = Boolean(isPickup);
        address.required = !isPickup;
        address.placeholder = isPickup ? "Для самовывоза адрес не требуется" : "Улица, дом, квартира";
        if (isPickup) {
          address.value = "";
          setInvalid(address.closest(".field"), false);
        }
      }

      setDisabled(addressFieldEl, Boolean(isPickup));
    }

    function updateCheckoutSummary() {
      if (!orderForm) return;
      const delivery = orderForm.elements.namedItem("delivery");
      const deliveryValue = delivery ? String(delivery.value || "") : "";
      const subtotal = cartTotal();
      const deliveryCost = getDeliveryCost(deliveryValue);
      const grand = subtotal + deliveryCost;

      if (subtotalEl) subtotalEl.textContent = formatRUB(subtotal);
      if (deliverySumEl) deliverySumEl.textContent = formatRUB(deliveryCost);
      if (grandEl) grandEl.textContent = formatRUB(grand);
    }

    function renderCheckout() {
      if (!listEl || !emptyEl || !totalEl || !countEl) return;
      listEl.innerHTML = "";
      countEl.textContent = String(cartState.count || 0);

      if (!currentUser) {
        emptyEl.style.display = "block";
        emptyEl.innerHTML = 'Для оформления заказа <a class="link" href="login.html">войдите в аккаунт</a>.';
        totalEl.textContent = formatRUB(0);
        if (submitBtn) submitBtn.disabled = true;
        updateCheckoutSummary();
        return;
      }

      if (!cartState.items.length) {
        emptyEl.style.display = "block";
        emptyEl.innerHTML = 'Корзина пуста. Перейдите в <a class="link" href="catalog.html">каталог</a> и добавьте растения.';
        totalEl.textContent = formatRUB(0);
        if (submitBtn) submitBtn.disabled = true;
        updateCheckoutSummary();
        return;
      }

      emptyEl.style.display = "none";
      if (submitBtn) submitBtn.disabled = false;

      cartState.items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "checkout-item";
        li.innerHTML = `
          <div>
            <div class="checkout-item-title">${escapeHTML(item.name)}</div>
            <div class="muted small">${formatRUB(item.price)} за шт.</div>
          </div>
          <div class="checkout-controls">
            <button class="qty-btn" type="button" data-minus>−</button>
            <span class="qty" aria-label="Количество">${item.quantity}</span>
            <button class="qty-btn" type="button" data-plus>+</button>
            <button class="remove-btn" type="button" data-removeall>Удалить</button>
          </div>
        `;
        li.querySelector("[data-minus]")?.addEventListener("click", () => updateCartItem(item.id, item.quantity - 1));
        li.querySelector("[data-plus]")?.addEventListener("click", () => updateCartItem(item.id, item.quantity + 1));
        li.querySelector("[data-removeall]")?.addEventListener("click", () => updateCartItem(item.id, 0));
        listEl.appendChild(li);
      });

      totalEl.textContent = formatRUB(cartTotal());
      updateCheckoutSummary();
    }

    async function updateCartItem(cartItemId, quantity) {
      try {
        const data = await requestJSON(`${API_BASE}/cart.php?action=update`, {
          method: "POST",
          body: JSON.stringify({ cart_item_id: cartItemId, quantity })
        });
        cartState = data.cart;
        updateCartBadges();
        renderCheckout();
      } catch (error) {
        setStatus(orderStatus, error.message, "error");
      }
    }

    if (orderForm) {
      const phoneInput = orderForm.elements.namedItem("phone");
      if (phoneInput instanceof HTMLInputElement) applyPhoneMask(phoneInput);

      const deliverySelect = orderForm.elements.namedItem("delivery");
      deliverySelect?.addEventListener("change", () => {
        updateAddressState();
        updateCheckoutSummary();
      });

      updateAddressState();
      updateCheckoutSummary();

      ["fullname", "phone", "address"].forEach((name) => {
        const el = orderForm.elements.namedItem(name);
        el?.addEventListener("input", () => {
          setInvalid(el.closest(".field"), false);
          setStatus(orderStatus, "", "");
        });
      });

      ["delivery", "payment"].forEach((name) => {
        const el = orderForm.elements.namedItem(name);
        el?.addEventListener("change", () => {
          setInvalid(el.closest(".field"), false);
          setStatus(orderStatus, "", "");
          if (name === "delivery") updateCheckoutSummary();
        });
      });

      orderForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setStatus(orderStatus, "", "");

        if (!cartState.items.length) {
          setStatus(orderStatus, "Корзина пуста — сначала добавьте растения в каталоге.", "error");
          return;
        }

        const fullname = orderForm.elements.namedItem("fullname");
        const phone = orderForm.elements.namedItem("phone");
        const address = orderForm.elements.namedItem("address");
        const delivery = orderForm.elements.namedItem("delivery");
        const payment = orderForm.elements.namedItem("payment");
        const deliveryValue = delivery ? String(delivery.value || "") : "";
        const pickup = deliveryValue === "pickup";

        const fullnameOk = fullname && String(fullname.value).trim().length >= 3;
        const phoneOk = phone && isValidPhone(phone.value);
        const addressOk = pickup ? true : Boolean(address && String(address.value).trim().length >= 6);
        const deliveryOk = delivery && deliveryValue.length > 0;
        const paymentOk = payment && String(payment.value || "").trim().length > 0;

        setInvalid(fullname?.closest(".field"), !fullnameOk);
        setInvalid(phone?.closest(".field"), !phoneOk);
        setInvalid(address?.closest(".field"), !addressOk);
        setInvalid(delivery?.closest(".field"), !deliveryOk);
        setInvalid(payment?.closest(".field"), !paymentOk);

        if (!(fullnameOk && phoneOk && addressOk && deliveryOk && paymentOk)) {
          setStatus(orderStatus, "Проверьте поля, отмеченные красным.", "error");
          return;
        }

        try {
          const data = await requestJSON(`${API_BASE}/order.php`, {
            method: "POST",
            body: JSON.stringify({
              fullname: fullname.value,
              phone: phone.value,
              address: address?.value || "",
              delivery: delivery.value,
              payment: payment.value
            })
          });
          await loadCart();
          renderCheckout();
          orderForm.reset();
          updateAddressState();
          updateCheckoutSummary();
          setStatus(orderStatus, `${data.message} Номер заказа: EF-${data.order.id}.`, "success");
        } catch (error) {
          setStatus(orderStatus, error.message, "error");
        }
      });
    }

    document.addEventListener("cart-ready", renderCheckout, { once: true });
  }

  const contactForm = $("[data-contact-form]");
  const contactStatus = $("[data-form-status]");
  if (contactForm) {
    const contactEmail = contactForm.elements.namedItem("email");
    if (contactEmail) contactEmail.addEventListener("input", () => setInvalid(contactEmail.closest(".field"), false));

    ["name", "subject", "message"].forEach((name) => {
      const input = contactForm.elements.namedItem(name);
      input?.addEventListener("input", () => {
        setInvalid(input.closest(".field"), false);
        setStatus(contactStatus, "", "");
      });
    });

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = contactForm.elements.namedItem("name");
      const email = contactForm.elements.namedItem("email");
      const subject = contactForm.elements.namedItem("subject");
      const message = contactForm.elements.namedItem("message");
      const nameOk = name && String(name.value).trim().length >= 2;
      const emailOk = email && isValidEmail(email.value);
      const subjectOk = subject && String(subject.value).trim().length >= 3;
      const messageOk = message && String(message.value).trim().length >= 10;
      setInvalid(name?.closest(".field"), !nameOk);
      setInvalid(email?.closest(".field"), !emailOk);
      setInvalid(subject?.closest(".field"), !subjectOk);
      setInvalid(message?.closest(".field"), !messageOk);
      setStatus(contactStatus, nameOk && emailOk && subjectOk && messageOk ? "Спасибо! Сообщение подготовлено к отправке." : "Проверьте поля формы.", nameOk && emailOk && subjectOk && messageOk ? "success" : "error");
      if (nameOk && emailOk && subjectOk && messageOk) contactForm.reset();
    });
  }

  const myOrdersPage = $("[data-my-orders-page]");
  if (myOrdersPage) {
    const ordersList = $("[data-orders-list]");
    const ordersStatus = $("[data-my-orders-status]");
    const tabButtons = $$("[data-orders-tab]");
    let ordersState = [];
    let activeOrdersTab = "current";

    function formatDate(value) {
      const date = new Date(String(value).replace(" ", "T"));
      if (Number.isNaN(date.getTime())) return String(value || "");
      return date.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
    }

    function isHistoryOrder(order) {
      return ["delivered", "cancelled"].includes(order.status);
    }

    function orderMarkup(order) {
      const items = (order.items || []).map((item) => `
        <li>${escapeHTML(item.name)} × ${Number(item.quantity)} <span class="muted small">по ${formatRUB(item.price)}</span></li>
      `).join("");
      return `
        <article class="order-card order-status-${escapeHTML(order.status)}">
          <div class="order-card-head">
            <div>
              <h3>Заказ EF-${Number(order.id)}</h3>
              <p class="muted small">${escapeHTML(formatDate(order.created_at))}</p>
            </div>
            <span class="status-pill status-${escapeHTML(order.status)}">${escapeHTML(order.status_label)}</span>
          </div>
          <ul class="order-items">${items}</ul>
          <div class="checkout-summary"><span class="muted">Сумма</span><strong>${formatRUB(order.total_price)}</strong></div>
        </article>
      `;
    }

    function renderMyOrders() {
      if (!ordersList) return;
      tabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-orders-tab") === activeOrdersTab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });
      const visibleOrders = ordersState.filter((order) => activeOrdersTab === "history" ? isHistoryOrder(order) : !isHistoryOrder(order));
      if (!visibleOrders.length) {
        ordersList.innerHTML = `<p class="muted">${activeOrdersTab === "history" ? "История заказов пока пуста." : "Текущих заказов пока нет."}</p>`;
        return;
      }
      ordersList.innerHTML = visibleOrders.map(orderMarkup).join("");
    }

    async function loadMyOrders() {
      if (!currentUser) {
        setStatus(ordersStatus, "Войдите в аккаунт, чтобы увидеть свои заказы.", "error");
        ordersList.innerHTML = '<p class="muted"><a class="link" href="login.html">Перейти ко входу</a></p>';
        return;
      }

      try {
        const data = await requestJSON(`${API_BASE}/my_orders.php`);
        ordersState = data.orders || [];
        setStatus(ordersStatus, "", "");
        renderMyOrders();
      } catch (error) {
        setStatus(ordersStatus, error.message, "error");
      }
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeOrdersTab = button.getAttribute("data-orders-tab") || "current";
        renderMyOrders();
      });
    });

    document.addEventListener("cart-ready", loadMyOrders, { once: true });
  }

  (async function init() {
    await loadUser();
    bindAddButtons();
    await Promise.all([loadCatalog(), loadCart()]);
    document.dispatchEvent(new Event("cart-ready"));
  }());
}());
