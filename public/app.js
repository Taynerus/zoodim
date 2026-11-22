// ==========================================
// 0. БЕЗПЕКА (ЗАХИСТ ВІД XSS) ТА УТИЛІТИ
// ==========================================
function escapeHTML(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// 1. ПЕРЕМИКАЧ ТЕМИ (LocalStorage)
// ==========================================
const themeToggle = document.getElementById('theme-toggle');

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
}
applySavedTheme();

// ==========================================
// 2. КОШИК (СТАН У LocalStorage + ЛІЧИЛЬНИК)
// ==========================================
let cart = JSON.parse(localStorage.getItem('zoodim_cart')) || [];
let appliedPromo = { code: null, discountPercent: 0 };
const cartBadge = document.getElementById('cart-badge-count');

function updateCartBadge() {
    if (!cartBadge) return;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.innerText = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
}

function addToCart(product, triggerBtn) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            quantity: 1
        });
    }

    localStorage.setItem('zoodim_cart', JSON.stringify(cart));
    updateCartBadge();

    if (triggerBtn) {
        const originalText = triggerBtn.innerText;
        triggerBtn.innerText = 'Додано ✓';
        triggerBtn.style.backgroundColor = 'var(--color-success)';
        setTimeout(() => {
            triggerBtn.innerText = originalText;
            triggerBtn.style.backgroundColor = '';
        }, 1200);
    }
}

updateCartBadge();

// ==========================================
// 3. КАТАЛОГ ТОВАРІВ (GET /api/products)
// ==========================================
const productsGrid = document.getElementById('products-grid');
const filterCheckboxes = document.querySelectorAll('input[data-filter]');
const searchInput = document.getElementById('search-input');

async function loadProducts() {
    if (!productsGrid) return;

    const selectedCategories = Array.from(filterCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.dataset.filter);

    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
        params.set('category', selectedCategories.join(','));
    }
    if (searchInput && searchInput.value.trim()) {
        params.set('search', searchInput.value.trim());
    }

    productsGrid.innerHTML = '<p style="color: var(--text-secondary);">Завантаження товарів...</p>';

    try {
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/products${query}`);
        if (!response.ok) throw new Error('Не вдалося завантажити каталог.');

        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        productsGrid.innerHTML = `<p style="color: var(--color-error);">Помилка: ${escapeHTML(error.message)}</p>`;
    }
}

function renderProducts(products) {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
    resultsCount.textContent = `Знайдено товарів: ${products.length}`;
}
    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = '<p style="color: var(--text-secondary);">За вашим запитом товарів не знайдено.</p>';
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <article class="product-card" data-category="${escapeHTML(product.category)}">
            ${product.badge ? `<span class="card-badge ${escapeHTML(product.badge_class || 'badge-sale')}">${escapeHTML(product.badge)}</span>` : ''}
            <img src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${escapeHTML(product.name)}</h3>
                <p class="product-weight">Вага: ${escapeHTML(product.weight)}</p>
                <div class="product-price">
                    <span class="price-current">${product.price} грн</span>
                    ${product.old_price ? `<span class="price-old">${product.old_price} грн</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-add-cart"
                            data-id="${escapeHTML(product.id)}"
                            data-name="${escapeHTML(product.name)}"
                            data-price="${product.price}"
                            data-image="${escapeHTML(product.image_url)}">
                        В кошик
                    </button>
                    <button class="btn btn-secondary btn-quick-order"
                            data-id="${escapeHTML(product.id)}"
                            data-name="${escapeHTML(product.name)}"
                            data-price="${product.price}">
                        В 1 клік
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

// Делегування кліків у каталозі ("В кошик" та "В 1 клік")
if (productsGrid) {
    productsGrid.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.btn-add-cart');
        if (addBtn) {
            addToCart({
                id: addBtn.dataset.id,
                name: addBtn.dataset.name,
                price: addBtn.dataset.price,
                image: addBtn.dataset.image
            }, addBtn);
            return;
        }

        const quickBtn = e.target.closest('.btn-quick-order');
        if (quickBtn) {
            openQuickOrderModal({
                id: quickBtn.dataset.id,
                name: quickBtn.dataset.name,
                price: Number(quickBtn.dataset.price)
            });
        }
    });

    filterCheckboxes.forEach(cb => cb.addEventListener('change', loadProducts));

    if (searchInput) {
        let searchTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadProducts, 300);
        });
    }

    loadProducts();
}

// ==========================================
// 4. МОДАЛЬНЕ ВІКНО "КУПИТИ В 1 КЛІК" (POST /api/orders)
// ==========================================
const quickOrderModal = document.getElementById('quick-order-modal');
const quickOrderForm = document.getElementById('quick-order-form');
let selectedQuickProduct = null;

