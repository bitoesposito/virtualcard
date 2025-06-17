# Rules and Logic

## Roles and Permissions

### Available Roles

__ADMIN__: Role with full access to user management functions.

__USER__: Default role, with limited access to own profile.

### Permissions by Role

| Action                    | USER | ADMIN |
|---------------------------|------|-------|
| Login                     | ✅   | ✅    |
| View profiles (public)    | ✅   | ✅    |
| View users (list)         | ❌   | ✅    |
| Edit own profile          | ✅   | ✅    |
| Delete own profile        | ✅   | ✅    |
| Delete other users        | ❌   | ✅    |
| Create new users          | ❌   | ✅    |
| Password recovery         | ✅   | ✅    |
| Verify recovery token     | ✅   | ✅    |
| Upload profile photo      | ✅   | ✅    |
| Generate business card    | ✅   | ✅    |

## Validations and Constraints

### Required Fields

`email`: Required, valid and unique, max 255 characters.

`password`: Required for login and creation, 8-128 characters, must include:
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

`slug`: Required during edit if isVcardEnabled is true.

#### `Slug`

Must be unique in the database.

Allowed format: `lowercase, letters, numbers, hyphen ([a-z0-9-])`.

Cannot be modified if already assigned, except by admin.

### Optional Fields

`name`, `surname`: 2-50 characters.

`area_code`: 2-10 characters, format: +[1-4 digits].

`phone`: 5-20 characters.

`website`: Valid URL format.

`profile_photo`: Max 1024 characters.

### Field Dependencies

If `is_whatsapp_enabled = true`, phone field must be filled.

If `is_website_enabled = true`, website field must be filled.

If `is_vcard_enabled = true`, slug field must be filled.

## Automatic Behaviors

`uuid`: Automatically generated as primary key.

`role`: Assigned as USER by default at creation.

`is_configured`: False by default, indicates if user has completed configuration.

`created_at`, `updated_at`: Automatically managed by ORM and triggers.

`password`: Hashed at save time.

`email`: Treated as lowercase for unique comparisons.

`reset_token`: Max 511 characters, expires after 10 minutes.

## Security and Access

### Authentication

All modifications require valid JWT.

Users can only modify their own profile.

Admins can access and modify any user.

#### Password Recovery

`ForgotPasswordDto`: Generates temporary token (valid 10 minutes).

`UpdatePasswordDto`: If token valid, updates password.

### Security Headers

- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Strict-Transport-Security

## Common Errors to Handle

`400` Bad Request:
- Missing or invalid field
- Invalid UUID format
- Invalid email format
- Invalid password format (min 8, max 128 characters)
- Invalid slug format
- Invalid area code format
- Invalid phone format
- Invalid website format
- Invalid name/surname length (2-50 characters)
- Missing required fields for first configuration

`401` Unauthorized:
- Missing or invalid JWT
- Invalid credentials at login
- Expired JWT token

`403` Forbidden:
- Action not allowed (e.g., user modifying another user)
- Attempt to delete last admin
- Invalid role for requested action

`404` Not Found:
- Non-existent user
- User not found after update
- Profile not found

`409` Conflict:
- Duplicate email
- Duplicate slug

`429` Too Many Requests:
- Too many password recovery attempts
- Rate limit exceeded

`500` Internal Server Error:
- Internal server error
- Error during user creation
- Error during user update
- Error during user deletion
- Error during user search
- Database connection error