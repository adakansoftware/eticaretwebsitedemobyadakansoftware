WITH ranked_user_carts AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" ASC, "id" ASC
    ) AS keeper_id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" ASC, "id" ASC
    ) AS row_number
  FROM "Cart"
  WHERE "userId" IS NOT NULL
)
UPDATE "CartItem" AS item
SET "cartId" = ranked_user_carts.keeper_id
FROM ranked_user_carts
WHERE item."cartId" = ranked_user_carts."id"
  AND ranked_user_carts.row_number > 1;

WITH ranked_user_carts AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" ASC, "id" ASC
    ) AS row_number
  FROM "Cart"
  WHERE "userId" IS NOT NULL
)
DELETE FROM "Cart" AS cart
USING ranked_user_carts
WHERE cart."id" = ranked_user_carts."id"
  AND ranked_user_carts.row_number > 1;

WITH ranked_session_carts AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "sessionId"
      ORDER BY "updatedAt" DESC, "createdAt" ASC, "id" ASC
    ) AS keeper_id,
    ROW_NUMBER() OVER (
      PARTITION BY "sessionId"
      ORDER BY "updatedAt" DESC, "createdAt" ASC, "id" ASC
    ) AS row_number
  FROM "Cart"
  WHERE "sessionId" IS NOT NULL
)
UPDATE "CartItem" AS item
SET "cartId" = ranked_session_carts.keeper_id
FROM ranked_session_carts
WHERE item."cartId" = ranked_session_carts."id"
  AND ranked_session_carts.row_number > 1;

WITH ranked_session_carts AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "sessionId"
      ORDER BY "updatedAt" DESC, "createdAt" ASC, "id" ASC
    ) AS row_number
  FROM "Cart"
  WHERE "sessionId" IS NOT NULL
)
DELETE FROM "Cart" AS cart
USING ranked_session_carts
WHERE cart."id" = ranked_session_carts."id"
  AND ranked_session_carts.row_number > 1;

WITH base_item_groups AS (
  SELECT
    item."cartId",
    item."productId",
    MIN(item."id") AS keeper_id,
    LEAST(SUM(item."quantity")::integer, GREATEST(product."stock", 0)) AS merged_quantity
  FROM "CartItem" AS item
  INNER JOIN "Product" AS product
    ON product."id" = item."productId"
  WHERE item."variantId" IS NULL
  GROUP BY item."cartId", item."productId", product."stock"
  HAVING COUNT(*) > 1
)
UPDATE "CartItem" AS item
SET
  "quantity" = base_item_groups.merged_quantity,
  "updatedAt" = CURRENT_TIMESTAMP
FROM base_item_groups
WHERE item."id" = base_item_groups.keeper_id;

WITH base_item_groups AS (
  SELECT
    item."cartId",
    item."productId",
    MIN(item."id") AS keeper_id
  FROM "CartItem" AS item
  WHERE item."variantId" IS NULL
  GROUP BY item."cartId", item."productId"
  HAVING COUNT(*) > 1
)
DELETE FROM "CartItem" AS item
USING base_item_groups
WHERE item."cartId" = base_item_groups."cartId"
  AND item."productId" = base_item_groups."productId"
  AND item."variantId" IS NULL
  AND item."id" <> base_item_groups.keeper_id;

WITH variant_item_groups AS (
  SELECT
    item."cartId",
    item."productId",
    item."variantId",
    MIN(item."id") AS keeper_id,
    LEAST(SUM(item."quantity")::integer, GREATEST(variant."stock", 0)) AS merged_quantity
  FROM "CartItem" AS item
  INNER JOIN "ProductVariant" AS variant
    ON variant."id" = item."variantId"
  WHERE item."variantId" IS NOT NULL
  GROUP BY item."cartId", item."productId", item."variantId", variant."stock"
  HAVING COUNT(*) > 1
)
UPDATE "CartItem" AS item
SET
  "quantity" = variant_item_groups.merged_quantity,
  "updatedAt" = CURRENT_TIMESTAMP
FROM variant_item_groups
WHERE item."id" = variant_item_groups.keeper_id;

WITH variant_item_groups AS (
  SELECT
    item."cartId",
    item."productId",
    item."variantId",
    MIN(item."id") AS keeper_id
  FROM "CartItem" AS item
  WHERE item."variantId" IS NOT NULL
  GROUP BY item."cartId", item."productId", item."variantId"
  HAVING COUNT(*) > 1
)
DELETE FROM "CartItem" AS item
USING variant_item_groups
WHERE item."cartId" = variant_item_groups."cartId"
  AND item."productId" = variant_item_groups."productId"
  AND item."variantId" = variant_item_groups."variantId"
  AND item."id" <> variant_item_groups.keeper_id;

CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart"("sessionId");
CREATE UNIQUE INDEX "CartItem_cartId_productId_base_key"
  ON "CartItem"("cartId", "productId")
  WHERE "variantId" IS NULL;
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key"
  ON "CartItem"("cartId", "productId", "variantId")
  WHERE "variantId" IS NOT NULL;
