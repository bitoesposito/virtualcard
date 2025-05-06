# Struttura database

## Entità
### Users

| entity | description |
|-|-:|
| email: string | |
| password: string | |
| role: string | enum di UserRole, default UserRole.USER |
| name: string | nullable |
| surname: string | nullable |
| areaCode: string | nullable |
| phone: string | nullable |
| website: string | nullable |
| isWhatsappEnabled: boolean | default false |
| isWebsiteEnabled: boolean | default false |
| isVcardEnabled: boolean | default false |
| slug: string | unique, nullable |
| createdAt: Date |  |
| updatedAt: Date |  |
| deletedAt: Date |  |

<!--
email:                          string	
password:                       string	
role: string	                enum di UserRole, default UserRole.USER
name: string	                nullable
surname: string	                nullable
areaCode: string	            nullable
phone: string	                nullable
website: string	                nullable
isWhatsappEnabled: boolean	    default false
isWebsiteEnabled: boolean	    default false
isVcardEnabled: boolean	        default false
slug: string	                unique, nullable
createdAt: Date	
updatedAt: Date	
deletedAt: Date	
-->

## Interfacce DTO

### UserResponseDto
#### Descrizione

Usato in: GET /user/:slug, GET /user/by-id/:uuid, GET /user/list per restituire dati pubblici di un utente. 

export class UserResponseDto {
  uuid: string;
  name?: string;
  surname?: string;
  areaCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  isWhatsappEnabled: boolean;
  isWebsiteEnabled: boolean;
  isVcardEnabled: boolean;
  slug: string;
  createdAt: Date;
}

### CreateUserDto
#### Descrizione

Usato in: /user/create da un admin per creare nuovi utenti di ruolo USER.

export class CreateUserDto {
  email: string;
}

### EditUserDto
#### Descrizione

Usato in: PUT /user/edit per la modifica del profilo utente, richiede l'autorizzazione JWT dell'utente che modifica il proprio profilo o di un admin.

export class EditUserDto {
  name?: string;
  surname?: string;
  areaCode?: string;
  phone?: string;
  website?: string;
  isWhatsappEnabled?: boolean;
  isWebsiteEnabled?: boolean;
  isVcardEnabled?: boolean;
  slug: string;
}

### LoginDto
#### Descrizione

Usato in: POST /auth/login per l'autenticazione, contiene le credenziali utente.

export class LoginDto {
  email: string;
  password: string;
}

### RecoverPasswordDto
#### Descrizione

Usato in: POST /auth/recover per inviare una mail contenente un token temporaneo.

export class RecoverPasswordDto {
  email: string;
}

### VerifyTokenDto
#### Descrizione

Usato in: POST /auth/verify per verificare un token di recupero e aggiornare la password / eseguire azioni che hanno bisogno di una verifica dell'identità.

export class VerifyTokenDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

### DeleteUserDto
#### Descrizione 

Usato in: DELETE /user/delete per eliminare un utente, può essere eseguito solo dall'utente stesso o da un admin.

export class DeleteUserDto {
  email: string;
}