const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDB() {
    // 1. Таблиця товарів
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            weight TEXT NOT NULL,
            price INTEGER NOT NULL CHECK (price > 0),
            old_price INTEGER,
            badge TEXT,
            badge_class TEXT,
            image_url TEXT NOT NULL
        );
    `);

    // 2. Таблиця замовлень (кошик + замовлення в 1 клік)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            items_json JSONB NOT NULL,
            promo_code TEXT,
            discount INTEGER DEFAULT 0,
            total_price INTEGER NOT NULL CHECK (total_price >= 0),
            order_type TEXT NOT NULL DEFAULT 'cart',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 3. Таблиця профілів улюбленців
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pets (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            weight REAL NOT NULL CHECK (weight > 0),
            age TEXT NOT NULL,
            badge TEXT,
            badge_class TEXT,
            image_url TEXT NOT NULL
        );
    `);

    // Початкове наповнення товарів (якщо таблиця порожня)
    const { rows: productCount } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
    if (productCount[0].count === 0) {
        const seedProducts = [
            [
                'acana-adult',
                'Acana Adult Dog Recipe',
                'dogs',
                '11.4 кг',
                3250,
                3600,
                'Хіт продажів',
                'badge-sale',
                'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&q=80'
            ],
            [
                'royal-gastro',
                'Royal Canin Gastrointestinal',
                'vet',
                '15 кг',
                4100,
                null,
                'Ветдієта',
                'badge-vet',
                'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&q=80'
            ],
            [
                'josera-fest',
                'Josera Festival',
                'dogs',
                '12.5 кг',
                2850,
                3100,
                'Акція',
                'badge-sale',
                'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&q=80'
            ],
            [
                'brit-cat-sterilized',
                'Brit Care Cat Sterilized',
                'cats',
                '7 кг',
                1950,
                null,
                'Для стерилізованих',
                'badge-vet',
                'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80'
            ]
        ];

        for (const item of seedProducts) {
            await pool.query(
                `INSERT INTO products (id, name, category, weight, price, old_price, badge, badge_class, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                item
            );
        }
        console.log('Seeded initial products into PostgreSQL.');
    }

    // Початкове наповнення профілів тварин (якщо таблиця порожня)
    const { rows: petCount } = await pool.query('SELECT COUNT(*)::int AS count FROM pets');
    if (petCount[0].count === 0) {
        const seedPets = [
            [
                'Марсель',
                'Французький бульдог',
                12.5,
                '3 роки',
                'Чутливе травлення',
                'badge-vet',
                'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&q=80'
            ],
            [
                'Мія',
                'Безпородна',
                4.2,
                '5 років',
                'Стерилізована',
                'badge-sale',
                'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80'
            ]
        ];

        for (const pet of seedPets) {
            await pool.query(
                `INSERT INTO pets (name, type, weight, age, badge, badge_class, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                pet
            );
        }
        console.log('Seeded initial pets into PostgreSQL.');
    }
}

module.exports = { pool, initDB };