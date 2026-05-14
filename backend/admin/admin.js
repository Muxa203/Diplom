(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const form = $("[data-admin-product-form]");
  const status = $("[data-admin-status]");
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

  function fillForm(product) {
    form.elements.namedItem("id").value = product.id || "";
    form.elements.namedItem("name").value = product.name || "";
    form.elements.namedItem("description").value = product.description || "";
    form.elements.namedItem("price").value = product.price || "";
    form.elements.namedItem("image").value = product.image || "";
    form.elements.namedItem("category").value = product.category || "carnivorous";
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
}());
