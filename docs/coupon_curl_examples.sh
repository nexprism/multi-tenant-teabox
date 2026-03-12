#!/usr/bin/env bash
# Replace these variables
BASE_URL="http://localhost:3000"   # e.g. http://localhost:3000
TOKEN="YOUR_AUTH_TOKEN"
COUPON_ID="COUPON_ID"
CUSTOMER_ID="CUSTOMER_ID"

# 1) Create coupon
curl -s -X POST "$BASE_URL/api/coupons" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code":"WELCOME10",
    "type":"percent",
    "value":10,
    "startAt":"2025-01-01T00:00:00Z",
    "endAt":"2026-01-01T00:00:00Z",
    "minCartValue":100,
    "products": [],
    "applyOnActualPrice": true
  }'

# 2) Get paginated list (filters, sort)
curl -s -G "$BASE_URL/api/coupons" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=10" \
  --data-urlencode 'filters={"isActive":true}' \
  --data-urlencode 'sort={"createdAt":"desc"}'

# 3) Get coupon by id
curl -s -X GET "$BASE_URL/api/coupons/$COUPON_ID" \
  -H "Authorization: Bearer $TOKEN"

# 4) Update coupon
curl -s -X PUT "$BASE_URL/api/coupons/$COUPON_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":15,"minCartValue":50}'

# 5) Soft-delete coupon
curl -s -X DELETE "$BASE_URL/api/coupons/$COUPON_ID" \
  -H "Authorization: Bearer $TOKEN"

# 6) Apply coupon with cartItems (product-scoped, using actualPrice when available)
curl -s -X POST "$BASE_URL/api/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code":"WELCOME10",
    "customerId":"'"$CUSTOMER_ID"'",
    "paymentMethod":"prepaid",
    "cartItems":[
      {"productId":"PRODUCT_ID_1","price":200,"actualPrice":180,"quantity":1},
      {"productId":"PRODUCT_ID_2","price":50,"quantity":2}
    ]
  }'

# 7) Apply coupon with raw cartValue (no items)
curl -s -X POST "$BASE_URL/api/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10","cartValue":250,"customerId":"'"$CUSTOMER_ID"'","paymentMethod":"prepaid"}'

# 8) Apply coupon with COD (will respect codMaxOrderValue and default max 1500)
curl -s -X POST "$BASE_URL/api/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"COD50","cartValue":1600,"customerId":"'"$CUSTOMER_ID"'","paymentMethod":"cod"}'

# 9) Failure case: product-specific coupon but cart missing eligible products
curl -s -X POST "$BASE_URL/api/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"PRODUCT_ONLY","cartItems":[{"productId":"OTHER_PRODUCT","price":100,"quantity":1}], "customerId":"'"$CUSTOMER_ID"'"}'

# 10) Failure case: one-per-customer coupon reused
curl -s -X POST "$BASE_URL/api/coupons/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"ONEUSE","cartValue":120,"customerId":"'"$CUSTOMER_ID"'"}'

# Notes:
# - Adjust endpoints if your routes differ (e.g. /api/v1/coupons).
# - Use actual PRODUCT_ID / COUPON_ID / CUSTOMER_ID / TOKEN when running.
# - For list filters/sort, use --data-urlencode to properly encode JSON query params.
