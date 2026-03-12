# Phone/OTP Authentication API

This document describes the phone-based authentication flow using OTP verification.

## API Endpoints

### 1. Request OTP
**POST** `/api/auth/request-otp`

Request an OTP for phone number verification.

**Request Body:**
```json
{
  "phone": "7014628523"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to 7014628523",
  "data": {
    "isNewUser": true
  }
}
```

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

Verify the OTP received on phone. Automatically creates account for new users.

**Request Body:**
```json
{
  "phone": "7014628523",
  "otp": "123456"
}
```

**Response for Existing User (Login):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "phone": "7014628523",
      "email": "john@example.com",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

**Response for New User (Auto-Registration and Login):**
```json
{
  "success": true,
  "message": "Account created and login successful",
  "data": {
    "user": {
      "_id": "new_user_id",
      "name": "User_7014628523",
      "phone": "7014628523",
      "email": "7014628523@temp.local",
      "isVerified": true,
      "role": "customer_role_id",
      "tenant": "tenant_id"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### 3. Complete Registration (New Users Only)
**POST** `/api/auth/complete-registration`

Complete registration for new users after OTP verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "new_user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "7014628523",
      "isVerified": true,
      "role": "customer_role_id",
      "tenant": "tenant_id"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

## Authentication Flow

### Simplified Flow (Auto-Registration):
1. **Request OTP** → `POST /api/auth/request-otp`
2. **Verify OTP** → `POST /api/auth/verify-otp` 
   - If user exists: Login with tokens
   - If user is new: Auto-create account and login with tokens
3. **User is logged in** (no additional registration step needed)

### For Existing Users:
1. **Request OTP** → `POST /api/auth/request-otp`
2. **Verify OTP** → `POST /api/auth/verify-otp` (returns 200 status with user data and tokens)
3. **User is logged in**

### For New Users:
1. **Request OTP** → `POST /api/auth/request-otp`
2. **Verify OTP** → `POST /api/auth/verify-otp` (auto-creates account and returns 201 status with user data and tokens)
3. **User is logged in** (can update profile later)

## Testing Phone Numbers

For development, these phone numbers use a fixed OTP `123456`:
- 7014628523
- 8347496266
- 7016292085
- 7774010984

## Error Handling

All endpoints return appropriate error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

## Features Implemented

✅ Phone number validation  
✅ OTP generation and storage (Redis)  
✅ OTP verification  
✅ Auto-registration for new users during OTP verification  
✅ JWT token generation  
✅ Cookie-based authentication  
✅ User creation with phone number  
✅ Integration with existing user/role/tenant system  
✅ Simplified single-step authentication flow  

## Features Pending

⏳ SMS service integration (currently using fixed OTP for testing)  
⏳ Rate limiting for OTP requests  
⏳ OTP retry mechanism  
⏳ Phone number formatting/validation  
⏳ User profile update API for new users to add email/name  

## Database Changes

The User model has been updated to include:
- `phone`: String (unique, sparse)
- `isVerified`: Boolean (default: false)
- `email`: String (unique, sparse) - Made optional for phone-based registration

New users created via phone authentication get:
- `name`: "User_{phone_number}" (can be updated later)
- `email`: "{phone_number}@temp.local" (can be updated later)
- `isVerified`: true (verified via OTP)
- `passwordHash`: Random password (user can set password later)