function openQuickOrderModal(product) {
    if (!quickOrderModal) return;
    selectedQuickProduct = product;

    const titleTarget = quickOrderModal.querySelector('#modal-product-name, .modal-product-name');
    if (titleTarget) titleTarget.textContent = product.name;

    quickOrderModal.classList.add('active');
}

function closeQuickOrderModal() {
    if (quickOrderModal) quickOrderModal.classList.remove('active');
}

if (quickOrderModal) {
    const closeBtn = quickOrderModal.querySelector('.modal-close');
    const backdrop = quickOrderModal.querySelector('.modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeQuickOrderModal);
    if (backdrop) backdrop.addEventListener('click', closeQuickOrderModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && quickOrderModal.classList.contains('active')) {
            closeQuickOrderModal();
        }
    });
}

if (quickOrderForm) {
    quickOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = quickOrderForm.querySelector('input[type="text"]');
        const phoneInput = quickOrderForm.querySelector('input[type="tel"]');

        const payload = {
            customerName: nameInput ? nameInput.value.trim() : '',
            phone: phoneInput ? phoneInput.value.trim() : '',
            orderType: 'quick',
            items: selectedQuickProduct
                ? [{ id: selectedQuickProduct.id, name: selectedQuickProduct.name, price: selectedQuickProduct.price, quantity: 1 }]
                : []
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Помилка оформлення швидкого замовлення.');
                return;
            }

            alert(`Дякуємо, ${data.customer_name}! Замовлення №${data.id} прийнято в роботу.`);
            quickOrderForm.reset();
            closeQuickOrderModal();
        } catch (err) {
            alert('Помилка з’єднання із сервером.');
        }
    });
}

// ==========================================
// 5. СТОРІНКА КОШИКА (cart.html) + API ЗАМОВЛЕНЬ
// ==========================================
const cartContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartFinalPrice = document.getElementById('cart-final-price');
const promoInput = document.getElementById('promo-input');
const promoBtn = document.getElementById('promo-btn');
const checkoutBtn = document.getElementById('checkout-btn');

function updateSummary(subtotal) {
    if (cartTotalPrice) cartTotalPrice.innerText = `${subtotal} грн`;

    const discountAmount = Math.round(subtotal * (appliedPromo.discountPercent / 100));
    const finalSum = Math.max(0, subtotal - discountAmount);

    const discountDisplay = document.querySelector('.summary-row:nth-child(2) span:last-child');
    if (discountDisplay) {
        discountDisplay.innerText = discountAmount > 0 ? `- ${discountAmount} грн` : '- 0 грн';
    }
    if (cartFinalPrice) {
        cartFinalPrice.innerText = `${finalSum} грн`;
    }
}

function renderCart() {
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: var(--bg-card); border-radius: var(--radius-md);">
                <h3 style="margin-bottom: 10px;">Ваш кошик порожній 😔</h3>
                <p style="margin-bottom: 20px; color: var(--text-secondary);">Час порадувати свого улюбленця чимось смачненьким!</p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; width: auto; padding: 10px 20px;">Перейти до каталогу</a>
            </div>
        `;
        updateSummary(0);
        return;
    }

    let total = 0;
    cartContainer.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 style="margin-bottom: 4px; color: var(--text-primary);">${escapeHTML(item.name)}</h4>
                    <p style="font-size: 14px; color: var(--text-secondary);">Ціна: ${item.price} грн</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn minus-btn" data-index="${index}">−</button>
                    <span style="color: var(--text-primary);">${item.quantity}</span>
                    <button class="qty-btn plus-btn" data-index="${index}">+</button>
                </div>
                <div class="cart-item-price" style="color: var(--text-primary);">${itemTotal} грн</div>
                <button class="remove-btn" data-index="${index}" title="Видалити товар">🗑️</button>
            </div>
        `;
    }).join('');

    updateSummary(total);
}

function saveAndRenderCart() {
    localStorage.setItem('zoodim_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
}

if (cartContainer) {
    cartContainer.addEventListener('click', (e) => {
        const plusBtn = e.target.closest('.plus-btn');
        if (plusBtn) {
            cart[plusBtn.dataset.index].quantity += 1;
            saveAndRenderCart();
            return;
        }

        const minusBtn = e.target.closest('.minus-btn');
        if (minusBtn) {
            const idx = minusBtn.dataset.index;
            if (cart[idx].quantity > 1) {
                cart[idx].quantity -= 1;
            } else {
                cart.splice(idx, 1);
            }
            saveAndRenderCart();
            return;
        }

        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            cart.splice(removeBtn.dataset.index, 1);
            saveAndRenderCart();
        }
    });

    renderCart();
}

