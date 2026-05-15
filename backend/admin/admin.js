(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const form = $("[data-admin-product-form]");
  const status = $("[data-admin-status]");
  const orderStatus = $("[data-admin-order-status]");
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message || "";
    status.classList.remove("status-success", "status-error");
    if (type === "success") status.classList.add("status-success");
    if (type === "error") status.classList.add("status-error");
  }

  async function requestAdmin(action, body) {
    const response = await fetch(`../../api/admin_products.php?action=${action}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({ success: false, message: "Некорректный ответ сервера." }));
    if (!response.ok || !data.success) throw new Error(data.message || "Операция не выполнена.");
    return data;
  }

  async function updateOrderStatus(orderId, nextStatus) {
    const response = await fetch("../../api/admin_orders.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status: nextStatus })
    });
    const data = await response.json().catch(() => ({ success: false, message: "Некорректный ответ сервера." }));
    if (!response.ok || !data.success) throw new Error(data.message || "Статус не сохранён.");
    return data;
  }

  function setOrderStatus(message, type) {
    if (!orderStatus) return;
    orderStatus.textContent = message || "";
    orderStatus.classList.remove("status-success", "status-error");
    if (type === "success") orderStatus.classList.add("status-success");
    if (type === "error") orderStatus.classList.add("status-error");
  }

  function setRowStatus(row, statusValue) {
    if (!row) return;
    row.classList.remove("order-status-new", "order-status-processing", "order-status-shipped", "order-status-delivered", "order-status-cancelled");
    row.classList.add(`order-status-${statusValue}`);
  }

  function readForm() {
    return {
      id: form.elements.namedItem("id").value,
      name: form.elements.namedItem("name").value.trim(),
      description: form.elements.namedItem("description").value.trim(),
      price: form.elements.namedItem("price").value,
      image: form.elements.namedItem("image").value.trim(),
      category: form.elements.namedItem("category").value
    };
  }

  const imgPreview = $("#admin-img-preview");
  const imgPath = $("#admin-img-path");
  const imgFile = $("#admin-img-file");

  function updateImgPreview(path) {
    if (!imgPreview) return;
    if (path) {
      imgPreview.src = "../../frontend/" + path;
      imgPreview.style.display = "";
    } else {
      imgPreview.src = "";
      imgPreview.style.display = "none";
    }
  }

  if (imgPath) {
    imgPath.addEventListener("input", () => updateImgPreview(imgPath.value.trim()));
  }

  if (imgFile) {
    imgFile.addEventListener("change", async () => {
      const file = imgFile.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("image", file);
      try {
        const resp = await fetch("../../api/admin_upload.php", {
          method: "POST",
          credentials: "same-origin",
          body: fd
        });
        const data = await resp.json().catch(() => ({ success: false, message: "Ошибка сервера." }));
        if (!data.success) throw new Error(data.message);
        if (imgPath) imgPath.value = data.path;
        updateImgPreview(data.path);
        setStatus("Файл загружен: " + data.path, "success");
      } catch (err) {
        setStatus(err.message, "error");
      } finally {
        imgFile.value = "";
      }
    });
  }

  function fillForm(product) {
    form.elements.namedItem("id").value = product.id || "";
    form.elements.namedItem("name").value = product.name || "";
    form.elements.namedItem("description").value = product.description || "";
    form.elements.namedItem("price").value = product.price || "";
    form.elements.namedItem("image").value = product.image || "";
    form.elements.namedItem("category").value = product.category || "carnivorous";
    updateImgPreview(product.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$('[data-admin-edit]').forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      if (!row) return;
      fillForm(JSON.parse(row.getAttribute("data-product") || "{}"));
    });
  });

  $$('[data-admin-delete]').forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Удалить товар?")) return;
      try {
        await requestAdmin("delete", { id: button.getAttribute("data-admin-delete") });
        location.reload();
      } catch (error) {
        setStatus(error.message, "error");
      }
    });
  });

  $("[data-admin-reset]")?.addEventListener("click", () => {
    form.reset();
    form.elements.namedItem("id").value = "";
    setStatus("", "");
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm();
    const action = data.id ? "update" : "create";
    try {
      await requestAdmin(action, data);
      setStatus("Товар сохранён.", "success");
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  $$("[data-order-status-select]").forEach((select) => {
    select.addEventListener("change", async () => {
      const previous = select.dataset.previous || select.defaultValue || select.value;
      const next = select.value;
      select.disabled = true;
      setOrderStatus("", "");
      try {
        await updateOrderStatus(select.getAttribute("data-order-status-select"), next);
        select.dataset.previous = next;
        setRowStatus(select.closest("[data-order-row]"), next);
        setOrderStatus("Статус заказа сохранён.", "success");
      } catch (error) {
        select.value = previous;
        setOrderStatus(error.message, "error");
      } finally {
        select.disabled = false;
      }
    });
    select.dataset.previous = select.value;
  });
}());
