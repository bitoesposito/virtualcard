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
    ├── shared/
    │   ├── components/
    │   │   ├── input/
    │   │   ├── button/
    │   │   └── alert/
    │   └── pipes/
    ├── auth/
    │   ├── login/
    │   ├── forgot-password/
    │   └── reset-password/
    ├── users/
    │   ├── user-list/
    │   ├── user-detail/
    │   ├── user-edit/
    │   ├── user-create/
    │   └── user-card/
    ├── modals/
    │   ├── confirm-save/
    │   ├── confirm-delete/
    │   └── confirm-cancel/
    ├── app-routing.module.ts
    └── app.module.ts
```

---

## 2. Componenti principali e permessi

| Funzionalità                        | USER (normale)         | ADMIN                |
|------------------------------------- |----------------------- |--------------------- |
| Login                               | ✅                     | ✅                   |
| Visualizza lista utenti              | ❌ (solo pubblico)     | ✅                   |
| Visualizza profilo proprio           | ✅                     | ✅                   |
| Visualizza profilo altri             | ✅ (pubblico)          | ✅                   |
| Modifica profilo proprio             | ✅                     | ✅                   |
| Modifica altri profili               | ❌                     | ✅                   |
| Elimina profilo proprio              | ✅                     | ✅                   |
| Elimina altri profili                | ❌                     | ✅                   |
| Crea nuovi utenti                    | ❌                     | ✅                   |
| Recupero password                    | ✅                     | ✅                   |

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

## 4. Gestione permessi (guardie)

- **AuthGuard**: protegge tutte le route che richiedono autenticazione.
- **AdminGuard**: protegge le route riservate agli admin (lista utenti, creazione, modifica/eliminazione altri utenti).
- **OwnerGuard**: protegge la modifica del proprio profilo (solo l'utente stesso o admin).

---

## 5. Note aggiuntive

- I componenti modali sono riutilizzabili per conferme di salvataggio, eliminazione e annullamento modifiche.
- I servizi in `core/services` gestiscono chiamate API, autenticazione e stato utente.
- I componenti in `shared/components` sono per UI riutilizzabile (input, bottoni, alert).
- Le guardie in `core/guards` assicurano che solo chi ha i permessi giusti possa accedere alle route.

---

## 6. Esempio struttura per la feature "users"

```
users/
├── user-list/
│   ├── user-list.component.ts
│   └── ...
├── user-detail/
│   ├── user-detail.component.ts
│   └── ...
├── user-edit/
│   ├── user-edit.component.ts
│   └── ...
├── user-create/
│   ├── user-create.component.ts
│   └── ...
├── user-card/
│   ├── user-card.component.ts
│   └── ...
```

---

## 7. Best practice

- Utilizzare moduli lazy-loaded per `auth` e `users` se il progetto cresce.
- Centralizzare la logica di autenticazione e permessi nei servizi e nelle guardie.
- Validare i dati lato frontend secondo le regole descritte nella documentazione backend. 