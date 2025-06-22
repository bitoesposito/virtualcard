# 🏗️ Mappa dell'Architettura - VirtualCard

## Panoramica del Sistema

VirtualCard è una piattaforma per biglietti da visita digitali che utilizza un'architettura moderna full-stack con microservizi containerizzati.

```
┌───────────────────────────────────────────────────────┐
│                  VirtualCard Platform                 │
├───────────────────────────────────────────────────────┤
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│ │   Frontend  │    │   Backend   │    │   Database  │ │
│ │   Angular   │◄──►│   NestJS    │◄──►│ PostgreSQL  │ │
│ │     SPA     │    │     API     │    │             │ │
│ └─────────────┘    └─────────────┘    └─────────────┘ │
│        │                   │                   │      │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│ │    Nginx    │    │    MinIO    │    │   Storage   │ │
│ │   Reverse   │    │   Object    │    │   Volumes   │ │
│ │   Proxy     │    │  Storage    │    │             │ │
│ └─────────────┘    └─────────────┘    └─────────────┘ │
└───────────────────────────────────────────────────────┘
```

## 🏛️ Architettura a Livelli

### 1. Layer di Presentazione (Frontend)
```
┌─────────────────────────────────────────────────────────────┐
│                      Angular Frontend                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Public Area   │ │  Private Area   │ │   Shared Area   │ │
│ │                 │ │                 │ │                 │ │
│ │ • Landing Page  │ │ • Dashboard     │ │ • Components    │ │
│ │ • User Profile  │ │ • Edit Profile  │ │ • Services      │ │
│ │ • QR Code       │ │ • Settings      │ │ • Guards        │ │
│ │ • Auth Pages    │ │ • Admin Panel   │ │ • Interceptors  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                    Core Features                        │ │
│ │ • Lazy Loading Modules                                  │ │
│ │ • Route Guards & Interceptors                           │ │
│ │ • Reactive Forms & Validation                           │ │
│ │ • Dark/Light Theme Support                              │ │
│ │ • Responsive Design                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Layer di Business Logic (Backend)
```
┌────────────────────────────────────────────────────────┐
│                    NestJS Backend                      │
├────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│ │     Auth     │  │     Users     │  │   Database   │  │
│ │    Module    │  │    Module     │  │    Module    │  │
│ │              │  │               │  │              │  │
│ │ • JWT Auth   │  │ • CRUD Ops    │  │ • TypeORM    │  │
│ │ • Guards     │  │ • Profiles    │  │ • Migrations │  │
│ │ • Strategies │  │ • File Upload │  | • Triggers   │  │
│ └──────────────┘  └───────────────┘  └──────────────┘  │
│                                                        │
│ ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│ │   Common     │  │   Utils      │  │   MinIO        │ │
│ │   Module     │  │   Module     │  │ Integration    │ │
│ │              │  │              │  │                │ │
│ │ • DTOs       │  │ • Helpers    │  │ • File Storage │ │
│ │ • Decorators │  │ • Validators │  │ • Bucket Mgmt  │ │
│ │ • Filters    │  │ • Constants  │  │ • URL Gen      │ │
│ └──────────────┘  └──────────────┘  └────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 3. Layer di Dati (Database)
```
┌ ────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                  │
├ ────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │                        Tables                       │ |
│ │ ┌──────────────────────┐  ┌───────────────────────┐ | |
│ │ │ auth_users           │  │ user_profiles         │ | |
│ │ │                      │  │                       │ | |
│ │ │ • uuid (PK)          │  │ • uuid (PK)           │ | |
│ │ │ • email              │  │ • email (FK)          │ | |
│ │ │ • password           │  │ • name                │ | |
│ │ │ • role               │  │ • surname             │ | |
│ │ │ • is_configured      |  | • area_code           | | |
│ │ │ • profile_uuid       |  | • phone               | | |
│ │ │ • reset_token        |  | • website             | | |
│ │ │ • reset_toekn_expiry |  | • is_whatsapp_enabled | | |
│ │ │ • created_at         |  | • is_website_enabled  | | |
│ │ │ • updated_at         |  | • is_vcard_enabled    | | |
| | └──────────────────────┘  | • slug                | | |
| |                           | • profile_photo       | | |
| |                           | • created_at          | | |
| |                           | • updated_at          | | |
| |                           └───────────────────────┘ | |
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                        Triggers                     │ │
│ │                                                     │ │
│ │  update_updated_at_column()                         │ │
│ │  update_auth_users_updated_at                       │ │
│ │  update_user_profiles_updated_at                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Flusso dei Dati

### 1. Autenticazione
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───►│   Backend    │───►│  Database   │───►│   Response  │
│             │    │              │    │             │    │             │
│ Login Form  │    │ Auth Module  │    │ Check User  │    │ JWT Token   │
│             │    │ JWT Strategy │    │ Validate    │    │ User Data   │
│             │    │ Bcrypt Hash  │    │ Password    │    │             │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

### 2. Gestione Profilo
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│   Frontend   │───►│   Backend    │───►│   MinIO      │───►│  Database      │
│              │    │              │    │              │    │                │
│ Profile Form │    │ Users Module │    │ Store File   │    │ Save URL       │
│ File Upload  │    │ File Handler │    │ Generate URL │    │ Update Profile │
│              │    │ Validation   │    │ Optimize     │    │                │
└──────────────┘    └──────────────┘    └──────────────┘    └────────────────┘
```

### 3. Generazione QR Code
```
┌─────────────┐    ┌────────────┐    ┌─────────────┐    ┌──────────┐
│   Frontend  │───►│   Backend  │───►│  Database   │───►│ Frontend │
│             │    │            │    │             │    │          │
│ QR Request  │    │ QR Service │    │ Get Profile │    │ QR Code  │
│ Profile URL │    │ Generate   │    │ Data        │    │ Display  │
│             │    │ QR Image   │    │ Slug Info   │    │          │
└─────────────┘    └────────────┘    └─────────────┘    └──────────┘
```

