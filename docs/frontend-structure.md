# Frontend Angular Virtualcard Structure

## Overview
This documentation describes the folder structure, main components, and permission management for the Angular frontend application virtualcard.

---

## 1. Folder Structure

```
src/
└── app/
    ├── services/
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── notification.service.ts
    │   └── theme.service.ts
    ├── guards/
    │   ├── auth.guard.ts
    │   └── role.guard.ts
    ├── interceptors/
    │   └── auth.interceptor.ts
    ├── models/
    │   ├── user.model.ts
    │   ├── auth.model.ts
    │   └── api.model.ts
    ├── private/
    │   ├── dashboard/
    │   │   └── dashboard.component.ts
    │   ├── edit/
    │   │   └── edit.component.ts
    │   ├── private-routing.module.ts
    │   └── private.module.ts
    ├── public/
    │   ├── components/
    │   │   ├── login/
    │   │   │   └── login.component.ts
    │   │   ├── recover/
    │   │   │   └── recover.component.ts
    │   │   ├── verify/
    │   │   │   └── verify.component.ts
    │   │   └── user-profile/
    │   │       └── user-profile.component.ts
    │   ├── public-routing.module.ts
    │   ├── auth-routing.module.ts
    │   └── public.module.ts
    ├── app.routes.ts
    └── app.config.ts
```

---

## 2. Main Components and Permissions

| Feature                    | USER (normal) | ADMIN |
|---------------------------|---------------|-------|
| Login                     | ✅            | ✅    |
| View own profile          | ✅            | ✅    |
| View other profiles       | ✅ (public)   | ✅    |
| Edit own profile          | ✅            | ✅    |
| Edit other profiles       | ❌            | ✅    |
| Password recovery         | ✅            | ✅    |
| Dark mode toggle          | ✅            | ✅    |
| Profile photo upload      | ✅            | ✅    |
| Business card generation  | ✅            | ✅    |

---

## 3. Routing Structure

### Public Routes
- `/login` → LoginComponent (all users)
- `/recover` → RecoverComponent (all users)
- `/verify` → VerifyComponent (all users)
- `/u/:slug` → UserProfileComponent (public access)

### Private Routes (protected by authGuard and roleGuard)
- `/private/dashboard` → DashboardComponent (admin only)
- `/private/edit/:uuid` → EditComponent (own profile or admin)
- `/private/:uuid` → UserProfileComponent (authenticated view)

### Guards
- `authGuard`: Ensures user is authenticated
- `roleGuard`: Ensures user has required role for specific actions

### Interceptors
- `auth.interceptor`: Handles JWT token management and API requests

---

## 4. Component Details

### Public Components
- **LoginComponent**: Handles user authentication with email/password
- **RecoverComponent**: Handles password recovery requests
- **VerifyComponent**: Handles password reset verification
- **UserProfileComponent**: Displays public user profile with QR code

### Private Components
- **DashboardComponent**: Admin dashboard for user management
- **EditComponent**: Profile editing interface with photo upload
- **UserProfileComponent**: Detailed user profile view (private version)

### Services
- **AuthService**: Handles authentication operations
- **UserService**: Manages user-related operations
- **NotificationService**: Handles toast notifications
- **ThemeService**: Manages dark/light mode

### Models
- **UserModel**: Defines user data structure
- **AuthModel**: Defines authentication data structure
- **ApiModel**: Defines API response structure

## 5. Features

### Authentication
- JWT-based authentication
- Role-based access control
- Password recovery flow
- Session management

### User Profile
- Profile photo upload
- Contact information management
- Social media links
- Business card generation
- QR code generation

### UI/UX
- Responsive design
- Dark/Light mode toggle
- Toast notifications
- Loading indicators
- Form validation
- Error handling

### Security
- Route guards
- Token management
- Input validation
- XSS protection
- CSRF protection