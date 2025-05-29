# Lista delle api necessarie al progetto

### Autenticazione

POST    auth/login              Gestisce l'autenticazione JWT e permette l'accesso alla piattaforma
POST    auth/recover            Manda la richiesta per l'invio del token per la verifica finalizzata al recupero password
POST    auth/verify             Verifica processi sensibili come il recupero della password o abilitazione MFA

### Gestione profili

POST    user/create             Permette a creazione di un utente di ruolo user
PUT     user/edit               Permette la modifica del profilo utente
DEL     user/delete             Permette l'eliminazione del profilo utente
GET     user/list               Permette il listaggio di tutti gli utenti presenti in piattaforma
GET     user/:slug              Visualizza tutti i dati pubblici di un profilo ricercandolo tramite slug
GET     user/by-id/:uuid        Visualizza tutti i dati pubblici di un profilo ricercandolo tramite uuid
GET     user/check-slug/:slug   Verifica se uno slug è disponibile per l'uso

# Struttura risposta endpoint

## auth/login
### Descrizione

Gestisce l'autenticazione JWT e permette l'accesso alla piattaforma.

reqBody: {
	"email": "string",
	"password": "string"
}

### Risposte

200: {
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": string,
    "user": {
      "uuid": string,
      "email": string,
      "role": string
    }
  }
}

400: {
  "success": false,
  "message": "Validation error",
  "data": null
  // Possibili messaggi:
  // - "Email is required"
  // - "Invalid email format"
  // - "Email cannot exceed 255 characters"
  // - "Password is required"
  // - "Password must be at least 8 characters"
  // - "Password cannot exceed 128 characters"
  // - "Password must include an uppercase letter, a lowercase letter, a number, and a special character"
}

401: {
  "success": false,
  "message": "Invalid credentials",
  "data": null
}

500: {
  "success": false,
  "message": "An error occurred during login",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "JWT_TOKEN_HERE",
    "user": {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "role": "user"
    }
  }
}

## auth/recover
### Descrizione

Invia un'email con un link contenente un token temporaneo (valido 10 minuti) per il recupero password. Il link reindirizza a `/verify?token=<token>`. Per motivi di sicurezza, la risposta sarà sempre positiva anche se l'email non esiste nel sistema.

reqBody: {
  "email": string
}

### Risposte

200: {
  "success": true,
  "message": "If the email address is registered, you will receive a password reset link",
  "data": {
    "expiresIn": 600  // Durata token in secondi (10 minuti)
  }
}

400: {
  "success": false,
  "message": "Validation error",
  "data": null
  // Possibili messaggi:
  // - "Email is required"
  // - "Invalid email format"
  // - "Email cannot exceed 255 characters"
}

429: {
  "success": false,
  "message": "Too many password reset attempts. Please try again later.",
  "data": null
}

500: {
  "success": false,
  "message": "An error occurred during password reset",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "If the email address is registered, you will receive a password reset link",
  "data": {
    "expiresIn": 600
  }
}

## auth/verify
### Descrizione

Verifica il token di recupero password e, se valido, permette l'aggiornamento della password. Deve essere chiamato dopo che l'utente ha inserito la nuova password nella pagina `/verify?token=<token>`.

reqBody: {
  "token": string,
  "new_password": string;
  "conirm_password": string;
}

### Risposte

200: {
  "success": true,
  "message": "Password has been updated successfully",
  "data": null
}

400: {
  "success": false,
  "message": "Validation error",
  "data": null
  // Possibili messaggi:
  // - "Token is required"
  // - "Invalid token"
  // - "New password is required"
  // - "Password confirmation is required"
  // - "Password must be at least 8 characters"
  // - "Password cannot exceed 128 characters"
  // - "Password must include an uppercase letter, a lowercase letter, a number, and a special character"
}

401: {
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}

404: {
  "success": false,
  "message": "User not found",
  "data": null
}

500: {
  "success": false,
  "message": "An error occurred while updating password",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "Password has been updated successfully",
  "data": null
}

## user/create
### Descrizione

Genera un nuovo utente con ruolo user e tutte le informazioni disponibili settate come `null`. Invia tramite email un link contenente un token temporaneo (valido 10 minuti) per permettere all'utente di impostare una propria password. Il link reindirizza a `/verify?token=<token>`.

reqBody: {
  "email": string
}

### Risposte

200: {
  "success": true,
  "message": "User created",
  "data": {
    "email": string
  }
}

400: {
  "success": false,
  "message": "Validation error",
  "data": null
  // Possibili messaggi:
  // - "Email is required"
  // - "Invalid email format"
  // - "Email cannot exceed 255 characters"
}

409: {
  "success": false,
  "message": "User with this email already exists",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to create user",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "User created",
  "data": {
    "email": "info@mariorossi.com"
  }
}

## user/edit
### Descrizione

Permette la modifica del profilo utente previa autenticazione via JWT. Tutti i campi sono opzionali e verranno aggiornati solo quelli forniti nella richiesta.

Authorization: Bearer `<token>`

reqBody: {
  "name"?: string,
  "surname"?: string,
  "areaCode"?: string,
  "phone"?: string,
  "website"?: string,
  "isWhatsappEnabled"?: boolean,
  "isWebsiteEnabled"?: boolean,
  "isVcardEnabled"?: boolean,
  "slug"?: string
}

### Risposte

