# Regole e Logica

## Ruoli e Permessi

### Ruoli disponibili

__ADMIN__: ruolo con accesso completo alle funzioni di gestione utenti.

__USER__: ruolo predefinito, con accesso limitato al proprio profilo.

### Permessi per ruolo

|Azione|USER|ADMIN|
|-                              |--|--|
|Login|                         O|O|
|Visualizzare utenti (pubblico)|O|O|
|Visualizzare utenti (lista)|   X|O|
|Modificare il proprio profilo| O|O|
|Modificare altri utenti|       X|O|
|Eliminare il proprio profilo|  O|O|
|Eliminare altri utenti|        X|O|
|Creare nuovi utenti|           X|O|
|Recupero password|             O|O|
|Verifica token di recupero|    O|O|

## Validazioni e Vincoli

### Campi obbligatori

`email`: obbligatoria, valida e univoca.

`password`: obbligatoria per login e creazione.

`slug`: obbligatorio in fase di modifica se isVcardEnabled è true.

#### `Slug`

Deve essere univoco nel database.

Formato consentito: `minuscolo, lettere, numeri, trattino ([a-z0-9-])`.

Non può essere modificato se già assegnato, salvo da admin.

### Campi opzionali

`name`, `surname`, `areaCode`, `phone`, `website` sono opzionali.

Se `isWhatsappEnabled = true`, il campo phone deve essere compilato.

Se `isWebsiteEnabled = true`, il campo website deve essere compilato.

## Comportamenti automatici

`role`: assegnato come USER di default alla creazione.

`createdAt`, `updatedAt`, `deletedAt`: gestiti automaticamente da ORM.

`Password`: hashata al momento del salvataggio.

`Email`: trattata come lowercase per confronti univoci.

## Sicurezza e accesso

### Autenticazione

Tutte le modifiche richiedono JWT valido.

Gli utenti possono modificare solo il proprio profilo.

Gli admin possono accedere e modificare qualsiasi utente.

#### Recupero password

`RecoverPasswordDto`: genera token temporaneo (es. valido 30 minuti).

`VerifyTokenDto`: se token valido, aggiorna la password con controllo newPassword === confirmPassword.

## Errori comuni da gestire

`409` Conflict: email o slug duplicati.

`400` Bad Request: campo mancante o non valido.

`401` Unauthorized: JWT assente o invalido.

`403` Forbidden: azione non consentita (es. utente che modifica altro utente).

`404` Not Found: utente non esistente o eliminato.