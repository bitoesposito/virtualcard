# 🏦 Virtual CARD

> Sistema di gestione carte virtuali sviluppato con Angular e NestJS, implementando un'architettura moderna e scalabile.

## 📋 Overview

Il sistema permette la gestione completa del ciclo di vita delle carte virtuali, dalla creazione alla gestione delle transazioni, con un'interfaccia intuitiva e sicura.

## 🛠️ Stack Tecnologico

### Frontend
| Tecnologia | Descrizione |
|------------|-------------|
| **Framework** | Angular |
| **Architettura** | Modulare con lazy loading |
| **Sicurezza** | Route protection, JWT integration |
| **UI/UX** | Componenti riutilizzabili, responsive design |
| **Gestione Stato** | Servizi dedicati, interceptors |

### Backend
| Tecnologia | Descrizione |
|------------|-------------|
| **Framework** | NestJS |
| **Database** | PostgreSQL con TypeORM |
| **Autenticazione** | JWT |
| **API** | RESTful con validazione DTO |
| **Storage** | MinIO per file management |

### Infrastruttura
| Componente | Tecnologia |
|------------|------------|
| **Container** | Docker & Docker Compose |
| **Proxy** | Nginx con SSL/TLS |
| **Database** | PostgreSQL |
| **Storage** | MinIO |

## ⚡ Funzionalità Core

### 👥 Gestione Utenti
- Sistema di autenticazione completo
- Gestione profili utente
- Sistema di ruoli e permessi
- Funzionalità di recupero password

### 💳 Gestione Carte
- Creazione e gestione carte virtuali
- Monitoraggio stato carte
- Tracciamento transazioni
- Generazione report PDF

### 🔒 Sicurezza
- Autenticazione JWT
- Protezione endpoint
- Validazione dati
- Gestione errori centralizzata

## 🏗️ Architettura

```
.
├── frontend/                # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/     # Route protection
│   │   │   ├── interceptors/# HTTP interceptors
│   │   │   ├── models/     # Data models
│   │   │   ├── private/    # Protected routes
│   │   │   ├── public/     # Public routes
│   │   │   ├── services/   # API services
│   │   │   └── shared/     # Shared components
│   │   └── assets/         # Static files
│   └── Dockerfile
│
├── backend/                # NestJS application
│   ├── src/
│   │   ├── auth/          # Authentication
│   │   ├── users/         # User management
│   │   ├── database/      # Database config
│   │   ├── pdf/           # PDF generation
│   │   └── common/        # Shared utilities
│   └── Dockerfile
│
├── nginx/                 # Nginx configuration
└── docker-compose.yml
```

## ⚙️ Configurazione

Il sistema utilizza variabili d'ambiente per la configurazione. Esempio di configurazione base:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=virtualcard

# JWT
JWT_SECRET=your-secret
JWT_EXPIRATION=1d

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
```

## 🚀 Deployment

Il sistema è containerizzato e può essere deployato facilmente:

```bash
# Build e avvio dei container
docker-compose up -d --build

# Verifica dei servizi
docker-compose ps

# Log dei servizi
docker-compose logs -f
```

## 💻 Sviluppo

### Prerequisiti
- Docker e Docker Compose
- Node.js (per sviluppo locale)
- Git

### Setup Sviluppo
1. Clonare il repository
2. Copiare `demo.env` in `.env`
3. Configurare le variabili d'ambiente
4. Avviare i container con `docker-compose up -d`
