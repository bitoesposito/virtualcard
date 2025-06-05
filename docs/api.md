# API Documentation

### Authentication

POST    auth/login              Handles user authentication and returns JWT token
POST    auth/recover            Sends password reset link if email is registered
POST    auth/verify             Verifies reset token and updates user's password

### User Management

POST    users/create            Creates a new user (Admin only)
GET     users/list              Retrieves list of all non-admin users (Admin only)
GET     users/by-id/:uuid       Retrieves user details by UUID (Admin or profile owner)
PUT     users/edit              Updates user profile (Authenticated user)
DELETE  users/delete            Deletes user and associated profile (Authenticated user)
GET     users/:slug             Retrieves public user profile by slug (Public)
GET     users/check-slug/:slug  Verifies slug availability (Authenticated user)

# API Response Structure

All API responses follow this structure:
```json
{
  "success": boolean,
  "message": string,
  "data": any | null
}
```

# Validation Rules

## Password Requirements
- Must be between 8 and 128 characters
- Must include at least one uppercase letter
- Must include at least one lowercase letter
- Must include at least one number
- Must include at least one special character

## Email Requirements
- Must be a valid email format
- Cannot exceed 255 characters

## Name and Surname Requirements
- Must be between 2 and 50 characters
- Must be a string

## Area Code Requirements
- Must be between 2 and 10 characters
- Must be a string

## Phone Number Requirements
- Must be between 5 and 20 characters
- Must be a string

## Website URL Requirements
- Must be a valid URL format
- Optional

## Slug Requirements
- Can only contain lowercase letters, numbers, and hyphens
- Optional

# Endpoint Details

## auth/login
### Description
Handles user authentication and returns JWT token.

### Request Body
```json
{
  "email": "string",  // Required, valid email format, max 255 chars
  "password": "string"  // Required, 8-128 chars, must include uppercase, lowercase, number, and special char
}
```

### Responses

200: Success
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "string",
    "user": {
      "uuid": "string",
      "email": "string",
      "role": "string"
    }
  }
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
  // Possible messages:
  // - "Email is required"
  // - "Invalid email format"
  // - "Email cannot exceed 255 characters"
  // - "Password is required"
  // - "Password must be at least 8 characters"
  // - "Password cannot exceed 128 characters"
  // - "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
}
```

401: Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials",
  "data": null
}
```

## auth/recover
### Description
Sends a password reset link if the email is registered.

### Request Body
```json
{
  "email": "string"  // Required, valid email format
}
```

### Responses

200: Success
```json
{
  "success": true,
  "message": "If the email address is registered, you will receive a password reset link",
  "data": {
    "expiresIn": 600
  }
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
  // Possible messages:
  // - "Email is required"
  // - "Invalid email format"
}
```

## auth/verify
### Description
Verifies reset token and updates user's password.

### Request Body
```json
{
  "token": "string",  // Required
  "password": "string"  // Required, 8-128 chars, must include uppercase, lowercase, number, and special char
}
```

### Responses

200: Success
```json
{
  "success": true,
  "message": "Password has been updated successfully",
  "data": null
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
  // Possible messages:
  // - "Token is required"
  // - "New password is required"
  // - "Password must be at least 8 characters"
  // - "Password cannot exceed 128 characters"
  // - "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
}
```

401: Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}
```

## users/create
### Description
Creates a new user (Admin only).

### Request Body
```json
{
  "email": "string"  // Required, valid email format
}
```

### Responses

201: Success
```json
{
  "success": true,
  "message": "User created",
  "data": {
    "email": "string"
  }
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
  // Possible messages:
  // - "Email is required"
  // - "Invalid email format"
}
```

403: Forbidden
```json
{
  "success": false,
  "message": "Admin privileges required",
  "data": null
}
```

## users/list
### Description
Retrieves list of all non-admin users (Admin only).

### Responses

200: Success
```json
{
  "success": true,
  "message": "Users list retrieved successfully",
  "data": [
    {
      "uuid": "string",
      "email": "string",
      "is_configured": boolean,
      "created_at": "string"
    }
  ]
}
```

403: Forbidden
```json
{
  "success": false,
  "message": "Admin privileges required",
  "data": null
}
```

## users/by-id/:uuid
### Description
Retrieves user details by UUID (Admin or profile owner).

### Responses

200: Success
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "uuid": "string",
    "email": "string",
    "name": "string",
    "surname": "string",
    "area_code": "string",
    "phone": "string",
    "website": "string",
    "is_whatsapp_enabled": boolean,
    "is_website_enabled": boolean,
    "is_vcard_enabled": boolean,
    "slug": "string",
    "profile_photo": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

403: Forbidden
```json
{
  "success": false,
  "message": "You can only access your own profile",
  "data": null
}
```

404: Not Found
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

## users/edit
### Description
Updates user profile (Authenticated user).

### Request Body
```json
{
  "name": "string",  // Optional, 2-50 chars
  "surname": "string",  // Optional, 2-50 chars
  "area_code": "string",  // Optional, 2-10 chars
  "phone": "string",  // Optional, 5-20 chars
  "website": "string",  // Optional, valid URL format
  "is_whatsapp_enabled": boolean,  // Optional
  "is_website_enabled": boolean,  // Optional
  "is_vcard_enabled": boolean,  // Optional
  "slug": "string"  // Optional, lowercase letters, numbers, and hyphens only
}
```

### Responses

200: Success
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "uuid": "string",
    "email": "string",
    "name": "string",
    "surname": "string",
    "area_code": "string",
    "phone": "string",
    "website": "string",
    "is_whatsapp_enabled": boolean,
    "is_website_enabled": boolean,
    "is_vcard_enabled": boolean,
    "slug": "string",
    "profile_photo": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
  // Possible messages:
  // - "Name must be between 2 and 50 characters"
  // - "Surname must be between 2 and 50 characters"
  // - "Area code must be between 2 and 10 characters"
  // - "Phone number must be between 5 and 20 characters"
  // - "Invalid website URL format"
  // - "Slug can only contain lowercase letters, numbers, and hyphens"
}
```

403: Forbidden
```json
{
  "success": false,
  "message": "You can only edit your own profile",
  "data": null
}
```

## users/delete
### Description
Deletes user and associated profile (Authenticated user).

### Request Body
```json
{
  "email": "string"  // Required, valid email format
}
```

### Responses

200: Success
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
  // Possible messages:
  // - "Email is required"
  // - "Invalid email format"
}
```

403: Forbidden
```json
{
  "success": false,
  "message": "You can only delete your own account",
  "data": null
}
```

## users/:slug
### Description
Retrieves public user profile by slug (Public).

### Responses

200: Success
```json
{
  "success": true,
  "message": "User found",
  "data": {
    "uuid": "string",
    "name": "string",
    "surname": "string",
    "area_code": "string",
    "phone": "string",
    "website": "string",
    "is_whatsapp_enabled": boolean,
    "is_website_enabled": boolean,
    "is_vcard_enabled": boolean,
    "slug": "string"
  }
}
```

404: Not Found
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

## users/check-slug/:slug
### Description
Verifies slug availability (Authenticated user).

### Responses

200: Success
```json
{
  "success": true,
  "message": "Slug availability checked successfully",
  "data": {
    "available": boolean
  }
}
```

400: Validation Error
```json
{
  "success": false,
  "message": "Invalid slug format",
  "data": null
}
```