# Sample Manual Orders Excel Structure

To upload manual orders, please use an Excel file (`.xlsx`) with the following columns. The order of columns does not matter, but the headers must match exactly (case-insensitive).

| Column Header | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| **Username** | No | Name of the customer. Used if creating a new user. | John Doe |
| **Phone** | **Yes** | 10-digit phone number. Used to identify or create the user. | 9876543210 |
| **Email** | No | Email address of the customer. | john@example.com |
| **ProductName** | **Yes** | Exact name of the product as it appears in the system. | Wireless Headphones |
| **VariantName** | No | Name or SKU of the variant (if applicable). | Black / 128GB |
| **Quantity** | No | Number of items. Defaults to 1. | 2 |
| **Price** | No | Price per unit. If empty, uses the product's current price. | 1500 |
| **AddressLine1** | No | Shipping address line 1. | 123 Main St |
| **City** | No | City for shipping. | Mumbai |
| **State** | No | State for shipping. | Maharashtra |
| **PostalCode** | No | Postal code. Defaults to 000000 if missing. | 400001 |
| **Country** | No | Country. Defaults to India. | India |
| **PaymentMode** | No | 'COD' or 'Prepaid'. Defaults to COD. | COD |
| **DeliveryOption**| No | 'standard_delivery', 'express_delivery', etc. | standard_delivery |
| **PaymentId** | No | Transaction ID. Defaults to generated ID. | TXN123456 |

## Notes
- **User Logic**: The system checks if a user exists with the provided **Phone**. If yes, that user is used. If no, a new user is created with the provided Name, Phone, and Email.
- **Product Logic**: The system searches for a product by **ProductName** (case-insensitive). If not found, the row will fail.
- **Order Status**: All successfully created orders are automatically set to **confirmed**.
