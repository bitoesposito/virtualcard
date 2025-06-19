# VirtualCard - Digital Business Card Platform

![VirtualCard](https://img.shields.io/badge/VirtualCard-Digital%20Business%20Cards-blue)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-EA2845?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-000000?style=flat&logo=minio&logoColor=white)

VirtualCard is a modern, full-stack web application that revolutionizes the way professionals share their contact information. It provides a digital alternative to traditional business cards, featuring QR code generation, profile customization, and secure user management.

## 🌟 Key Features

- **Digital Business Cards**: Create and share professional digital business cards with a unique URL
- **Ready-to-print Business Cards**: Export a ready-to-print PDF of your business card
- **QR Code Generation**: Generate QR codes for instant contact sharing
- **Profile Customization**: Upload profile photos and customize contact information
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Responsive Design**: Modern UI with dark/light mode support
- **Admin Dashboard**: Comprehensive user management system
- **Password Recovery**: Secure password reset functionality
- **API-First Architecture**: Well-documented RESTful API
- **Containerized Deployment**: Docker-based deployment with Docker Compose
- **Object Storage**: MinIO integration for file storage
- **Input Validation**: Comprehensive data validation using class-validator

## 🏗️ Architecture

### System Components
- **Frontend**: Angular SPA with lazy-loaded modules
- **Backend**: NestJS REST API with modular architecture
- **Database**: PostgreSQL with triggers and constraints
- **Storage**: MinIO for file storage
- **Containerization**: Docker and Docker Compose
- **Authentication**: JWT with role-based access control

### Database Schema
- **auth_users**: User authentication and role management
- **user_profiles**: Extended user information and preferences
- **Automatic Triggers**: 
  - `update_updated_at_column()`: Maintains updated_at timestamps
  - `update_auth_users_updated_at`: User table trigger
  - `update_user_profiles_updated_at`: Profile table trigger

## 🛠️ Technical Stack

### Frontend
- **Framework**: Angular 17+
- **Features**:
  - Component-based architecture
  - Route guards for authentication
  - Interceptors for API communication
  - Responsive design with CSS Grid/Flexbox
  - Dark/Light mode support
  - Toast notifications
  - Form validation with reactive forms
  - Lazy-loaded modules
  - TypeScript strict mode
  - SCSS for styling

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **Features**:
  - RESTful API architecture
  - JWT authentication
  - Role-based access control
  - Data validation with class-validator
  - File upload handling with Multer
  - Database triggers
  - Security headers
  - TypeORM for database operations
  - DTO pattern for data transfer

## 🔒 Security Features

- JWT-based authentication with configurable expiration
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- XSS protection
- CSRF protection
- Rate limiting
- Secure password requirements
- Token expiration
- SSL/TLS support
- Security headers implementation
- File upload validation
- SQL injection prevention

## 📱 User Features

- **Profile Management**:
  - Custom profile URLs (slugs)
  - Profile photo upload with optimization
  - Contact information management
  - Social media links
  - Business card generation
  - QR code generation
  - Dark/Light mode preference

- **Authentication**:
  - Secure login with JWT
  - Password recovery flow
  - Session management
  - Role-based permissions

## 👥 User Roles

### Admin
- Full access to user management
- View all user profiles
- Create new users
- Delete users
- Edit any profile
- Access admin dashboard
- View system statistics

### User
- Manage own profile
- Generate business card
- Upload profile photo
- Customize contact information
- Password recovery
- Set profile visibility
- Generate QR code

## ⚙️ Configuration

The system uses environment variables for configuration. Basic configuration example:

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

The system is containerized and can be easily deployed:

```bash
# Build and start containers
docker-compose up -d --build

# Check service status
docker-compose ps

# View service logs
docker-compose logs -f
```

## 💻 Development

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)
- Git
- PostgreSQL (for local development)
- MinIO (for local development)

### Development Setup
1. Clone the repository
2. Copy `demo.env` to `.env`
3. Configure environment variables
4. Start containers with `docker-compose up -d`

## 📚 API Documentation

The API documentation is available in the `/docs` directory, including:
- Authentication endpoints
- User management endpoints
- Data validation rules
- Response structures
- Error handling