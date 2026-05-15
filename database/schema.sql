CREATE DATABASE IF NOT EXISTS exotic_flora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exotic_flora;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) NOT NULL,
    category ENUM('carnivorous', 'succulents', 'tropical', 'rare') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    delivery_method ENUM('courier', 'pickup') NOT NULL DEFAULT 'courier',
    payment_method ENUM('card', 'cash') NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('new', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_user_created (user_id, created_at),
    INDEX idx_orders_status (status),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_method ENUM('courier', 'pickup') NOT NULL DEFAULT 'courier' AFTER address,
    ADD COLUMN IF NOT EXISTS status ENUM('new', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'new' AFTER total_price,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

INSERT INTO users (email, password_hash, role)
VALUES ('admin@exoticflora.ru', '$2y$10$j4/wNiFlspmk35kRSV1FYuQcMoCpWWjGkgf5jxkgyWJ/RtEd74ENa', 'admin')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role);

INSERT INTO products (name, description, price, image, category) VALUES
('Венерина мухоловка', 'Классика хищных. Любит солнце и дистиллированную/осмос‑воду.', 1790, 'images/muholovka.png', 'carnivorous'),
('Непентес', 'Кувшинчики‑ловушки. Лучше растёт при высокой влажности.', 3490, 'images/napenten.png', 'carnivorous'),
('Саррацения', 'Трубчатые ловушки, эффектно смотрится в коллекции.', 2190, 'images/saretia.jpg', 'carnivorous'),
('Росянка', 'Липкие листья‑ловушки. Компактная и интересная.', 1290, 'images/rosianka.png', 'carnivorous'),
('Жирянка', 'Листья‑“ловушки” и милые цветы. Подойдёт новичкам.', 1390, 'images/jiranka.jpg', 'carnivorous'),
('Пузырчатка', 'Мини‑хищник с ловушками‑“пузырьками”. Выглядит магически.', 1190, 'images/puzir.jpg', 'carnivorous'),
('Литопсы «живые камни»', 'Крошечные “камешки”, цветут в сезон. Полив — минимум.', 990, 'images/Lithops.png', 'succulents'),
('Стринг оф Перлс', '“Нитка жемчуга” — идеален для кашпо и полок.', 1190, 'images/string_of.png', 'succulents'),
('Стринг оф Долфинс', 'Листочки похожи на дельфинов, которые “прыгают” по полке.', 1290, 'images/dolfins.jpg', 'succulents'),
('Кактус Хатиора «танцующие кости»', 'Сегменты‑“косточки” — самый “движовый” кактус.', 1490, 'images/hatiora.png', 'succulents'),
('Кактус «заячьи ушки»', 'Опунция с “ушками”. Только не гладьте — микроколючки!', 1090, 'images/zaichik.jpg', 'succulents'),
('Седум «ослиный хвост»', 'Свисающие побеги‑“капельки”. Выглядит супер в подвесах.', 1390, 'images/osliniy.jpg', 'succulents'),
('Монстера deliciosa', 'Большие резные листья, быстрый рост, любит опору.', 1990, 'images/monstera.webp', 'tropical'),
('Алоказия Polly', 'Контрастные листья, любит влажность и стабильный уход.', 2590, 'images/alokazia.jpeg', 'tropical'),
('Филодендрон Brasil', 'Лиана с пёстрыми листьями, легко формируется.', 1490, 'images/filodendron.jpg', 'tropical'),
('Калатея orbifolia', 'Полосатая красотка. Любит мягкую воду и рассеянный свет.', 2190, 'images/kalatea.jpeg', 'tropical'),
('Антуриум', 'Декоративное цветение, любит тепло и рассеянный свет.', 1790, 'images/anturium.jpg', 'tropical'),
('Мимоза стыдливая', 'Складывает листья при касании — будто “смущается”.', 1190, 'images/mimoza.png', 'tropical'),
('Хойя «Сердце»', 'Толстые сердечные листья. Отличный подарок.', 1590, 'images/love.jpeg', 'rare'),
('Стэфания erecta', 'Лиана из “картофелины”‑каудекса. Настоящая экзотика.', 4990, 'images/erecta.jpeg', 'rare'),
('Джатрофа «Buddha Belly»', 'Ствол‑“животик” и коралловые цветы — очень необычно.', 3990, 'images/budha.webp', 'rare'),
('Цветок‑летучая мышь (Tacca)', '“Крылья” и длинные “усы”. Любит тепло и влажность.', 6990, 'images/mouse.jpeg', 'rare'),
('Орхидея «лицо обезьяны»', 'Цветок похож на мордочку. Экзотика для терпеливых.', 7990, 'images/monkey.jpg', 'rare'),
('Вуду‑лилия (Amorphophallus)', 'Та самая “вонючка” в цветении. Эффектно (и смешно).', 5990, 'images/liliy.jpeg', 'rare')
ON DUPLICATE KEY UPDATE description = VALUES(description), price = VALUES(price), image = VALUES(image), category = VALUES(category);
