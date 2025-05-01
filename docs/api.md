# Lista delle api necessarie al progetto

### Autenticazione

POST    auth/login              Gestisce l'autenticazione JWT e permette l'accesso alla piattaforma
POST    auth/logout             Revoca il token JWT permettendo la disconnessione sicura alla piattaforma
POST    auth/recover            Manda la richiesta per l'invio del token per la verifica finalizzata al recupero password
POST    auth/verify             Verifica processi sensibili come il recupero della password o abilitazione MFA

### Gestione profili

POST    user/create             Permette a creazione di un utente di ruolo user
PUT     user/edit               Permette la modifica del profilo utente
DEL     user/delete             Permette l'eliminazione del profilo utente
GET     user/list               Permette il listaggio di tutti gli utenti presenti in piattaforma
GET     user/:slug              Visualizza tutti i dati pubblici di un profilo ricercandolo tramite slug
GET     user/by-id/:id          Visualizza tutti i dati pubblici di un profilo ricercandolo tramite id

# Struttura risposta endpoint

## auth/login
### Descrizione

Gestisce l'autenticazione JWT e permette l'accesso alla piattaforma.

reqBody: {
	"email": "string",
	"passwrod": "string"
}

### Risposte

200: {
  "message": string,
  "token": string,
	"user": `UserResponseDto`
}

400: {
  "statusCode": 400,
  "message": "Email and password are required"
}

401: {
  "statusCode": 401,
  "message": "Invalid credentials"
}

### Esempio di risposta eseguita con successo

{
	"message": "Successfully logged in",
  "accessToken": "JWT_TOKEN_HERE",
  "user": {
    "id": "uuid",
    "slug": "user-slug",
    "name": "Mario",
    "surname": "Rossi",
    "isWhatsappEnabled": false,
    "isWebsiteEnabled": false,
    "isVcardEnabled": false,
    "website": "https://example.com",
    "areaCode": "+39",
    "phone": "3331234567",
    "createdAt": "2025-01-01T12:00:00.000Z"
  }
}

## auth/logout
### Descrizione

Revoca il token JWT corrente del client per disconnettere in sicurezza l’utente.

Authorization: Bearer `<token>`.

### Risposte

200: {
  "message": "Logout successful"
}

401: {
  "statusCode": 401,
  "message": "Invalid or expired token"
}

### Esempio di risposta eseguita con successo

200: {
  "message": "Logout successful"
}

## auth/recover
### Descrizione

Invia un'email con un link contenente un token temporaneo (valido 1 ora) per il recupero password. Il link reindirizza a `/verify?token=<token>`.

reqBody: {
  "email": string
}

### Risposte

200: {
  "message": "Recovery email sent",
  "expiresIn": 3600 // Durata token in secondi (1 ora)
}

404: {
  "statusCode": 404,
  "message": "Email not found"
}

429: {
  "statusCode": 429,
  "message": "Too many recovery attempts. Please try again later."
}

### Esempio di risposta eseguita con successo

{
  "message": "Recovery email sent if the address is registered"
}

## auth/verify
### Descrizione

Verifica il token di recupero password e, se valido, permette l'aggiornamento della password. Deve essere chiamato dopo che l'utente ha inserito la nuova password nella pagina `/verify?token=<token>`.

reqBody: {
  "token": string,
  "newPassword": string,
  "confirmPassword": string
}

### Risposte

200: {
  "message": "Password updated successfully"
}

400: {
	"statusCode": 400,
	"message": "Passwords do not match or token is missing"
}

401: {
  "statusCode": 401,
  "message": "Invalid or expired token"
}

404: {
  "statusCode": 404,
  "message": "User not found for this token"
}

### Esempio di risposta eseguita con successo

{
  "message": "Password updated successfully"
}


## user/create
### Descrizione

Genera un nuovo utente con ruolo user e tutte le informazioni disponibili settate come `null`, per poi inviare tramite mail le credenziali di accesso per poter permettere all'utente di impostare una propria password e di impostare le sue informazioni di accesso.

reqBody {
	"email" : string
}

### Risposte

201: {
	"message": "User created",
	"email": string,
	"url": string
}

400: {
	"statusCode": 400,
	"message": "Email is required" 
}

### Esempio di risposta eseguita con successo

{
  "message": "User created",
  "email": "info@mariorossi.com",
	"url": "https://localhost/verify?token=<token>"
}

## user/edit
### Descrizione

Permette la modifica del profilo utente previa autenticazione via JWT.

Authorization: Bearer `<token>`

reqBody: {
  "name": string,
  "surname": string,
  "areaCode": string,
  "phone": string,
  "website"?: string,
  "isWhatsappEnabled": boolean,
  "isWebsiteEnabled": boolean,
  "isVcardEnabled": boolean
  "slug": string,
}

