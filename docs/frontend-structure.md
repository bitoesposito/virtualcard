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
    │   └── user.service.ts
    ├── guards/
    │   ├── auth.guard.ts
    │   └── role.guard.ts
    ├── interceptors/
    │   └── auth.interceptor.ts
    ├── models/
    │   ├── user.model.ts
    │   └── auth.model.ts
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

---

## 3. Routing Structure

### Public Routes
- `/login` → LoginComponent (all users)
- `/recover` → RecoverComponent (all users)
- `/verify` → VerifyComponent (all users)
- `/u/:slug` → UserProfileComponent (public access)

### Private Routes (protected by authGuard and roleGuard)
- `/private/dashboard` → DashboardComponent
- `/private/edit/:uuid` → EditComponent
- `/private/:uuid` → UserProfileComponent

### Guards
- `authGuard`: Ensures user is authenticated
- `roleGuard`: Ensures user has required role for specific actions

### Interceptors
- `auth.interceptor`: Handles JWT token management and API requests

---

## 4. Component Details

### Public Components
- **LoginComponent**: Handles user authentication
- **RecoverComponent**: Handles password recovery requests
- **VerifyComponent**: Handles password reset verification
- **UserProfileComponent**: Displays public user profile

### Private Components
- **DashboardComponent**: Main dashboard for authenticated users
- **EditComponent**: Profile editing interface
- **UserProfileComponent**: Detailed user profile view (private version)

### Services
- **AuthService**: Handles authentication operations
- **UserService**: Manages user-related operations

### Models
- **UserModel**: Defines user data structure
- **AuthModel**: Defines authentication data structure