200: {
  "success": true,
  "message": "User updated successfully",
  "data": {
    "uuid": string,
    "name": string,
    "surname": string,
    "areaCode": string,
    "phone": string,
    "website": string,
    "isWhatsappEnabled": boolean,
    "isWebsiteEnabled": boolean,
    "isVcardEnabled": boolean,
    "slug": string,
    "email": string,
    "role": string
  }
}

400: {
  "success": false,
  "message": "Validation error",
  "data": null
  // Possibili messaggi:
  // - "Name must be between 2 and 50 characters"
  // - "Surname must be between 2 and 50 characters"
  // - "Area code must start with + followed by 1-4 digits"
  // - "Phone number must be 10 digits"
  // - "Invalid website URL format"
  // - "Slug must be between 3 and 50 characters"
  // - "Slug can only contain lowercase letters, numbers, and hyphens"
}

401: {
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}

403: {
  "success": false,
  "message": "You can only edit your own profile",
  "data": null
}

404: {
  "success": false,
  "message": "User not found",
  "data": null
}

409: {
  "success": false,
  "message": "Slug already exists",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to edit user",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
    "website": "https://mariorossi.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": true,
    "slug": "mario-rossi",
    "email": "info@mariorossi.com",
    "role": "user"
  }
}

## user/check-slug/:slug
### Descrizione

Verifica se uno slug è disponibile per l'uso. Questo endpoint è utile per verificare se un URL del profilo è già in uso prima di tentare di salvarlo.

### Risposte

200: {
  "success": true,
  "message": "Slug availability checked successfully",
  "data": {
    "available": boolean
  }
}

400: {
  "success": false,
  "message": "Invalid slug format",
  "data": null
}

400: {
  "success": false,
  "message": "Invalid slug value",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to check slug availability",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "Slug availability checked successfully",
  "data": {
    "available": true
  }
}

## user/delete
### Descrizione

Elimina definitivamente il profilo utente e tutti i dati associati previa autenticazione via JWT di un admin o dell'utente proprietario del profilo.

Authorization: Bearer `<token>` di un admin o dell'utente proprietario del profilo.

reqBody: {
  "email": string
}

### Risposte

200: {
  "success": true,
  "message": "User deleted successfully",
  "data": null
}

400: {
  "success": false,
  "message": "Validation error",
  "data": null
  // Possibili messaggi:
  // - "Email is required"
  // - "Invalid email format"
  // - "Email cannot exceed 255 characters"
}

401: {
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}

403: {
  "success": false,
  "message": "You can only delete your own account",
  "data": null
  // Oppure:
  // - "Cannot delete the last admin user"
}

404: {
  "success": false,
  "message": "User not found",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to delete user",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}

## user/list
### Descrizione

Restituisce un array con tutti gli utenti registrati nella piattaforma. Richiede l'autenticazione via JWT di un admin.

Authorization: Bearer `<token>`

### Risposte

200: {
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "uuid": string,
      "name": string,
      "surname": string,
      "areaCode": string,
      "phone": string,
      "website": string,
      "isWhatsappEnabled": boolean,
      "isWebsiteEnabled": boolean,
      "isVcardEnabled": boolean,
      "slug": string,
      "email": string,
      "role": string,
      "createdAt": string  // ISO 8601 timestamp
    }
  ]
}

401: {
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}

403: {
  "success": false,
  "message": "Admin privileges required",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to fetch users",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Mario",
      "surname": "Rossi",
      "areaCode": "+39",
      "phone": "3331234567",
      "website": "https://mariorossi.com",
      "isWhatsappEnabled": true,
      "isWebsiteEnabled": true,
      "isVcardEnabled": true,
      "slug": "mario-rossi",
      "email": "info@mariorossi.com",
      "role": "user",
      "createdAt": "2024-03-20T12:00:00.000Z"
    }
  ]
}

## user/:slug
### Descrizione

Restituisce tutti i dati pubblici associati a un profilo utente ricercandolo tramite slug. Accessibile senza autenticazione.

GET /user/{slug}

### Risposte

200: {
  "success": true,
  "message": "User found",
  "data": {
    "uuid": string,
    "name": string,
    "surname": string,
    "areaCode": string,
    "phone": string,
    "website": string,
    "isWhatsappEnabled": boolean,
    "isWebsiteEnabled": boolean,
    "isVcardEnabled": boolean,
    "slug": string
  }
}

400: {
  "success": false,
  "message": "Slug is required",
  "data": null
}

404: {
  "success": false,
  "message": "User not found",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to find user",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "User found",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
    "website": "https://mariorossi.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": true,
    "slug": "mario-rossi"
  }
}

## user/by-id/:uuid
### Descrizione

Restituisce tutti i dati pubblici associati a un profilo utente ricercandolo tramite UUID. Accessibile senza autenticazione.

GET /user/by-id/{uuid}

### Risposte

200: {
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "uuid": string,
    "name": string,
    "surname": string,
    "areaCode": string,
    "phone": string,
    "website": string,
    "isWhatsappEnabled": boolean,
    "isWebsiteEnabled": boolean,
    "isVcardEnabled": boolean,
    "slug": string
  }
}

400: {
  "success": false,
  "message": "Invalid UUID format",
  "data": null
}

404: {
  "success": false,
  "message": "User not found",
  "data": null
}

500: {
  "success": false,
  "message": "Failed to find user",
  "data": null
}

### Esempio di risposta eseguita con successo

{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
    "website": "https://mariorossi.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": true,
    "slug": "mario-rossi"
  }
}