### Risposte

200: {
  "message": "Profile updated successfully",
  "body": {
    "name": "string",
    "surname": "string",
    "areaCode": "string",
    "phone": "string",
    "website": "string",
    "isWhatsappEnabled": boolean,
    "isWebsiteEnabled": boolean,
    "isVcardEnabled": boolean,
    "slug": "string"
  }
}

400: {
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "slug",
      "error": "Slug already taken"
    }
  ]
}

401: {
  "statusCode": 401,
  "message": "Invalid or expired token"
}

404: {
  "statusCode": 404,
  "message": "User not found"
}

409: {
  "statusCode": 409,
  "message": "Slug not available"
}

### Esempio di risposta eseguita con successo

{
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

## user/delete
### Descrizione

Elimina definitivamente il profilo utente e tutti i dati associati previa autenticazione via JWT di un admin o dell'utente proprietario del profilo.

Authorization: Bearer `<token>` di un admin o dell'utente proprietario del profilo.

reqBody: {
	"email": string
}

### Risposte

200: {
  "message": "User account deleted successfully",
  "deletedAt": "2023-05-20T12:00:00Z"
}

401: {
  "statusCode": 401,
  "message": "Invalid or expired token"
}

403: {
  "statusCode": 403,
  "message": "You can only delete your own account"
}

404: {
  "statusCode": 404,
  "message": "User not found"
}

### Esempio di risposta eseguita con successo

{
  "message": "User deleted successfully"
}

## user/list
### Descrizione

Restituisce un array con tutti gli utenti registrati nella piattaforma.

Authorization: Bearer `<token>` di un admin.

### Risposte

200: {
	"users": [
    {
      "id": "string",
			"name": "string",
			"surname": "string",
			"areaCode": "string",
			"phone": "string",
			"website": "string",
			"isWhatsappEnabled": boolean,
			"isWebsiteEnabled": boolean,
			"isVcardEnabled": boolean,
			"slug": "string",
			createdAt: "string"
    }
  ]
}

401: {
  "statusCode": 401,
  "message": "Admin privileges required"
}

403: {
  "statusCode": 403,
  "message": "Forbidden: insufficient permissions"
}

### Esempio di risposta eseguita con successo

200: [
	{
    "id": "uuid",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
  	"email"?: "info@mariorossi.com";
    "website": "https://mariorossi.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": false,
    "slug": "mariorossi",
		"createdAt": "2025-01-01T12:10:00.000Z"
  },
	{
    "id": "uuid2",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
  	"email"?: "info@mariorossi.com";
    "website": "https://mariorossi2.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": false,
    "slug": "mariorossi-2",
		"createdAt": "2025-01-01T12:11:00.000Z"
  }
]

## user/:slug
### Descrizione

Restituisce tutti i dati pubblici associati a un profilo utente ricercandolo tramite slug, accessibile senza autenticazione.

GET /user/{slug}

### Risposte

200: {
		"id": "string",
    "name": "string",
    "surname": "string",
    "areaCode": "string",
    "phone": "string",
    "website": "string",
    "isWhatsappEnabled": boolean,
    "isWebsiteEnabled": boolean,
    "isVcardEnabled": boolean,
    "slug": "string"
  }

401: {
  "statusCode": 400,
  "message": "Provide either user id or slug"
}

404: {
  "statusCode": 404,
  "message": "User profile not found"
}

### Esempio di risposta eseguita con successo

200: {
    "id": "uuid",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
  	"email"?: "info@mariorossi.com";
    "website": "https://mariorossi.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": false,
    "slug": "mariorossi",
  }

## user/by-id/:id
### Descrizione

Restituisce tutti i dati pubblici associati a un profilo utente ricercandolo tramite id, accessibile senza autenticazione.

GET /user/by-id/{id}

### Risposte

200: {
		"id": "string",
    "name": "string",
    "surname": "string",
    "areaCode": "string",
    "phone": "string",
    "website": "string",
    "isWhatsappEnabled": boolean,
    "isWebsiteEnabled": boolean,
    "isVcardEnabled": boolean,
    "slug": "string"
  }

401: {
  "statusCode": 400,
  "message": "Provide either user id or slug"
}

404: {
  "statusCode": 404,
  "message": "User profile not found"
}

### Esempio di risposta eseguita con successo

200: {
    "id": "uuid",
    "name": "Mario",
    "surname": "Rossi",
    "areaCode": "+39",
    "phone": "3331234567",
  	"email"?: "info@mariorossi.com";
    "website": "https://mariorossi.com",
    "isWhatsappEnabled": true,
    "isWebsiteEnabled": true,
    "isVcardEnabled": false,
    "slug": "mariorossi",
  }