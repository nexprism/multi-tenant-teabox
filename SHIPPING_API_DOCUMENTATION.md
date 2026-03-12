# DTDC Shipping Configuration

# Add these environment variables to your .env file

# DTDC API Configuration

DTDC_API_KEY=your_dtdc_api_key_here
DTDC_CUSTOMER_CODE=your_customer_code_here

# DTDC Origin Details (Your Store/Warehouse)

DTDC_ORIGIN_NAME=Your Store Name
DTDC_ORIGIN_PHONE=9999999999
DTDC_ORIGIN_ADDRESS_1=Your Store Address Line 1
DTDC_ORIGIN_ADDRESS_2=Your Store Address Line 2
DTDC_ORIGIN_PINCODE=110001
DTDC_ORIGIN_CITY=New Delhi
DTDC_ORIGIN_STATE=Delhi

# Blue Dart Configuration (when implemented)

BLUEDART_API_URL=https://api.bluedart.com
BLUEDART_API_KEY=your_bluedart_api_key_here

# API Usage Instructions

## Create Shipping Endpoint

**POST** `/api/shipping/create`

### Request Body:

```json
{
  "orderId": "order_id_here",
  "shipping_method": "dtdc",
  "service_type_id": "B2C PRIORITY",
  "dimensions": {
    "length": 10,
    "width": 10,
    "height": 10
  },
  "weight": 1.5
}
```

### Required Fields:

- `orderId`: The ID of the order to ship
- `shipping_method`: "dtdc" or "bluedart" (case insensitive)

### Optional Fields:

- `service_type_id`: Service type for the shipping provider (default: "B2C PRIORITY" for DTDC)
- `dimensions`: Package dimensions object with length, width, height
- `weight`: Package weight in kg

### Response:

```json
{
  "success": true,
  "message": "Shipping created successfully",
  "data": {
    "orderId": "order_id",
    "shipping_method": "dtdc",
    "tracking_number": "tracking_number_from_provider",
    "provider_response": {...}
  }
}
```

### Error Response:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Example cURL:

```bash
curl --location 'http://localhost:3000/api/shipping/create' \
--header 'Content-Type: application/json' \
--header 'x-tenant: your-tenant' \
--data '{
  "orderId": "64f8a12b5e4d3c2a1b9f8e7d",
  "shipping_method": "dtdc",
  "service_type_id": "B2C PRIORITY",
  "dimensions": {
    "length": 20,
    "width": 15,
    "height": 10
  },
  "weight": 2.5
}'
```
