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
