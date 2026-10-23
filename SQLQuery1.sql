
IF DB_ID('ecommerce_db') IS NULL
    CREATE DATABASE ecommerce_db;
GO

USE ecommerce_db;
GO

IF OBJECT_ID('dbo.users', 'U') IS NULL
CREATE TABLE dbo.users (
    id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
    username    NVARCHAR(50)  NOT NULL,
    email       VARCHAR(100)  NOT NULL,
    password    VARCHAR(255)  NOT NULL,                       -- BCrypt hash, never the real password
    role        VARCHAR(20)   NOT NULL CONSTRAINT DF_users_role DEFAULT 'USER',
    created_at  DATETIME2(6)  NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_users_username UNIQUE (username),
    CONSTRAINT UQ_users_email    UNIQUE (email),
    CONSTRAINT CK_users_role     CHECK (role IN ('USER', 'ADMIN'))
);
GO

IF OBJECT_ID('dbo.categories', 'U') IS NULL
CREATE TABLE dbo.categories (
    id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_categories PRIMARY KEY,
    name  NVARCHAR(100) NOT NULL
);
GO

IF OBJECT_ID('dbo.products', 'U') IS NULL
CREATE TABLE dbo.products (
    id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_products PRIMARY KEY,
    name         NVARCHAR(150)  NOT NULL,
    description  NVARCHAR(MAX)  NULL,
    price        DECIMAL(10,2)  NOT NULL,
    quantity     INT            NOT NULL CONSTRAINT DF_products_quantity DEFAULT 0,   -- stock
    image        VARCHAR(255)   NULL,
    category_id  BIGINT         NOT NULL,
    CONSTRAINT FK_products_category FOREIGN KEY (category_id) REFERENCES dbo.categories (id),
    CONSTRAINT CK_products_price    CHECK (price >= 0),
    CONSTRAINT CK_products_quantity CHECK (quantity >= 0)
);
GO

IF OBJECT_ID('dbo.orders', 'U') IS NULL
CREATE TABLE dbo.orders (
    id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_orders PRIMARY KEY,
    user_id      BIGINT         NOT NULL,
    total_price  DECIMAL(12,2)  NOT NULL,
    status       VARCHAR(20)    NOT NULL CONSTRAINT DF_orders_status DEFAULT 'PENDING',
    order_date   DATETIME2(6)   NOT NULL CONSTRAINT DF_orders_order_date DEFAULT SYSDATETIME(),
    CONSTRAINT FK_orders_user   FOREIGN KEY (user_id) REFERENCES dbo.users (id),
    CONSTRAINT CK_orders_status CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'))
);
GO

IF OBJECT_ID('dbo.order_items', 'U') IS NULL
CREATE TABLE dbo.order_items (
    id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_order_items PRIMARY KEY,
    order_id    BIGINT         NOT NULL,
    product_id  BIGINT         NOT NULL,
    quantity    INT            NOT NULL,
    price       DECIMAL(10,2)  NOT NULL,                      -- unit price at the time of purchase
    CONSTRAINT FK_order_items_order   FOREIGN KEY (order_id)   REFERENCES dbo.orders (id),
    CONSTRAINT FK_order_items_product FOREIGN KEY (product_id) REFERENCES dbo.products (id),
    CONSTRAINT CK_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT CK_order_items_price    CHECK (price >= 0)
);
GO

IF OBJECT_ID('dbo.payments', 'U') IS NULL
CREATE TABLE dbo.payments (
    id               BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payments PRIMARY KEY,
    order_id         BIGINT         NOT NULL,
    amount           DECIMAL(12,2)  NOT NULL,
    method           VARCHAR(30)    NOT NULL,
    status           VARCHAR(20)    NOT NULL CONSTRAINT DF_payments_status DEFAULT 'PENDING',
    transaction_ref  VARCHAR(100)   NULL,                     -- ABA PayWay tran_id or simulated TXN-...
    paid_at          DATETIME2(6)   NULL,
    CONSTRAINT FK_payments_order  FOREIGN KEY (order_id) REFERENCES dbo.orders (id),
    CONSTRAINT CK_payments_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
);
GO

