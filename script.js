/* Exotic Flora interactivity v4.1 */
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const CART_KEY = "exoticflora_cart_v2";
  const LAST_ORDER_KEY = "exoticflora_last_order_v1";
  const NEWSLETTER_KEY = "exoticflora_newsletter_v1";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readCart() {
    return readJSON(CART_KEY, []);
  }

  function writeCart(items) {
    writeJSON(CART_KEY, items);
  }

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

  function getProductPrice(card) {
    const priceEl = $(".price", card);
    const raw = priceEl ? priceEl.textContent : "0";
    return Number(String(raw).replace(/[^\d]/g, "")) || 0;
  }

  function cartCount() {
    return readCart().length;
  }

  function cartTotal(items) {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }

  function groupCart(items) {
    const map = new Map();
    items.forEach((item) => {
      const key = `${item.name}__${item.price}`;
      if (!map.has(key)) {
        map.set(key, { name: item.name, price: item.price, qty: 0 });
      }
      map.get(key).qty += 1;
    });
    return Array.from(map.values());
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
      if (header) {
        document.documentElement.style.setProperty("--mobile-nav-top", `${header.offsetHeight + 8}px`);
      }
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

    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    navBackdrop.addEventListener("click", closeNav);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
      }
    });

    window.addEventListener("resize", () => {
      syncNavOffset();
      if (window.innerWidth > 860) {
        closeNav();
      }
    });

    syncNavOffset();

    $$(".nav-link", nav).forEach((link) => {
      link.addEventListener("click", closeNav);
    });
  }

  function updateCartBadges() {
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = String(cartCount());
    });
  }
  updateCartBadges();

  $$("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-add-to-cart") || "Товар";
      const card = button.closest(".product-card");
      const price = card ? getProductPrice(card) : 0;
      const items = readCart();
      items.push({ name, price });
      writeCart(items);
      updateCartBadges();

      const prevText = button.textContent;
      button.textContent = "Добавлено ✓";
      button.disabled = true;

      setTimeout(() => {
        button.textContent = prevText;
        button.disabled = false;
      }, 900);
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

    const items = readCart();
    cartList.innerHTML = "";

    if (!items.length) {
      cartEmptyEl.style.display = "block";
      cartTotalEl.textContent = formatRUB(0);
      return;
    }

    cartEmptyEl.style.display = "none";
    let total = 0;

    items.forEach((item, index) => {
      total += Number(item.price) || 0;
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${item.name}</span>
        <span>
          <strong>${formatRUB(item.price)}</strong>
          <button type="button" data-remove="${index}">Удалить</button>
        </span>
      `;
      cartList.appendChild(li);
    });

    cartTotalEl.textContent = formatRUB(total);

    $$("[data-remove]", cartList).forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-remove"));
        const next = readCart().filter((_, i) => i !== index);
        writeCart(next);
        updateCartBadges();
        renderCartModal();
      });
    });
  }

  function openCart() {
    if (!cartModal) return;
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

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      window.location.href = "checkout.html";
    });
  }

  const productsRoot = $("[data-products]");
  const filterButtons = $$("[data-filter]");
  const searchInput = $("[data-catalog-search]");
  const pageButtons = $$("[data-page]");

  let currentFilter = "all";
  let currentPage = 1;
  let searchQuery = "";

  function getTitle(card) {
    return ($(".product-title", card)?.textContent || "").trim().toLowerCase();
  }


  function applyCatalog() {
    if (!productsRoot) return;

    const pagingEnabled = currentFilter === "all" && !searchQuery;

    filterButtons.forEach((button) => {
      const value = button.getAttribute("data-filter") || "all";
      button.classList.toggle("is-active", value === currentFilter);
    });

    pageButtons.forEach((button) => {
      const page = Number(button.getAttribute("data-page") || "1");
      button.classList.toggle("is-active", pagingEnabled ? page === currentPage : page === 1);
      button.disabled = !pagingEnabled;
      button.setAttribute("aria-disabled", String(!pagingEnabled));
    });

    $$(".product-card", productsRoot).forEach((card) => {
      const category = card.getAttribute("data-category") || "";
      const page = Number(card.getAttribute("data-page") || "1");
      const categoryOk = currentFilter === "all" ? true : category === currentFilter;
      const searchOk = searchQuery ? getTitle(card).includes(searchQuery) : true;
      const pageOk = pagingEnabled ? page === currentPage : true;
      card.style.display = categoryOk && searchOk && pageOk ? "" : "none";
    });
  }

  if (productsRoot) {
    const hash = (location.hash || "").replace("#", "");
    if (["carnivorous", "succulents", "tropical", "rare"].includes(hash)) {
      currentFilter = hash;
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentFilter = button.getAttribute("data-filter") || "all";
        currentPage = 1;
        applyCatalog();
      });
    });

    pageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (currentFilter !== "all" || searchQuery) return;
        currentPage = Number(button.getAttribute("data-page") || "1");
        applyCatalog();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = String(searchInput.value || "").trim().toLowerCase();
        currentPage = 1;
        applyCatalog();
      });
    }

    applyCatalog();
  }

  $$("[data-post-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-post-toggle");
      const more = id ? document.querySelector(`[data-post-more="${id}"]`) : null;
      if (!more) return;

      const isHidden = more.hasAttribute("hidden");
      if (isHidden) {
        more.removeAttribute("hidden");
        button.textContent = "Свернуть ↑";
        button.setAttribute("aria-expanded", "true");
      } else {
        more.setAttribute("hidden", "");
        button.textContent = "Читать далее →";
        button.setAttribute("aria-expanded", "false");
        button.closest(".post")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

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

    function getDeliveryCost(delivery, items) {
      if (!items.length) return 0;
      if (delivery === "courier") return 600;
      return 0;
    }

    function removeOne(name, price) {
      const items = readCart();
      const index = items.findIndex((item) => item.name === name && item.price === price);
      if (index >= 0) items.splice(index, 1);
      writeCart(items);
    }

    function addOne(name, price) {
      const items = readCart();
      items.push({ name, price });
      writeCart(items);
    }

    function removeAll(name, price) {
      writeCart(readCart().filter((item) => !(item.name === name && item.price === price)));
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
      const items = readCart();
      const delivery = orderForm.elements.namedItem("delivery");
      const deliveryValue = delivery ? String(delivery.value || "") : "";
      const subtotal = cartTotal(items);
      const deliveryCost = getDeliveryCost(deliveryValue, items);
      const grand = subtotal + deliveryCost;

      if (subtotalEl) subtotalEl.textContent = formatRUB(subtotal);
      if (deliverySumEl) deliverySumEl.textContent = formatRUB(deliveryCost);
      if (grandEl) grandEl.textContent = formatRUB(grand);
    }

    function renderCheckout() {
      if (!listEl || !emptyEl || !totalEl || !countEl) return;

      const items = readCart();
      const grouped = groupCart(items);
      listEl.innerHTML = "";
      countEl.textContent = String(items.length);

      if (!items.length) {
        emptyEl.style.display = "block";
        totalEl.textContent = formatRUB(0);
        if (submitBtn) submitBtn.disabled = true;
        updateCheckoutSummary();
        return;
      }

      emptyEl.style.display = "none";
      if (submitBtn) submitBtn.disabled = false;

      grouped.forEach((groupedItem) => {
        const li = document.createElement("li");
        li.className = "checkout-item";
        li.innerHTML = `
          <div>
            <div class="checkout-item-title">${groupedItem.name}</div>
            <div class="muted small">${formatRUB(groupedItem.price)} за шт.</div>
          </div>
          <div class="checkout-controls">
            <button class="qty-btn" type="button" data-minus>−</button>
            <span class="qty" aria-label="Количество">${groupedItem.qty}</span>
            <button class="qty-btn" type="button" data-plus>+</button>
            <button class="remove-btn" type="button" data-removeall>Удалить</button>
          </div>
        `;
        li.querySelector("[data-minus]")?.addEventListener("click", () => {
          removeOne(groupedItem.name, groupedItem.price);
          renderCheckout();
          updateCartBadges();
        });
        li.querySelector("[data-plus]")?.addEventListener("click", () => {
          addOne(groupedItem.name, groupedItem.price);
          renderCheckout();
          updateCartBadges();
        });
        li.querySelector("[data-removeall]")?.addEventListener("click", () => {
          removeAll(groupedItem.name, groupedItem.price);
          renderCheckout();
          updateCartBadges();
        });
        listEl.appendChild(li);
      });

      totalEl.textContent = formatRUB(cartTotal(items));
      updateCheckoutSummary();
    }

    renderCheckout();

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

      ["fullname", "phone", "email", "city", "address"].forEach((name) => {
        const el = orderForm.elements.namedItem(name);
        el?.addEventListener("input", () => {
          setInvalid(el.closest(".field"), false);
          setStatus(orderStatus, "", "");
        });
      });

      ["delivery", "payment", "agree"].forEach((name) => {
        const el = orderForm.elements.namedItem(name);
        el?.addEventListener("change", () => {
          setInvalid(el.closest(".field"), false);
          setStatus(orderStatus, "", "");
          if (name === "delivery") updateCheckoutSummary();
        });
      });

      orderForm.addEventListener("submit", (event) => {
        event.preventDefault();
        setStatus(orderStatus, "", "");

        const items = readCart();
        if (!items.length) {
          setStatus(orderStatus, "Корзина пуста — сначала добавьте растения в каталоге.", "error");
          return;
        }

        const fullname = orderForm.elements.namedItem("fullname");
        const phone = orderForm.elements.namedItem("phone");
        const email = orderForm.elements.namedItem("email");
        const city = orderForm.elements.namedItem("city");
        const address = orderForm.elements.namedItem("address");
        const delivery = orderForm.elements.namedItem("delivery");
        const payment = orderForm.elements.namedItem("payment");
        const agree = orderForm.elements.namedItem("agree");

        const deliveryValue = delivery ? String(delivery.value || "") : "";
        const pickup = deliveryValue === "pickup";

        const fullnameOk = fullname && String(fullname.value).trim().length >= 3;
        const phoneOk = phone && isValidPhone(phone.value);
        const emailOk = email && isValidEmail(email.value);
        const cityOk = city && String(city.value).trim().length >= 2;
        const addressOk = pickup ? true : Boolean(address && String(address.value).trim().length >= 6);
        const deliveryOk = delivery && deliveryValue.length > 0;
        const paymentOk = payment && String(payment.value || "").trim().length > 0;
        const agreeOk = agree && agree.checked === true;

        setInvalid(fullname?.closest(".field"), !fullnameOk);
        setInvalid(phone?.closest(".field"), !phoneOk);
        setInvalid(email?.closest(".field"), !emailOk);
        setInvalid(city?.closest(".field"), !cityOk);
        setInvalid(address?.closest(".field"), !addressOk);
        setInvalid(delivery?.closest(".field"), !deliveryOk);
        setInvalid(payment?.closest(".field"), !paymentOk);
        setInvalid(agree?.closest(".field"), !agreeOk);

        if (fullnameOk && phoneOk && emailOk && cityOk && addressOk && deliveryOk && paymentOk && agreeOk) {
          const subtotal = cartTotal(items);
          const deliveryCost = getDeliveryCost(deliveryValue, items);
          const orderNumber = "EF-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(Date.now()).slice(-5);

          writeJSON(LAST_ORDER_KEY, {
            number: orderNumber,
            items: groupCart(items),
            subtotal,
            deliveryCost,
            total: subtotal + deliveryCost
          });

          writeCart([]);
          updateCartBadges();
          renderCheckout();
          orderForm.reset();

          const cityEl = orderForm.elements.namedItem("city");
          if (cityEl) cityEl.value = "Новосибирск";
          updateAddressState();
          updateCheckoutSummary();

          setStatus(
            orderStatus,
            `Заказ ${orderNumber} успешно оформлен. Итоговая сумма: ${formatRUB(subtotal + deliveryCost)}. Менеджер свяжется для подтверждения.`,
            "success"
          );
        } else {
          setStatus(orderStatus, "Проверьте поля, отмеченные красным.", "error");
        }
      });
    }
  }

  const contactForm = $("[data-contact-form]");
  const contactStatus = $("[data-form-status]");
  if (contactForm) {
    const contactEmail = contactForm.elements.namedItem("email");
    if (contactEmail) {
      contactEmail.addEventListener("input", () => setInvalid(contactEmail.closest(".field"), false));
    }

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

      if (nameOk && emailOk && subjectOk && messageOk) {
        contactForm.reset();
        setStatus(contactStatus, "Сообщение успешно отправлено. Ответ поступит в течение рабочего дня.", "success");
      } else {
        setStatus(contactStatus, "Проверьте поля, отмеченные красным.", "error");
      }
    });
  }

  const subscribeForm = $("[data-subscribe-form]");
  const subscribeStatus = $("[data-subscribe-status]");
  if (subscribeForm) {
    subscribeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("input[type='email']", subscribeForm);
      const value = String(input?.value || "").trim();

      if (!isValidEmail(value)) {
        setStatus(subscribeStatus, "Укажите корректный email для подписки.", "error");
        return;
      }

      writeJSON(NEWSLETTER_KEY, { email: value, subscribedAt: new Date().toISOString() });
      subscribeForm.reset();
      setStatus(subscribeStatus, "Подписка оформлена. Полезные материалы будут приходить 1–2 раза в месяц.", "success");
    });
  }
})();
