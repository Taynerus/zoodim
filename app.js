// ==========================================
// 1. ПЕРЕМИКАЧ ТЕМ (Світла / Темна)
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');

// Перевірка збереженої теми при завантаженні
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}

// ==========================================
// 2. ДИНАМІЧНЕ МОДАЛЬНЕ ВІКНО "В 1 КЛІК"
// ==========================================
const quickOrderBtns = document.querySelectorAll('.btn-quick-order');
const modal = document.getElementById('quick-order-modal');
const modalBackdrop = document.querySelector('.modal-backdrop');
const closeModalBtn = document.querySelector('.modal-close');
const quickOrderForm = document.getElementById('quick-order-form');
const productNameDisplay = document.getElementById('modal-product-name');

if (modal) {
    // Відкриття модалки та підтягування назви товару
    quickOrderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            
            if (card) {
                const title = card.querySelector('.product-title').innerText;
                productNameDisplay.innerText = title;
                modal.classList.add('active');
            }
        });
    });

    // Закриття модалки
    const closeModal = () => modal.classList.remove('active');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    
    // Закриття клавішею ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Обробка відправки форми
    if (quickOrderForm) {
        quickOrderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('quick-name').value;
            
            alert(`Дякуємо, ${name}! Ваше замовлення на "${productNameDisplay.innerText}" успішно прийнято. Ми зателефонуємо найближчим часом.`);
            
            quickOrderForm.reset();
            closeModal();
        });
    }
}

// ==========================================
// 3. ЖИВА ФІЛЬТРАЦІЯ КАТАЛОГУ
// ==========================================
const filterCheckboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
const productCards = document.querySelectorAll('.product-card');

if (filterCheckboxes.length > 0 && productCards.length > 0) {
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const activeFilters = Array.from(filterCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.filter);

            productCards.forEach(card => {
                const cardCategory = card.dataset.category;
                
                if (activeFilters.length === 0 || activeFilters.includes(cardCategory)) {
                    card.style.display = 'flex'; 
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}
// ==========================================
// 4. КОШИК ТОВАРІВ (LocalStorage)
// ==========================================

// 1. Отримуємо кошик з пам'яті браузера або створюємо порожній масив
let cart = JSON.parse(localStorage.getItem('zoodim_cart')) || [];
const cartBadge = document.getElementById('cart-badge-count');

// Функція оновлення лічильника в шапці
function updateCartBadge() {
    if (cartBadge) {
        // Рахуємо загальну кількість всіх товарів у кошику
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.innerText = totalItems;
        // Показуємо кружечок тільки якщо в кошику є товари
        cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// 2. Обробка кліку на кнопку "В кошик"
const addCartBtns = document.querySelectorAll('.btn-add-cart');

if (addCartBtns.length > 0) {
    addCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Зчитуємо дані товару з атрибутів кнопки
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);
            const image = btn.dataset.image;
            
            // Перевіряємо, чи є вже такий товар у кошику
            const existingItem = cart.find(item => item.id === id);
            
            if (existingItem) {
                existingItem.quantity += 1; // Якщо є - збільшуємо кількість
            } else {
                // Якщо немає - додаємо новий об'єкт у масив
                cart.push({ id, name, price, image, quantity: 1 });
            }
            
            // Зберігаємо оновлений кошик у LocalStorage
            localStorage.setItem('zoodim_cart', JSON.stringify(cart));
            
            // Оновлюємо лічильник у шапці
            updateCartBadge();
            
            // Візуальний фідбек для користувача (кнопка стає зеленою на 1.5 секунди)
            const originalText = btn.innerText;
            btn.innerText = 'Додано ✓';
            btn.style.backgroundColor = 'var(--color-success)';
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = '';
            }, 1500);
        });
    });
}

// Запускаємо оновлення лічильника при завантаженні будь-якої сторінки
updateCartBadge();
// ==========================================
// 5. РЕНДЕР СТОРІНКИ КОШИКА (cart.html)
// ==========================================
let discountPercent = 0; // Початкова знижка 0%
const cartContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartFinalPrice = document.getElementById('cart-final-price');