IF OBJECT_ID('dbo.reviews', 'U') IS NULL
CREATE TABLE dbo.reviews (
    id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_reviews PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    product_id  BIGINT         NOT NULL,
    rating      INT            NOT NULL,
    comment     NVARCHAR(MAX)  NULL,
    created_at  DATETIME2(6)   NOT NULL CONSTRAINT DF_reviews_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT FK_reviews_user    FOREIGN KEY (user_id)    REFERENCES dbo.users (id),
    CONSTRAINT FK_reviews_product FOREIGN KEY (product_id) REFERENCES dbo.products (id),
    CONSTRAINT CK_reviews_rating  CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT UQ_reviews_user_product UNIQUE (user_id, product_id)   -- one review per user per product
);
GO

DECLARE @old NVARCHAR(200);
SELECT TOP 1 @old = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('dbo.payments')
  AND definition LIKE '%CASH_ON_DELIVERY%'
  AND definition NOT LIKE '%ABA_PAYWAY%';
IF @old IS NOT NULL
    EXEC('ALTER TABLE dbo.payments DROP CONSTRAINT [' + @old + ']');

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID('dbo.payments') AND definition LIKE '%ABA_PAYWAY%')
    ALTER TABLE dbo.payments ADD CONSTRAINT CK_payments_method
        CHECK (method IN ('CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'ABA_PAYWAY'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_products_category' AND object_id = OBJECT_ID('dbo.products'))
    CREATE INDEX IX_products_category ON dbo.products (category_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_user' AND object_id = OBJECT_ID('dbo.orders'))
    CREATE INDEX IX_orders_user ON dbo.orders (user_id, order_date DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_order' AND object_id = OBJECT_ID('dbo.order_items'))
    CREATE INDEX IX_order_items_order ON dbo.order_items (order_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_order' AND object_id = OBJECT_ID('dbo.payments'))
    CREATE INDEX IX_payments_order ON dbo.payments (order_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_transaction_ref' AND object_id = OBJECT_ID('dbo.payments'))
    CREATE INDEX IX_payments_transaction_ref ON dbo.payments (transaction_ref);
GO


IF NOT EXISTS (SELECT 1 FROM dbo.categories)
BEGIN
    INSERT INTO dbo.categories (name)
    VALUES (N'Books'), (N'Clothing'), (N'Electronics'), (N'Home & Kitchen');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.products)
BEGIN
    INSERT INTO dbo.products (name, description, price, quantity, image, category_id)
    SELECT N'Wireless Mouse', N'Comfortable 2.4 GHz wireless mouse.', 12.99, 100, NULL, id
    FROM dbo.categories WHERE name = N'Electronics';

    INSERT INTO dbo.products (name, description, price, quantity, image, category_id)
    SELECT N'USB-C Charger', N'20W fast charger with USB-C port.', 19.50, 60, NULL, id
    FROM dbo.categories WHERE name = N'Electronics';

    INSERT INTO dbo.products (name, description, price, quantity, image, category_id)
    SELECT N'Cotton T-Shirt', N'Soft 100% cotton T-shirt.', 8.99, 150, NULL, id
    FROM dbo.categories WHERE name = N'Clothing';

    INSERT INTO dbo.products (name, description, price, quantity, image, category_id)
    SELECT N'Java Programming', N'Learn Java step by step.', 29.00, 40, NULL, id
    FROM dbo.categories WHERE name = N'Books';

    INSERT INTO dbo.products (name, description, price, quantity, image, category_id)
    SELECT N'Stainless Steel Kettle', N'1.7 litre electric kettle.', 24.50, 30, NULL, id
    FROM dbo.categories WHERE name = N'Home & Kitchen';
END
GO