// Серверна перевірка промокоду (POST /api/promo/validate)
if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', async () => {
        const code = promoInput.value.trim();
        try {
            const response = await fetch('/api/promo/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await response.json();

            if (!response.ok || !data.valid) {
                appliedPromo = { code: null, discountPercent: 0 };
                alert(data.message || 'Невірний промокод.');
            } else {
                appliedPromo = { code: data.code, discountPercent: data.discountPercent };
                alert(data.message);
            }
            renderCart();
        } catch (err) {
            alert('Не вдалося перевірити промокод.');
        }
    });
}

// Оформлення замовлення з кошика (POST /api/orders)
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) {
            alert('Ваш кошик порожній! Додайте товари для оформлення замовлення.');
            return;
        }

        const nameEl = document.getElementById('checkout-name');
        const phoneEl = document.getElementById('checkout-phone');
        const customerName = nameEl ? nameEl.value.trim() : '';
        const phone = phoneEl ? phoneEl.value.trim() : '';

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    phone,
                    items: cart,
                    promoCode: appliedPromo.code,
                    orderType: 'cart'
                })
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Помилка при оформленні замовлення.');
                return;
            }

            alert(`Дякуємо, ${data.customer_name}! Замовлення №${data.id} збережено. Сума до оплати: ${data.total_price} грн.`);

            cart = [];
            appliedPromo = { code: null, discountPercent: 0 };
            localStorage.removeItem('zoodim_cart');
            if (nameEl) nameEl.value = '';
            if (phoneEl) phoneEl.value = '';
            if (promoInput) promoInput.value = '';

            saveAndRenderCart();
        } catch (err) {
            alert('Помилка з’єднання із сервером.');
        }
    });
}

// ==========================================
// 6. ОСОБИСТИЙ КАБІНЕТ (ПОВНИЙ CRUD /api/pets + ІСТОРІЯ ЗАМОВЛЕНЬ)
// ==========================================
const petsGrid = document.getElementById('pets-grid-container');
const ordersContainer = document.getElementById('orders-history-container');
const addPetBtn = document.getElementById('add-pet-btn');
const addPetModal = document.getElementById('add-pet-modal');
const addPetForm = document.getElementById('add-pet-form');
let cachedPets = [];

async function loadPets() {
    if (!petsGrid) return;
    petsGrid.innerHTML = '<p style="color: var(--text-secondary);">Завантаження профілів...</p>';

    try {
        const response = await fetch('/api/pets');
        if (!response.ok) throw new Error('Не вдалося отримати список улюбленців.');
        cachedPets = await response.json();
        renderPets(cachedPets);
    } catch (err) {
        petsGrid.innerHTML = `<p style="color: var(--color-error);">${escapeHTML(err.message)}</p>`;
    }
}

function renderPets(pets) {
    if (!petsGrid) return;

    if (pets.length === 0) {
        petsGrid.innerHTML = '<p style="color: var(--text-secondary);">У вас ще немає доданих улюбленців.</p>';
        return;
    }

    petsGrid.innerHTML = pets.map(pet => `
        <article class="pet-card" data-id="${pet.id}">
            <img src="${escapeHTML(pet.image_url)}" alt="${escapeHTML(pet.name)}" class="pet-image">
            <div class="pet-info">
                <div class="pet-header">
                    <h3>${escapeHTML(pet.name)}</h3>
                    <span class="pet-breed">${escapeHTML(pet.type)}</span>
                </div>
                <div class="pet-stats">
                    <div class="stat-box">
                        <span class="stat-label">Вага</span>
                        <span class="stat-value">${escapeHTML(pet.weight)} кг</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Вік</span>
                        <span class="stat-value">${escapeHTML(pet.age)}</span>
                    </div>
                </div>
                ${pet.badge ? `
                    <div class="pet-badges">
                        <span class="card-badge ${escapeHTML(pet.badge_class || 'badge-vet')}" style="position: static;">${escapeHTML(pet.badge)}</span>
                    </div>
                ` : ''}
                <div class="pet-actions" style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-edit-pet" data-id="${pet.id}" style="flex: 1; padding: 8px;">Редагувати</button>
                    <button class="btn btn-secondary btn-delete-pet" data-id="${pet.id}" style="width: auto; padding: 8px 12px; color: var(--color-error);" title="Видалити профіль">🗑️</button>
                </div>
            </div>
        </article>
    `).join('');
}

function openPetModal(pet = null) {
    if (!addPetModal || !addPetForm) return;
    const modalTitle = addPetModal.querySelector('h2');
    const submitBtn = addPetForm.querySelector('button[type="submit"]');
    const idField = document.getElementById('pet-id');
    const badgeField = document.getElementById('pet-badge');

    if (pet) {
        if (modalTitle) modalTitle.textContent = 'Редагувати улюбленця';
        if (submitBtn) submitBtn.textContent = 'Оновити профіль';
        if (idField) idField.value = pet.id;
        document.getElementById('pet-name').value = pet.name;
        document.getElementById('pet-type').value = pet.type;
        document.getElementById('pet-weight').value = pet.weight;
        document.getElementById('pet-age').value = pet.age;
        if (badgeField) badgeField.value = pet.badge || '';
    } else {
        addPetForm.reset();
        if (idField) idField.value = '';
        if (modalTitle) modalTitle.textContent = 'Новий улюбленець';
        if (submitBtn) submitBtn.textContent = 'Зберегти профіль';
    }

    addPetModal.classList.add('active');
}

