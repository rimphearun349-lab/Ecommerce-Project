-- Run ONCE in SQL Server Management Studio, after pulling this version and BEFORE using ABA PayWay.
--
-- Why: Hibernate created a CHECK constraint on payments.method that only lists the old payment methods.
-- "ddl-auto=update" never changes an existing constraint, so saving ABA_PAYWAY would be rejected by the database.

USE ecommerce_db;
GO

DECLARE @name NVARCHAR(200);
SELECT TOP 1 @name = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('payments') AND definition LIKE '%CASH_ON_DELIVERY%';

IF @name IS NOT NULL
    EXEC('ALTER TABLE payments DROP CONSTRAINT [' + @name + ']');
GO

ALTER TABLE payments
    ADD CONSTRAINT CK_payments_method
    CHECK (method IN ('CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'ABA_PAYWAY'));
GO
