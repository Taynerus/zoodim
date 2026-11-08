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
