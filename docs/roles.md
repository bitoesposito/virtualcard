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

`password`: obbligatoria per login e creazione, 6-128 caratteri.

`slug`: obbligatorio in fase di modifica se isVcardEnabled è true.

#### `Slug`

Deve essere univoco nel database.

Formato consentito: `minuscolo, lettere, numeri, trattino ([a-z0-9-])`.

Lunghezza: 3-50 caratteri.

Non può essere modificato se già assegnato, salvo da admin.

### Campi opzionali

`name`, `surname`: 2-50 caratteri.

`areaCode`, `phone`: formato valido.

`website`: formato valido.

Se `isWhatsappEnabled = true`, il campo phone deve essere compilato.

Se `isWebsiteEnabled = true`, il campo website deve essere compilato.

## Comportamenti automatici

`uuid`: generato automaticamente come primary key.

`role`: assegnato come USER di default alla creazione.

`is_configured`: false di default, indica se l'utente ha completato la configurazione.

`created_at`, `updated_at`: gestiti automaticamente da ORM.

`password`: hashata al momento del salvataggio.

`email`: trattata come lowercase per confronti univoci.

## Sicurezza e accesso

### Autenticazione

Tutte le modifiche richiedono JWT valido.

Gli utenti possono modificare solo il proprio profilo.

Gli admin possono accedere e modificare qualsiasi utente.

#### Recupero password

`ForgotPasswordDto`: genera token temporaneo (valido 10 minuti).

`UpdatePasswordDto`: se token valido, aggiorna la password.

## Errori comuni da gestire

`400` Bad Request:
- Campo mancante o non valido
- Formato UUID non valido
- Formato email non valido
- Formato password non valido (min 6, max 128 caratteri)
- Formato slug non valido
- Formato area code non valido
- Formato phone non valido
- Formato website non valido
- Lunghezza name/surname non valida (2-50 caratteri)

`401` Unauthorized:
- JWT assente o invalido
- Credenziali non valide al login

`403` Forbidden:
- Azione non consentita (es. utente che modifica altro utente)
- Tentativo di eliminare l'ultimo admin

`404` Not Found:
- Utente non esistente
- Utente non trovato dopo aggiornamento

`409` Conflict:
- Email duplicata
- Slug duplicato

`429` Too Many Requests:
- Troppi tentativi di recupero password

`500` Internal Server Error:
- Errore interno del server
- Errore durante la creazione utente
- Errore durante l'aggiornamento utente
- Errore durante l'eliminazione utente
- Errore durante la ricerca utente