## 🐳 Architettura Containerizzata

### Docker Compose Services
```
┌─────────────────────────────────────────────────────────┐
│                   Docker Compose Stack                  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────┐  ┌────────────┐       │
│ │    Nginx    │  │   Frontend   │  │   Backend  │       │
│ │   :80/443   │  │    :4200     │  │    :3000   │       │
│ │             │  │              │  │            │       │
│ │ • SSL/TLS   │  │ • Angular    │  │ • NestJS   │       │
│ │ • Proxy     │  │ • Dev Mode   │  │ • API      │       │
│ │ • Load Bal  │  │ • Hot Reload │  │ • JWT Auth │       │
│ └─────────────┘  └──────────────┘  └────────────┘       │
│ ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│ │  PostgreSQL  │  │    MinIO     │  │     Volumes     │ │
│ │   :35000     │  │  :9000/9001  │  │                 │ │
│ │              │  │              │  │                 │ │
│ │ • Database   │  │ • File Store │  │ • postgres_data │ │
│ │ • Migrations │  │ • Console    │  │ • minio_data    │ │
│ │ • Triggers   │  │ • Buckets    │  │                 │ │
│ └──────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔒 Sicurezza

### Security Layers
```
┌───────────────────────────────────────────────────┐
│              Security Architecture                │
├───────────────────────────────────────────────────┤
│                                                   │
│ ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │   Network   │ │ Application  │ │     Data     │ │
│ │    Layer    │ │    Layer     │ │    Layer     │ │
│ │             │ │              │ │              │ │
│ │ • SSL/TLS   │ │ • JWT Auth   │ │ • Encryption │ │
│ │ • Firewall  │ │ • RBAC       │ │ • Hashing    │ │
│ │ • Rate Lim  │ │ • Validation │ │ • Backups    │ │
│ └─────────────┘ └──────────────┘ └──────────────┘ │
│ ┌───────────────────────────────────────────────┐ │
│ │               Security Features               │ │
│ │ • Password Hashing (bcrypt)                   │ │
│ │ • JWT Token Expiration                        │ │
│ │ • Input Validation & Sanitization             │ │
│ │ • XSS & CSRF Protection                       │ │
│ │ • File Upload Validation                      │ │
│ │ • SQL Injection Prevention                    │ │
│ │ • Role-Based Access Control                   │ │
│ └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

## 📊 Struttura dei Moduli Frontend

```
frontend/src/app/
├── app.component.ts                # Componente principale
├── app.routes.ts                   # Configurazione routing
├── app.config.ts                   # Configurazione app
├── shared/                         # Modulo condiviso
│   ├── components/                 # Componenti riutilizzabili
│   ├── services/                   # Servizi condivisi
│   └── models/                     # Interfacce e tipi
├── public/                         # Area pubblica
│   ├── components/                 # Componenti pubblici
│   ├── auth-routing.module.ts
│   └── public-routing.module.ts
├── private/                        # Area privata
│   ├── dashboard/                  # Dashboard utente
│   ├── edit/                       # Modifica profilo
│   └── private-routing.module.ts
├── services/                       # Servizi applicazione
├── guards/                         # Route guards
├── interceptors/                   # HTTP interceptors
└── models/                         # Modelli dati
```

## 🏢 Struttura dei Moduli Backend

```
backend/src/
├── main.ts                         # Entry point
├── app.module.ts                   # Modulo principale
├── app.controller.ts               # Controller principale
├── app.service.ts                  # Servizio principale
├── auth/                           # Modulo autenticazione
│   ├── auth.controller.ts          # Controller auth
│   ├── auth.service.ts             # Servizio auth
│   ├── auth.module.ts              # Modulo auth
│   ├── auth.dto.ts                 # DTO auth
│   ├── auth.interface.ts           # Interfacce auth
│   ├── guards/                     # Guards autenticazione
│   ├── strategies/                 # Strategie JWT
│   └── entities/                   # Entità auth
├── users/                          # Modulo utenti
│   ├── users.controller.ts         # Controller utenti
│   ├── users.service.ts            # Servizio utenti
│   ├── users.module.ts             # Modulo utenti
│   ├── users.dto.ts                # DTO utenti
│   └── entities/                   # Entità utenti
├── database/                       # Modulo database
├── common/                         # Modulo comune
├── utils/                          # Utilità
└── environments/                   # Configurazioni
```

## 🔧 Tecnologie Utilizzate

### Frontend Stack
- **Framework**: Angular 17+
- **Language**: TypeScript
- **Styling**: SCSS
- **Build Tool**: Angular CLI
- **Package Manager**: npm
- **Testing**: Jasmine/Karma

### Backend Stack
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **Validation**: class-validator
- **File Upload**: Multer

### Infrastructure Stack
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx
- **Object Storage**: MinIO
- **Database**: PostgreSQL
- **SSL/TLS**: Let's Encrypt

### Development Tools
- **Version Control**: Git
- **IDE**: VS Code
- **API Testing**: Postman/Insomnia
- **Database Client**: pgAdmin/DBeaver
- **Container Management**: Docker Desktop

## 📋 Checklist Architetturale

### ✅ Implementato
- [x] Architettura a microservizi
- [x] Containerizzazione completa
- [x] Autenticazione JWT
- [x] Role-based access control
- [x] File storage con MinIO
- [x] Database con trigger automatici
- [x] API RESTful
- [x] Frontend SPA con lazy loading
- [x] SSL/TLS support
- [x] Input validation
- [x] Error handling
- [x] Logging
- [x] Health checks