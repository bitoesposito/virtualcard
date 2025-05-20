# Struttura Frontend Angular vCarder

## Panoramica
Questa documentazione descrive la struttura delle cartelle, i componenti principali e la gestione dei permessi per il frontend Angular dell'applicazione vCarder.

---

## 1. Struttura delle cartelle

```
src/
└── app/
    ├── core/
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── user.service.ts
    │   │   └── modal.service.ts
    │   ├── guards/
    │   │   ├── auth.guard.ts
    │   │   ├── admin.guard.ts
    │   │   └── owner.guard.ts
    │   └── models/
    │       ├── user.model.ts
    │       └── auth.model.ts
    ├── private/
    |   ├── components/
    |   |   ├── dashboard/
    |   |   ├── edit/
    |   |   ├── new/
    |   |   └── register/
    |   └── private-routing.module.ts
    ├── public/
    |   ├── components/
    |   |   ├── login/
    |   |   ├── recovery/
    |   |   ├── verify/
    │   │   └── user-detail/
    |   └── public-routing.module.ts
    ├── app-routing.module.ts
    └── app.module.ts
```

---

## 2. Componenti principali e permessi

| Funzionalità                         | USER (normale) | ADMIN|
|--------------------------------------|----------------|------|
| Login                                | ✅             | ✅  |
| Visualizza lista utenti              | ❌             | ✅  |
| Visualizza profilo proprio           | ✅             | ✅  |
| Visualizza profilo altri             | ✅ (pubblico)  | ✅  |
| Modifica profilo proprio             | ✅             | ✅  |
| Modifica altri profili               | ❌             | ✅  |
| Elimina profili                      | ❌             | ✅  |
| Crea nuovi utenti                    | ❌             | ✅  |
| Recupero password                    | ✅             | ✅  |

---

## 3. Routing suggerito

- `/login` → LoginComponent (tutti)
- `/forgot-password` → ForgotPasswordComponent (tutti)
- `/reset-password` → ResetPasswordComponent (tutti)
- `/users` → UserListComponent (solo admin, protetto da AdminGuard)
- `/users/create` → UserCreateComponent (solo admin, protetto da AdminGuard)
- `/users/:id` → UserDetailComponent (tutti, con logica: admin può vedere tutti, user solo il proprio o pubblico)
- `/users/:id/edit` → UserEditComponent (admin può modificare tutti, user solo il proprio, protetto da OwnerGuard o AdminGuard)
- `/card/:slug` → UserCardComponent (pubblico, nessuna protezione)

---