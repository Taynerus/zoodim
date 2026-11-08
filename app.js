// Шукаємо кнопку перемикання теми
const themeToggleBtn = document.getElementById('theme-toggle');

// Перевіряємо, чи була збережена темна тема раніше
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

// Додаємо обробник події кліку
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        // Зберігаємо вибір користувача
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}
const modal = document.getElementById('quick-order-modal');
const closeBtn = document.querySelector('.close-btn');

// Функція відкриття (її будемо викликати кліком на товари пізніше)
function openModal() {
    modal.classList.remove('hidden');
}

// Функція закриття
function closeModal() {
    modal.classList.add('hidden');
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Закриття по кліку на темний фон (оверлей)
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// Закриття клавішею ESC
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});
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
            // Знаходимо батьківську картку товару
            const card = e.target.closest('.product-card');
            // Дістаємо назву конкретно цього товару
            const title = card.querySelector('.product-title').innerText;
            
            // Динамічно підставляємо назву в модалку (Вимога ЛР №4)
            productNameDisplay.innerText = title;
            
            modal.classList.add('active');
        });
    });

    // Універсальна функція закриття
    const closeModal = () => modal.classList.remove('active');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    
    // Закриття клавішею ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // Обробка відправки форми
    if (quickOrderForm) {
        quickOrderForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Зупиняємо стандартну відправку сторінки
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
const filterCheckboxes = document.querySelectorAll('.filter-sidebar input[type="checkbox"]');
const productCards = document.querySelectorAll('.product-card');

if (filterCheckboxes.length > 0 && productCards.length > 0) {
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Збираємо масив усіх вибраних категорій (наприклад: ['dogs', 'cats'])
            const activeFilters = Array.from(filterCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.filter);

            productCards.forEach(card => {
                const cardCategory = card.dataset.category;
                
                // Якщо не вибрано жодного фільтра АБО товар належить до вибраної категорії — показуємо
                if (activeFilters.length === 0 || activeFilters.includes(cardCategory)) {
                    card.style.display = 'flex'; 
                } else {
                    card.style.display = 'none'; // Інакше приховуємо
                }
            });
        });
    });
}
