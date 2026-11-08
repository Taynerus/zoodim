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
