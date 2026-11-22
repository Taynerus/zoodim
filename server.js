require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDB } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;
const VALID_PROMO = (process.env.VALID_PROMO_CODE || 'ZOO2026').toUpperCase();
const PROMO_PERCENT = Number(process.env.PROMO_DISCOUNT_PERCENT || 10);

app.use(cors());
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Допоміжна функція вибору фото для нового улюбленця
function resolvePetImage(type = '') {
    const lower = type.toLowerCase();
    if (lower.includes('кіт') || lower.includes('кош') || lower.includes('кіш') || lower.includes('cat')) {
        return 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80';
}

// ==========================================
// 1. ТОВАРИ (READ + фільтрація і пошук)
// ==========================================
app.get('/api/products', async (req, res, next) => {
    try {
        const { category, search } = req.query;
        const conditions = [];
        const values = [];

        if (category && category !== 'all') {
            const categories = category.split(',').map(c => c.trim()).filter(Boolean);
            if (categories.length > 0) {
                values.push(categories);
                conditions.push(`category = ANY($${values.length})`);
            }
        }

        if (search && search.trim()) {
            values.push(`%${search.trim()}%`);
            conditions.push(`name ILIKE $${values.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await pool.query(`SELECT * FROM products ${whereClause} ORDER BY name ASC`, values);
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// ==========================================
// 2. ПЕРЕВІРКА ПРОМОКОДУ
// ==========================================
app.post('/api/promo/validate', (req, res) => {
    const code = String(req.body.code || '').trim().toUpperCase();
    if (!code) {
        return res.status(400).json({ valid: false, message: 'Введіть промокод.' });
    }
    if (code === VALID_PROMO) {
        return res.json({
            valid: true,
            code: VALID_PROMO,
            discountPercent: PROMO_PERCENT,
            message: `Промокод застосовано! Знижка ${PROMO_PERCENT}%`
        });
    }
    return res.status(400).json({ valid: false, message: 'Невірний промокод.' });
});

// ==========================================
// 3. ЗАМОВЛЕННЯ (CREATE + READ)
// ==========================================
app.get('/api/orders', async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

app.post('/api/orders', async (req, res, next) => {
    try {
        const { customerName, phone, items, promoCode, orderType = 'cart' } = req.body;

        if (!customerName || String(customerName).trim().length < 2) {
            return res.status(400).json({ error: "Вкажіть коректне ім'я (мінімум 2 символи)." });
        }
        if (!phone || String(phone).replace(/\D/g, '').length < 10) {
            return res.status(400).json({ error: 'Вкажіть коректний номер телефону (мінімум 10 цифр).' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Список товарів не може бути порожнім.' });
        }

        // Перерахунок вартості на сервері на основі реальних цін у БД
        const { rows: dbProducts } = await pool.query('SELECT id, name, price FROM products');
        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        let subtotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            const dbProd = item.id ? productMap.get(item.id) : null;
            const unitPrice = dbProd ? dbProd.price : Math.max(0, parseInt(item.price, 10) || 0);
            const itemName = dbProd ? dbProd.name : String(item.name || 'Товар').trim();

            subtotal += unitPrice * quantity;
            verifiedItems.push({
                id: dbProd ? dbProd.id : (item.id || 'quick-item'),
                name: itemName,
                price: unitPrice,
                quantity
            });
        }

        const normalizedPromo = promoCode ? String(promoCode).trim().toUpperCase() : null;
        const isPromoValid = normalizedPromo === VALID_PROMO;
        const discount = isPromoValid ? Math.round(subtotal * (PROMO_PERCENT / 100)) : 0;
        const totalPrice = Math.max(0, subtotal - discount);

        const { rows } = await pool.query(
            `INSERT INTO orders (customer_name, phone, items_json, promo_code, discount, total_price, order_type)
             VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
             RETURNING *`,
            [
                String(customerName).trim(),
                String(phone).trim(),
                JSON.stringify(verifiedItems),
                isPromoValid ? normalizedPromo : null,
                discount,
                totalPrice,
                orderType === 'quick' ? 'quick' : 'cart'
            ]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// ==========================================
// 4. ПРОФІЛІ УЛЮБЛЕНЦІВ (Повний CRUD)
// ==========================================
app.get('/api/pets', async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pets ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

app.post('/api/pets', async (req, res, next) => {
    try {
        const { name, type, weight, age, badge } = req.body;
        const parsedWeight = parseFloat(weight);

        if (!name || !String(name).trim() || !type || !String(type).trim() || !age || !String(age).trim()) {
            return res.status(400).json({ error: "Усі обов'язкові поля (ім'я, вид/порода, вік) мають бути заповнені." });
        }
        if (Number.isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 150) {
            return res.status(400).json({ error: 'Вага має бути додатним числом (від 0.1 до 150 кг).' });
        }

        const imageUrl = resolvePetImage(String(type));
        const cleanBadge = badge && String(badge).trim() ? String(badge).trim() : null;

        const { rows } = await pool.query(
            `INSERT INTO pets (name, type, weight, age, badge, badge_class, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                String(name).trim(),
                String(type).trim(),
                parsedWeight,
                String(age).trim(),
                cleanBadge,
                cleanBadge ? 'badge-vet' : null,
                imageUrl
            ]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
});

app.put('/api/pets/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Некоректний ID улюбленця.' });
        }

        const { name, type, weight, age, badge } = req.body;
        const parsedWeight = parseFloat(weight);

        if (!name || !String(name).trim() || !type || !String(type).trim() || !age || !String(age).trim()) {
            return res.status(400).json({ error: "Ім'я, вид/порода та вік є обов'язковими." });
        }
        if (Number.isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 150) {
            return res.status(400).json({ error: 'Вага має бути додатним числом (від 0.1 до 150 кг).' });
        }

        const cleanBadge = badge && String(badge).trim() ? String(badge).trim() : null;

        const { rows } = await pool.query(
            `UPDATE pets
             SET name = $1, type = $2, weight = $3, age = $4, badge = $5
             WHERE id = $6
             RETURNING *`,
            [String(name).trim(), String(type).trim(), parsedWeight, String(age).trim(), cleanBadge, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Профіль улюбленця не знайдено.' });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/pets/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Некоректний ID улюбленця.' });
        }

        const { rows } = await pool.query('DELETE FROM pets WHERE id = $1 RETURNING id', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Профіль улюбленця не знайдено.' });
        }

        res.json({ deleted: true, id: rows[0].id });
    } catch (err) {
        next(err);
    }
});

// Обробка неіснуючих API-маршрутів
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API-маршрут не знайдено.' });
});

// Централізований обробник помилок (не розкриває стек помилок клієнту)
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Внутрішня помилка сервера.' });
});

// Запуск сервера після ініціалізації БД
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`ZooDim server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize PostgreSQL:', err.message);
        process.exit(1);
    });