function renderCart() {
    // Цей код виконається тільки якщо ми знаходимося на сторінці cart.html
    if (!cartContainer) return;

    cartContainer.innerHTML = ''; // Очищаємо контейнер перед малюванням
    let total = 0;

    // Якщо кошик порожній
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

    // Якщо є товари, перебираємо їх і малюємо
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemHTML = `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 style="margin-bottom: 4px; color: var(--text-primary);">${item.name}</h4>
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
        cartContainer.insertAdjacentHTML('beforeend', cartItemHTML);
    });

    updateSummary(total);
    attachCartEvents(); // Прив'язуємо кліки до кнопок +, - та 🗑️
}

// Оновлення текстових полів з ціною
function updateSummary(total) {
    if (cartTotalPrice) cartTotalPrice.innerText = `${total} грн`;
    if (cartFinalPrice) cartFinalPrice.innerText = `${total} грн`;
}

// Обробники подій для кнопок всередині кошика
function attachCartEvents() {
    // Збільшення кількості (+)
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            cart[index].quantity += 1;
            saveAndRender();
        });
    });

    // Зменшення кількості (-)
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
            } else {
                cart.splice(index, 1); // Якщо була 1 шт і натиснули "-", видаляємо товар
            }
            saveAndRender();
        });
    });

    // Кнопка видалення (Кошик/Смітник)
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            cart.splice(index, 1); // Видаляємо товар з масиву
            saveAndRender();
        });
    });
}

// Збереження в пам'ять, оновлення шапки та перемальовування кошика
function saveAndRender() {
    localStorage.setItem('zoodim_cart', JSON.stringify(cart));
    updateCartBadge(); // Оновлюємо цифру в шапці (з кроку 1)
    renderCart();      // Перемальовуємо сам кошик
}

// Запускаємо малювання кошика одразу при завантаженні сторінки
renderCart();
// ==========================================
// 6. ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ТА ПРОМОКОДИ
// ==========================================
const promoInput = document.getElementById('promo-input');
const promoBtn = document.getElementById('promo-btn');
const checkoutBtn = document.getElementById('checkout-btn');
// Функція застосування промокоду
if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        
        if (code === 'ZOO2026') {
            discountPercent = 0.10; // 10% знижка
            alert('Промокод успішно застосовано! Знижка 10%');
        } else if (code !== '') {
            discountPercent = 0;
            alert('Невірний промокод');
        }
        
        // Перераховуємо суму з урахуванням знижки
        renderCart(); 
    });
}

// Оновлена функція підрахунку (перезаписуємо існуючу логіку updateSummary)
// Знайди стару функцію updateSummary і ЗАМІНИ її на цю:
function updateSummary(total) {
    if (cartTotalPrice) cartTotalPrice.innerText = `${total} грн`;
    
    if (cartFinalPrice) {
        const discountAmount = Math.round(total * discountPercent);
        const finalSum = total - discountAmount;
        
        // Знаходимо рядок знижки (другий рядок у підсумку) і оновлюємо його
        const discountDisplay = document.querySelector('.summary-row:nth-child(2) span:last-child');
        if (discountDisplay) {
            discountDisplay.innerText = discountAmount > 0 ? `- ${discountAmount} грн` : '- 0 грн';
        }
        
        cartFinalPrice.innerText = `${finalSum} грн`;
    }
}

// Обробка натискання "Оформити замовлення"
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Ваш кошик порожній! Додайте товари для оформлення замовлення.');
            return;
        }
        
        alert(`Дякуємо за замовлення! Сума до оплати: ${cartFinalPrice.innerText}. Наш менеджер зв'яжеться з вами найближчим часом.`);
        
        // Очищаємо кошик
        cart = [];
        localStorage.removeItem('zoodim_cart');
        
        // Перемальовуємо пустий кошик та оновлюємо шапку
        renderCart();
        updateCartBadge();
    });
}
// ==========================================
// 7. ОСОБИСТИЙ КАБІНЕТ: ДОДАВАННЯ УЛЮБЛЕНЦЯ
// ==========================================
const addPetBtn = document.getElementById('add-pet-btn');
const addPetModal = document.getElementById('add-pet-modal');
const addPetForm = document.getElementById('add-pet-form');
const petsGrid = document.getElementById('pets-grid-container');

if (addPetBtn && addPetModal) {
    // Відкриття модалки
    addPetBtn.addEventListener('click', () => {
        addPetModal.classList.add('active');
    });

    // Універсальна функція закриття
    const closePetModal = () => addPetModal.classList.remove('active');
    
    // Закриття по хрестику та фону
    const closePetBtn = addPetModal.querySelector('.modal-close');
    const petBackdrop = addPetModal.querySelector('.modal-backdrop');
    if (closePetBtn) closePetBtn.addEventListener('click', closePetModal);
    if (petBackdrop) petBackdrop.addEventListener('click', closePetModal);

    // Закриття клавішею ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && addPetModal.classList.contains('active')) {
            closePetModal();
        }
    });

    // Обробка форми додавання
    if (addPetForm && petsGrid) {
        addPetForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Запобігаємо перезавантаженню сторінки

            // Зчитуємо дані з інпутів
            const name = document.getElementById('pet-name').value;
            const type = document.getElementById('pet-type').value;
            const weight = document.getElementById('pet-weight').value;
            const age = document.getElementById('pet-age').value;

            // Створюємо HTML нової картки (використовуємо універсальне фото котика/песика)
            const newPetCardHTML = `
                <div class="pet-card" style="background-color: var(--bg-card); border: 1px solid var(--border-color);">
                    <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&q=80" alt="${name}" class="pet-image">
                    <div class="pet-info">
                        <div class="pet-header">
                            <h3 style="color: var(--text-primary); margin-bottom: 4px;">${name}</h3>
                            <span class="pet-breed" style="color: var(--text-secondary); font-size: 14px;">${type}</span>
                        </div>
                        <div class="pet-stats" style="background-color: var(--bg-main); margin-top: 16px;">
                            <div class="stat-box">
                                <span class="stat-label" style="color: var(--text-secondary);">Вага</span>
                                <span class="stat-value" style="color: var(--text-primary); font-weight: 700;">${weight} кг</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label" style="color: var(--text-secondary);">Вік</span>
                                <span class="stat-value" style="color: var(--text-primary); font-weight: 700;">${age}</span>
                            </div>
                        </div>
                        <div class="pet-actions" style="margin-top: 16px;">
                            <button class="btn btn-secondary" style="width: 100%;">Редагувати</button>
                        </div>
                    </div>
                </div>
            `;

            // Додаємо картку в кінець сітки
            petsGrid.insertAdjacentHTML('beforeend', newPetCardHTML);

            // Очищаємо форму і закриваємо модалку
            addPetForm.reset();
            closePetModal();
        });
    }
}
