# Delhivery API Integration Documentation

## Environment Variables Required

Add these variables to your `.env` file:

```bash
# Delhivery API Configuration
DELHIVERY_API_TOKEN=91be46abf4dde7d868b4af4db9129c4581c2e1f9
```

## API Endpoints Used

### 1. Waybill Generation
- **URL**: `https://track.delhivery.com/waybill/api/bulk/json/`
- **Method**: GET
- **Parameters**: 
  - `token`: API token
  - `cl`: Client name (BHARATGRAM B2C)
  - `count`: Number of waybills to generate

### 2. Shipment Creation
- **URL**: `https://track.delhivery.com/api/cmu/create.json`
- **Method**: POST
- **Headers**: 
  - `Authorization: Token {DELHIVERY_API_TOKEN}`
  - `Content-Type: application/x-www-form-urlencoded`

### 3. Label Generation
- **URL**: `https://track.delhivery.com/api/p/packing_slip`
- **Method**: GET
- **Parameters**: 
  - `wbns`: Waybill number
  - `pdf`: true (for PDF format)

### 4. Package Tracking
- **URL**: `https://track.delhivery.com/api/v1/packages/json/`
- **Method**: GET
- **Parameters**: 
  - `waybill`: Waybill number to track

## Usage in OrderService

### Creating a Shipment
```javascript
const orderService = new OrderService(orderRepository, couponService, emailService);
const result = await orderService.createShipment(order, 'DELHIVERY', serviceCode);
```

### Generating Label
```javascript
const result = await orderService.generateLabel(order, 'DELHIVERY', {});
```

### Tracking Shipment
```javascript
const result = await orderService.trackShipment(order, trackingNumber, {});
```

## Testing

Run the test file to verify the integration:

```bash
node test-delhivery-integration.js
```

## Payload Structure for Shipment Creation

```json
{
  "format": "json",
  "data": {
    "pickup_location": {
      "name": "BHARATGRAM B2C",
      "add": "34 GOHANA VPO THASKA MAHARA, GOHANA VPO THASKA MAHARA, Sonipat, HARYANA, India 131301",
      "city": "SONEPAT",
      "pin": "131301",
      "country": "India",
      "phone": "9999999999"
    },
    "shipments": [
      {
        "waybill": "generated_waybill_number",
        "order": "order_id",
        "weight": 100,
        "shipment_height": 10,
        "shipment_width": 11,  
        "shipment_length": 12,
        "seller_inv": "invoice_number",
        "pin": "delivery_pincode",
        "products_desc": "product_description",
        "add": "delivery_address",
        "state": "delivery_state",
        "city": "delivery_city",
        "phone": "delivery_phone",
        "payment_mode": "COD or Prepaid",
        "cod_amount": "amount_if_cod",
        "order_date": "2025-09-08T05:26:49.000Z",
        "name": "consignee_name",
        "total_amount": 4250,
        "country": "India"
      }
    ]
  }
}
```

## Order Shipping Details Structure

After successful shipment creation, the order will be updated with:

```javascript
{
  shipping_details: {
    platform: "delhivery",
    waybill: "waybill_number",
    reference_number: "order_id", 
    tracking_url: "https://www.delhivery.com/track/package/{waybill}",
    raw_response: "full_api_response",
    created_at: "timestamp",
    labelUrl: "/labels/DELHIVERY_orderId_timestamp.pdf" // After label generation
  }
}
```