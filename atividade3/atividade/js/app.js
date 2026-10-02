(() => {
  "use strict";

  const STORE_KEY = "petmania-store-v1";
  const SESSION_KEY = "petmania-session-v1";
  const ADMIN_EMAIL = "admin@petmania.com";
  const ADMIN_DEMO_PASSWORD = "petmania2026";
  const categories = ["Todas", "Alimentação", "Brinquedos", "Acessórios", "Conforto"];
  const productImages = {
    "p-1": "img/duo.jpg",
    "p-2": "img/bola-multi.jpg",
    "p-3": "img/cama-nuvem.jpg",
    "p-4": "img/coleira.jpg"
  };
  function productImage(product) {
    return product.image || productImages[product.id] || "";
  }
  function productVisual(product, cls) {
    const src = productImage(product);
    return src
      ? `<img class="${cls}" src="${escapeHTML(src)}" alt="${escapeHTML(product.name)}" loading="lazy">`
      : `<span aria-hidden="true">${escapeHTML(product.emoji)}</span>`;
  }
  const seedProducts = [
    { id: "p-1", name: "Comedouro Duo", description: "Praticidade e charme na hora da refeição.", category: "Alimentação", emoji: "🥣", price: 49.9, stock: 12 },
    { id: "p-2", name: "Bola Divertida", description: "Para deixar a brincadeira ainda mais animada.", category: "Brinquedos", emoji: "🎾", price: 24.9, stock: 18 },
    { id: "p-3", name: "Caminha Nuvem", description: "Um cantinho macio para sonhos tranquilos.", category: "Conforto", emoji: "🛏️", price: 129.9, stock: 7 },
    { id: "p-4", name: "Coleira Passeio", description: "Conforto e estilo para todos os passeios.", category: "Acessórios", emoji: "🦴", price: 39.9, stock: 15 },
    { id: "p-5", name: "Ratinho de Corda", description: "Diversão para os curiosos de plantão.", category: "Brinquedos", emoji: "🧶", price: 19.9, stock: 20 },
    { id: "p-6", name: "Pote Fresh", description: "Um jeitinho especial de servir água fresquinha.", category: "Alimentação", emoji: "🐾", price: 34.9, stock: 10 },
    { id: "p-7", name: "Manta Aconchego", description: "Maciez extra para os momentos de descanso.", category: "Conforto", emoji: "🧸", price: 69.9, stock: 9 },
    { id: "p-8", name: "Bandana Alegria", description: "Um toque de personalidade para seu pet.", category: "Acessórios", emoji: "🎀", price: 22.9, stock: 14 }
  ];
  const initialData = { products: seedProducts, users: [], orders: [], cart: [] };
  let data = loadData();
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  let selectedCategory = "Todas";
  let slideIndex = 0;
  let slideTimer;
  let toastTimer;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const currentUser = () => data.users.find(user => user.id === sessionId) || null;

  function loadData() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (!saved) return structuredClone(initialData);
      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.users) ||
          !Array.isArray(parsed.orders) || !Array.isArray(parsed.cart)) {
        throw new Error("Formato de dados salvo não reconhecido.");
      }
      return parsed;
    } catch (error) {
      console.error("Não foi possível carregar os dados locais da Petmania:", error);
      return structuredClone(initialData);
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Não foi possível salvar os dados locais da Petmania:", error);
      showToast("Não foi possível salvar. Verifique o armazenamento do navegador.");
      return false;
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("on"), 2600);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("on");
    document.body.classList.add("modal-open");
    const focusable = $("input:not([type=hidden]), button", modal);
    if (focusable) setTimeout(() => focusable.focus(), 30);
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("on");
    if (!$(".ov.on")) document.body.classList.remove("modal-open");
  }

  function showView(name) {
    if (name === "admin" && currentUser()?.role !== "admin") {
      showToast("Esta área é exclusiva para administradores.");
      return;
    }
    if (name === "conta" && !currentUser()) {
      openAuth();
      return;
    }
    $$(".view").forEach(view => view.classList.toggle("on", view.id === `v-${name}`));
    $$("#nav [data-view]").forEach(button => button.classList.toggle("on", button.dataset.view === name));
    $("#nav").classList.remove("open");
    $("#menu").setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "conta") renderAccount();
    if (name === "admin") renderAdmin();
  }

  function openAuth(tab = "login") {
    switchAuthTab(tab);
    openModal("authModal");
  }

  function switchAuthTab(tab) {
    $$("#authModal [data-auth-tab]").forEach(button => button.classList.toggle("on", button.dataset.authTab === tab));
    $("#loginForm").hidden = tab !== "login";
    $("#registerForm").hidden = tab !== "register";
    $("#loginError").textContent = "";
    $("#registerError").textContent = "";
  }

  function productCard(product) {
    const outOfStock = product.stock <= 0;
    return `<article class="pc">
      <div class="im">${productVisual(product, "pimg")}<span class="product-category">${escapeHTML(product.category)}</span></div>
      <div class="bd"><h3>${escapeHTML(product.name)}</h3><small>${escapeHTML(product.description)}</small>
        <div class="pr">${money(product.price)}</div>
        <button class="btn sec sm" data-add="${escapeHTML(product.id)}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Esgotado" : "Adicionar ao carrinho"}</button>
      </div>
    </article>`;
  }

  function renderHome() {
    $("#featuredGrid").innerHTML = data.products.slice(0, 4).map(productCard).join("") || emptyState("Ainda não há produtos no catálogo.");
  }

  function renderCategoryChips() {
    $("#categoryChips").innerHTML = categories.map(category =>
      `<button class="chip ${selectedCategory === category ? "on" : ""}" data-filter="${escapeHTML(category)}">${escapeHTML(category)}</button>`
    ).join("");
  }

  function renderProducts() {
    renderCategoryChips();
    const query = $("#searchInput").value.trim().toLocaleLowerCase("pt-BR");
    let products = data.products.filter(product =>
      (selectedCategory === "Todas" || product.category === selectedCategory) &&
      `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase("pt-BR").includes(query)
    );
    const sort = $("#sortSelect").value;
    if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
    if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    $("#productCount").textContent = `${products.length} ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}`;
    $("#productGrid").innerHTML = products.length ? products.map(productCard).join("") : emptyState("Não encontramos produtos com esses filtros.");
  }

  function emptyState(message) {
    return `<div class="empty-state"><span aria-hidden="true">🐾</span><p>${escapeHTML(message)}</p></div>`;
  }

  function cartDetails() {
    return data.cart.map(item => {
      const product = data.products.find(entry => entry.id === item.id);
      return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);
  }

  function renderCart() {
    const items = cartDetails();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    $("#cartCount").textContent = String(count);
    $("#cartItems").innerHTML = items.length ? items.map(item => `<div class="ci">
      <span class="e">${productVisual(item, "cimg")}</span><div><b>${escapeHTML(item.name)}</b><small>${money(item.price)} cada</small>
      <div class="q"><button data-quantity="${escapeHTML(item.id)}" data-change="-1" aria-label="Diminuir quantidade">−</button><span>${item.quantity}</span><button data-quantity="${escapeHTML(item.id)}" data-change="1" aria-label="Aumentar quantidade">+</button><button class="remove-item" data-remove="${escapeHTML(item.id)}" aria-label="Remover ${escapeHTML(item.name)}">Remover</button></div></div><b>${money(item.price * item.quantity)}</b>
    </div>`).join("") : emptyState("Seu carrinho está esperando por um novo favorito.");
    $("#cartSubtotal").textContent = money(total);
    $("#checkoutBtn").disabled = !items.length;
  }

  function addToCart(id) {
    const product = data.products.find(item => item.id === id);
    if (!product || product.stock <= 0) {
      showToast("Este produto não está disponível no momento.");
      return;
    }
    const entry = data.cart.find(item => item.id === id);
    if (entry && entry.quantity >= product.stock) {
      showToast("Você já adicionou todo o estoque disponível.");
      return;
    }
    if (entry) entry.quantity += 1;
    else data.cart.push({ id, quantity: 1 });
    if (persist()) {
      renderCart();
      showToast(`${product.name} adicionado ao carrinho!`);
    }
  }

  function changeQuantity(id, amount) {
    const cartItem = data.cart.find(item => item.id === id);
    const product = data.products.find(item => item.id === id);
    if (!cartItem || !product) return;
    const next = cartItem.quantity + amount;
    if (next <= 0) data.cart = data.cart.filter(item => item.id !== id);
    else if (next <= product.stock) cartItem.quantity = next;
    else {
      showToast("Você já adicionou todo o estoque disponível.");
      return;
    }
    if (persist()) renderCart();
  }

  function renderAccount() {
    const user = currentUser();
    if (!user) return;
    $("#accountGreeting").textContent = `Olá, ${user.name}! Aqui você encontra os detalhes da sua conta.`;
    $("#accountSummary").innerHTML = `<div><span>👤</span><p><b>${escapeHTML(user.name)}</b><br><small>${escapeHTML(user.email)}</small></p></div><p><b>Telefone</b><br>${escapeHTML(user.phone || "Não informado")}</p><p><b>Cliente desde</b><br>${formatDate(user.createdAt)}</p>`;
    const orders = data.orders.filter(order => order.userId === user.id);
    $("#myOrders").innerHTML = orders.length ? orders.slice().reverse().map(order => orderCard(order)).join("") : emptyState("Você ainda não tem pedidos. Seus próximos favoritos estão esperando na loja!");
  }

  function orderCard(order) {
    const lines = order.items.map(item => `${escapeHTML(item.emoji)} ${escapeHTML(item.name)} × ${item.quantity}`).join(" · ");
    return `<article class="order-card"><div><b>Pedido ${escapeHTML(order.id)}</b><span class="st">${escapeHTML(order.status)}</span></div><p>${lines}</p><div><small>${formatDate(order.createdAt)} · Envio por parceiro logístico</small><b>${money(order.total)}</b></div></article>`;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(date));
  }

  function renderAdmin() {
    renderAdminProducts();
    renderAdminCustomers();
    renderAdminOrders();
  }

  function renderAdminProducts() {
    $("#adminProductRows").innerHTML = data.products.length ? data.products.map(product => `<tr>
      <td><span class="table-product">${productVisual(product, "timg")} ${escapeHTML(product.name)}</span></td><td>${escapeHTML(product.category)}</td><td>${money(product.price)}</td><td>${product.stock}</td>
      <td><button class="table-action" data-edit-product="${escapeHTML(product.id)}">Editar</button><button class="table-action danger" data-delete-product="${escapeHTML(product.id)}">Excluir</button></td>
    </tr>`).join("") : `<tr><td colspan="5">Nenhum produto cadastrado.</td></tr>`;
  }

  function renderAdminCustomers() {
    $("#customerCount").textContent = `${data.users.filter(user => user.role !== "admin").length} clientes`;
    const customers = data.users.filter(user => user.role !== "admin");
    $("#customerRows").innerHTML = customers.length ? customers.map(user => `<tr>
      <td>${escapeHTML(user.name)}</td><td>${escapeHTML(user.email)}</td><td>${escapeHTML(user.phone || "—")}</td><td>${formatDate(user.createdAt)}</td>
    </tr>`).join("") : `<tr><td colspan="4">Ainda não há clientes cadastrados.</td></tr>`;
  }

  function renderAdminOrders() {
    $("#adminOrderRows").innerHTML = data.orders.length ? data.orders.slice().reverse().map(order => `<tr>
      <td>${escapeHTML(order.id)}</td><td>${escapeHTML(order.customerName)}<br><small>${escapeHTML(order.email)}</small></td><td>${formatDate(order.createdAt)}</td><td>${money(order.total)}</td>
      <td><span class="st">${escapeHTML(order.status)}</span></td><td><button class="table-action" data-cycle-order="${escapeHTML(order.id)}">Atualizar status</button></td>
    </tr>`).join("") : `<tr><td colspan="6">Nenhum pedido recebido.</td></tr>`;
  }

  function openProductEditor(product) {
    const form = $("#productForm");
    form.reset();
    form.elements.id.value = product?.id || "";
    form.elements.name.value = product?.name || "";
    form.elements.description.value = product?.description || "";
    form.elements.category.value = product?.category || "Alimentação";
    form.elements.emoji.value = product?.emoji || "🐾";
    form.elements.price.value = product?.price ?? "";
    form.elements.stock.value = product?.stock ?? 0;
    $("#productModalTitle").textContent = product ? "Editar produto" : "Novo produto";
    $("#productError").textContent = "";
    openModal("productModal");
  }

  async function hashPassword(password, salt) {
    if (!window.crypto?.subtle) throw new Error("Este navegador não oferece criptografia segura. Abra o site em uma conexão segura para criar conta.");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
    return [...new Uint8Array(bits)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function setSession(user) {
    sessionId = user.id;
    sessionStorage.setItem(SESSION_KEY, user.id);
    $("#accountBtn").innerHTML = `<span aria-hidden="true">${user.role === "admin" ? "⚙" : "♙"}</span><span class="action-label"> ${user.role === "admin" ? "Painel" : escapeHTML(user.name.split(" ")[0])}</span>`;
    $("#accountBtn").setAttribute("aria-label", user.role === "admin" ? "Abrir painel administrativo" : "Abrir minha conta");
  }

  function clearSession() {
    sessionId = null;
    sessionStorage.removeItem(SESSION_KEY);
    $("#accountBtn").innerHTML = '<span aria-hidden="true">♙</span><span class="action-label"> Entrar</span>';
    $("#accountBtn").setAttribute("aria-label", "Entrar ou acessar minha conta");
  }

  function initCarousel() {
    const slides = $$(".sl");
    const dots = $(".dots");
    dots.innerHTML = slides.map((_, index) => `<button aria-label="Mostrar destaque ${index + 1}" class="${index === 0 ? "on" : ""}" data-slide="${index}"></button>`).join("");
    const activate = index => {
      slideIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("on", i === slideIndex));
      $$(".dots button").forEach((dot, i) => dot.classList.toggle("on", i === slideIndex));
    };
    const startCarousel = () => {
      if (slideTimer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      slideTimer = setInterval(() => activate(slideIndex + 1), 5500);
    };
    const stopCarousel = () => {
      clearInterval(slideTimer);
      slideTimer = null;
    };
    $(".arr.prev").addEventListener("click", () => activate(slideIndex - 1));
    $(".arr.next").addEventListener("click", () => activate(slideIndex + 1));
    dots.addEventListener("click", event => {
      const dot = event.target.closest("[data-slide]");
      if (dot) activate(Number(dot.dataset.slide));
    });
    startCarousel();
    $(".car").addEventListener("mouseenter", stopCarousel);
    $(".car").addEventListener("mouseleave", startCarousel);
    $(".car").addEventListener("focusin", stopCarousel);
    $(".car").addEventListener("focusout", startCarousel);
  }

  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      const view = viewButton.dataset.view;
      if (viewButton.dataset.category) {
        selectedCategory = viewButton.dataset.category;
        renderProducts();
      }
      showView(view);
      return;
    }
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      selectedCategory = categoryButton.dataset.category;
      renderProducts();
      showView("produtos");
      return;
    }
    const addButton = event.target.closest("[data-add]");
    if (addButton) { addToCart(addButton.dataset.add); return; }
    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      selectedCategory = filterButton.dataset.filter;
      renderProducts();
      return;
    }
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) { changeQuantity(quantityButton.dataset.quantity, Number(quantityButton.dataset.change)); return; }
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      data.cart = data.cart.filter(item => item.id !== removeButton.dataset.remove);
      if (persist()) renderCart();
      return;
    }
    const closeButton = event.target.closest("[data-close]");
    if (closeButton) { closeModal(closeButton.dataset.close); return; }
    const authTab = event.target.closest("[data-auth-tab]");
    if (authTab) { switchAuthTab(authTab.dataset.authTab); return; }
    const adminTab = event.target.closest("[data-admin-tab]");
    if (adminTab) {
      $$("#adminTabs [data-admin-tab]").forEach(button => button.classList.toggle("on", button === adminTab));
      $$(".admin-panel").forEach(panel => { panel.hidden = panel.id !== `admin-${adminTab.dataset.adminTab}`; });
      return;
    }
    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) { openProductEditor(data.products.find(product => product.id === editButton.dataset.editProduct)); return; }
    const deleteButton = event.target.closest("[data-delete-product]");
    if (deleteButton) {
      const product = data.products.find(item => item.id === deleteButton.dataset.deleteProduct);
      if (product && window.confirm(`Excluir "${product.name}" do catálogo?`)) {
        data.products = data.products.filter(item => item.id !== product.id);
        data.cart = data.cart.filter(item => item.id !== product.id);
        if (persist()) { renderAdmin(); renderProducts(); renderHome(); renderCart(); showToast("Produto excluído."); }
      }
      return;
    }
    const cycleOrder = event.target.closest("[data-cycle-order]");
    if (cycleOrder) {
      const order = data.orders.find(item => item.id === cycleOrder.dataset.cycleOrder);
      if (order) {
        const statuses = ["Recebido", "Em preparação", "Enviado pelo parceiro", "Concluído"];
        order.status = statuses[(statuses.indexOf(order.status) + 1) % statuses.length];
        if (persist()) { renderAdminOrders(); showToast(`Status atualizado: ${order.status}.`); }
      }
      return;
    }
    if (event.target.classList.contains("ov")) closeModal(event.target.id);
  });

  $("#menu").addEventListener("click", () => {
    const isOpen = $("#nav").classList.toggle("open");
    $("#menu").setAttribute("aria-expanded", String(isOpen));
  });
  $("#accountBtn").addEventListener("click", () => {
    const user = currentUser();
    if (!user) openAuth();
    else showView(user.role === "admin" ? "admin" : "conta");
  });
  $("#cartBtn").addEventListener("click", () => { renderCart(); openModal("drawer"); });
  $("#searchInput").addEventListener("input", renderProducts);
  $("#sortSelect").addEventListener("change", renderProducts);
  $("#addProductBtn").addEventListener("click", () => openProductEditor(null));
  $("#checkoutBtn").addEventListener("click", () => {
    if (!cartDetails().length) return;
    closeModal("drawer");
    const user = currentUser();
    const form = $("#checkoutForm");
    form.elements.name.value = user?.name || "";
    form.elements.email.value = user?.email || "";
    $("#checkoutTotal").textContent = money(cartDetails().reduce((sum, item) => sum + item.price * item.quantity, 0));
    $("#checkoutError").textContent = "";
    openModal("checkoutModal");
  });
  $("#logoutBtn").addEventListener("click", () => {
    clearSession();
    showView("inicio");
    showToast("Você saiu da sua conta.");
  });

  $("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;
    const error = $("#loginError");
    error.textContent = "";
    try {
      if (email === ADMIN_EMAIL && password === ADMIN_DEMO_PASSWORD) {
        let admin = data.users.find(user => user.email === ADMIN_EMAIL);
        if (!admin) {
          admin = { id: "admin-demo", name: "Administrador Petmania", email: ADMIN_EMAIL, phone: "", role: "admin", createdAt: new Date().toISOString() };
          data.users.push(admin);
          if (!persist()) return;
        }
        setSession(admin);
        closeModal("authModal");
        form.reset();
        showView("admin");
        showToast("Bem-vindo ao painel administrativo de demonstração.");
        return;
      }
      const user = data.users.find(entry => entry.email === email && entry.role !== "admin");
      if (!user || !user.passwordHash || await hashPassword(password, user.passwordSalt) !== user.passwordHash) {
        error.textContent = "E-mail ou senha incorretos.";
        return;
      }
      setSession(user);
      closeModal("authModal");
      form.reset();
      showView("conta");
      showToast(`Bem-vindo(a), ${user.name.split(" ")[0]}!`);
    } catch (exception) {
      console.error("Falha ao autenticar:", exception);
      error.textContent = exception.message || "Não foi possível entrar. Tente novamente.";
    }
  });

  $("#registerForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = $("#registerError");
    error.textContent = "";
    const email = form.elements.email.value.trim().toLowerCase();
    if (data.users.some(user => user.email === email)) {
      error.textContent = "Este e-mail já possui cadastro. Entre na sua conta.";
      return;
    }
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const passwordSalt = [...salt].map(byte => byte.toString(16).padStart(2, "0")).join("");
      const user = {
        id: `u-${crypto.randomUUID()}`,
        name: form.elements.name.value.trim(),
        email,
        phone: form.elements.phone.value.trim(),
        passwordSalt,
        passwordHash: await hashPassword(form.elements.password.value, passwordSalt),
        role: "customer",
        createdAt: new Date().toISOString()
      };
      data.users.push(user);
      if (!persist()) {
        data.users = data.users.filter(entry => entry.id !== user.id);
        return;
      }
      setSession(user);
      closeModal("authModal");
      form.reset();
      showView("conta");
      showToast("Sua conta foi criada com sucesso!");
    } catch (exception) {
      console.error("Falha ao criar conta:", exception);
      error.textContent = exception.message || "Não foi possível criar sua conta. Tente novamente.";
    }
  });

  $("#productForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.elements.id.value;
    const product = {
      id: id || `p-${crypto.randomUUID()}`,
      name: form.elements.name.value.trim(),
      description: form.elements.description.value.trim(),
      category: form.elements.category.value,
      emoji: form.elements.emoji.value.trim(),
      price: Number(form.elements.price.value),
      stock: Number(form.elements.stock.value)
    };
    if (!Number.isFinite(product.price) || product.price <= 0 || !Number.isInteger(product.stock) || product.stock < 0) {
      $("#productError").textContent = "Confira o preço e o estoque informados.";
      return;
    }
    if (id) data.products = data.products.map(item => item.id === id ? product : item);
    else data.products.push(product);
    if (persist()) {
      closeModal("productModal");
      renderAdmin();
      renderProducts();
      renderHome();
      renderCart();
      showToast(id ? "Produto atualizado." : "Produto adicionado ao catálogo.");
    }
  });

  $("#checkoutForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const items = cartDetails();
    const error = $("#checkoutError");
    error.textContent = "";
    if (!items.length) {
      error.textContent = "Seu carrinho está vazio.";
      return;
    }
    const unavailable = items.find(item => item.quantity > item.stock);
    if (unavailable) {
      error.textContent = `Estoque insuficiente para ${unavailable.name}. Atualize o carrinho e tente novamente.`;
      renderCart();
      return;
    }
    const order = {
      id: `PM-${Date.now().toString().slice(-7)}`,
      userId: currentUser()?.id || null,
      customerName: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      address: form.elements.address.value.trim(),
      zip: form.elements.zip.value.trim(),
      items: items.map(item => ({ id: item.id, name: item.name, emoji: item.emoji, quantity: item.quantity, price: item.price })),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: "Recebido",
      createdAt: new Date().toISOString()
    };
    const oldProducts = data.products.map(product => ({ ...product }));
    data.products = data.products.map(product => {
      const ordered = items.find(item => item.id === product.id);
      return ordered ? { ...product, stock: product.stock - ordered.quantity } : product;
    });
    data.orders.push(order);
    data.cart = [];
    if (!persist()) {
      data.products = oldProducts;
      data.orders = data.orders.filter(item => item.id !== order.id);
      data.cart = items.map(item => ({ id: item.id, quantity: item.quantity }));
      return;
    }
    closeModal("checkoutModal");
    form.reset();
    renderCart();
    renderProducts();
    renderHome();
    showToast(`Pedido ${order.id} recebido!`);
    const user = currentUser();
    if (user?.role === "admin") showView("admin");
    else if (user) showView("conta");
    else showView("inicio");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const modal = $(".ov.on");
      if (modal) closeModal(modal.id);
    }
  });

  $("#year").textContent = String(new Date().getFullYear());
  if (currentUser()) setSession(currentUser());
  renderHome();
  renderProducts();
  renderCart();
  initCarousel();

  if (!localStorage.getItem(STORE_KEY)) persist();

  if (location.protocol === "file:" && !window.crypto?.subtle) {
    console.warn("A autenticação segura requer servir o protótipo por HTTPS ou localhost.");
  }
})();