function closePetModal() {
    if (addPetModal) addPetModal.classList.remove('active');
}

if (addPetBtn && addPetModal) {
    addPetBtn.addEventListener('click', () => openPetModal(null));

    const closePetBtn = addPetModal.querySelector('.modal-close');
    const petBackdrop = addPetModal.querySelector('.modal-backdrop');
    if (closePetBtn) closePetBtn.addEventListener('click', closePetModal);
    if (petBackdrop) petBackdrop.addEventListener('click', closePetModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && addPetModal.classList.contains('active')) {
            closePetModal();
        }
    });
}

if (addPetForm) {
    addPetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idField = document.getElementById('pet-id');
        const petId = idField ? idField.value : '';
        const badgeField = document.getElementById('pet-badge');

        const payload = {
            name: document.getElementById('pet-name').value.trim(),
            type: document.getElementById('pet-type').value.trim(),
            weight: document.getElementById('pet-weight').value,
            age: document.getElementById('pet-age').value.trim(),
            badge: badgeField ? badgeField.value.trim() : ''
        };

        const url = petId ? `/api/pets/${petId}` : '/api/pets';
        const method = petId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Не вдалося зберегти профіль.');
                return;
            }

            closePetModal();
            await loadPets();
        } catch (err) {
            alert('Помилка з’єднання із сервером.');
        }
    });
}

if (petsGrid) {
    petsGrid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-pet');
        if (editBtn) {
            const pet = cachedPets.find(p => String(p.id) === editBtn.dataset.id);
            if (pet) openPetModal(pet);
            return;
        }

        const deleteBtn = e.target.closest('.btn-delete-pet');
        if (deleteBtn) {
            if (!confirm('Видалити цей профіль улюбленця?')) return;
            try {
                const response = await fetch(`/api/pets/${deleteBtn.dataset.id}`, { method: 'DELETE' });
                if (!response.ok) {
                    const data = await response.json();
                    alert(data.error || 'Не вдалося видалити профіль.');
                    return;
                }
                await loadPets();
            } catch (err) {
                alert('Помилка з’єднання із сервером.');
            }
        }
    });

    loadPets();
}

// Історія замовлень (GET /api/orders) та перемикання вкладок кабінету
async function loadOrders() {
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '<p style="color: var(--text-secondary);">Завантаження історії замовлень...</p>';

    try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Не вдалося завантажити замовлення.');
        const orders = await response.json();

        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p style="color: var(--text-secondary);">Історія замовлень поки порожня.</p>';
            return;
        }

        ordersContainer.innerHTML = orders.map(order => {
            const items = Array.isArray(order.items_json) ? order.items_json : [];
            const itemsList = items.map(i => `${escapeHTML(i.name)} × ${i.quantity}`).join(', ');
            const dateStr = new Date(order.created_at).toLocaleString('uk-UA');

            return `
                <div class="cart-item" style="flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <strong>Замовлення №${order.id} (${order.order_type === 'quick' ? 'В 1 клік' : 'Кошик'})</strong>
                        <span style="color: var(--text-secondary); font-size: 13px;">${escapeHTML(dateStr)}</span>
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary);">Покупець: ${escapeHTML(order.customer_name)} (${escapeHTML(order.phone)})</p>
                    <p style="font-size: 14px;">Товари: ${itemsList}</p>
                    <div style="font-weight: 700; color: var(--color-success);">
                        Сума: ${order.total_price} грн ${order.promo_code ? `(промокод ${escapeHTML(order.promo_code)}, -${order.discount} грн)` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        ordersContainer.innerHTML = `<p style="color: var(--color-error);">${escapeHTML(err.message)}</p>`;
    }
}

const profileTabs = document.querySelectorAll('[data-tab]');
const pageTitle = document.querySelector('.profile-content .page-title');

profileTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tab.dataset.tab;
        if (!petsGrid || !ordersContainer) return;

        profileTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (target === 'orders') {
            petsGrid.style.display = 'none';
            if (addPetBtn) addPetBtn.style.display = 'none';
            ordersContainer.style.display = 'block';
            if (pageTitle) pageTitle.textContent = 'Історія замовлень';
            loadOrders();
        } else {
            petsGrid.style.display = '';
            if (addPetBtn) addPetBtn.style.display = '';
            ordersContainer.style.display = 'none';
            if (pageTitle) pageTitle.textContent = 'Мої улюбленці';
            loadPets();
        }
    });
});