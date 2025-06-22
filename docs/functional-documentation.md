# VirtualCard - Functional Documentation

## Table of Contents
1. [User Roles and Permissions](#user-roles-and-permissions)
2. [Core Features](#core-features)
3. [User Journey](#user-journey)
4. [Feature Details](#feature-details)
5. [Business Rules](#business-rules)
6. [User Interface](#user-interface)
7. [Technical Requirements](#technical-requirements)

### Key Benefits
- **Digital Transformation**: Replace traditional paper business cards with digital alternatives
- **Easy Sharing**: Share contact information instantly via QR codes or direct links
- **Professional Presentation**: Create polished, customizable digital profiles
- **Real-time Updates**: Update contact information without reprinting cards
- **Analytics**: Track profile views and engagement (future feature)
- **Environmentally Friendly**: Reduce paper waste and printing costs

## User Roles and Permissions

### User Roles

#### 1. **USER** (Default Role)
- **Description**: Standard user with access to personal profile management
- **Permissions**:
  - Create and manage personal profile
  - Upload profile photo
  - Generate QR code for profile
  - Enable/disable profile features
  - Delete own account
  - Password recovery

#### 2. **ADMIN** (Administrator Role)
- **Description**: System administrator with full platform access
- **Permissions**:
  - All USER permissions
  - View all user accounts
  - Create new user accounts
  - Delete any user account
  - Manage system settings
  - Access admin dashboard

### Permission Matrix

| Feature              | USER | ADMIN |
|----------------------|------|-------|
| Login                |  O   |   O   |
| View public profiles |  O   |   O   |
| Edit own profile     |  O   |   O   |
| Delete own account   |  O   |   O   |
| Upload profile photo |  O   |   O   |
| Generate QR code     |  O   |   O   |
| Password recovery    |  O   |   O   |
| View all users       |  X   |   O   |
| Create users         |  X   |   O   |
| Delete any user      |  X   |   O   |
| Access admin panel   |  X   |   O   |

## Core Features

### 1. **Authentication System**
- **User Registration**: Secure account creation with email verification
- **Login/Logout**: JWT-based authentication with session management
- **Password Recovery**: Secure password reset via email
- **Session Management**: Automatic token refresh and expiration handling

### 2. **Profile Management**
- **Personal Information**: Name, surname, email, phone number
- **Professional Details**: Area code, website URL
- **Profile Photo**: Upload and manage profile pictures
- **Custom Slug**: Create personalized profile URLs
- **Feature Toggles**: Enable/disable specific profile features

### 3. **Digital Business Card**
- **QR Code Generation**: Generate scannable QR codes for profile sharing
- **Public Profile**: Shareable profile page with contact information
- **vCard Integration**: Export contact information in vCard format
- **Responsive Design**: Optimized for all devices and screen sizes

### 4. **File Management**
- **Photo Upload**: Support for JPG, JPEG, PNG formats (max 5MB)
- **Image Optimization**: Automatic resizing and compression
- **Secure Storage**: Cloud-based file storage with CDN delivery

### 5. **Admin Features**
- **User Listing**: View, create, and delete user accounts

## User Journey

### 1. **New User Registration**
```
1. Admin creates account inserting user email
2. User receive email with token
2. Opens the link redirecting to a verify page to set a new password linked to his account via query param set token
3. Llog into the application
4. Compiles his personal information
5. Updates his new profile
7. Generates first digital business card
```

### 2. **Profile Setup Process**
```
1. Login to account
2. Access profile settings
3. Fill required information:
   - Name and surname
   - Phone number
   - Area code
   - Website (optional)
4. Upload profile photo (optional)
5. Create custom slug (optional)
6. Enable desired features
7. Save profile
8. Generate QR code
```

### 3. **Sharing Digital Card**
```
1. Access profile dashboard
2. View generated QR code
3. Download QR code image
4. Share via:
   - Print on materials
   - Digital platforms
   - Direct link sharing
5. Recipients scan QR code or visit link
6. View public profile with contact information
```

### 4. **Profile Updates**
```
1. Login to account
2. Navigate to profile settings
3. Update desired information
4. Save changes
5. Changes are immediately reflected on public profile
6. QR code remains the same (if slug unchanged)
```

## Feature Details

### Authentication Features

#### Login System
- **Email-based authentication**
- **Secure password requirements**:
  - 8-128 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **JWT token management**
- **Automatic session handling**

#### Password Recovery
- **Email-based recovery process**
- **Secure token generation** (10-minute expiration)
- **One-time use tokens**
- **Rate limiting protection**

### Profile Management Features

#### Required Information
- **Email**: Primary identifier, must be unique
- **Name**: 2-50 characters
- **Surname**: 2-50 characters
- **Phone**: 5-20 characters
- **Area Code**: 2-10 characters (format: +[1-4 digits])

#### Optional Information
- **Website**: Valid URL format
- **Profile Photo**: JPG, JPEG, PNG (max 5MB)
- **Custom Slug**: Lowercase letters, numbers, hyphens only

#### Feature Toggles
- **WhatsApp Integration**: Enable WhatsApp contact button
- **Website Display**: Show/hide website link
- **vCard Export**: Enable vCard download functionality

### QR Code Features
- **Automatic generation** based on profile slug
- **High-quality image output**
- **Downloadable formats**
- **Consistent URL structure**
- **Mobile-optimized scanning**

### Public Profile Features
- **Responsive design** for all devices
- **Professional layout** with contact information
- **SEO optimization**

## Business Rules

### Data Validation Rules

#### Email Validation
- Must be valid email format
- Maximum 255 characters
- Stored in lowercase
- Must be unique across platform

#### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Must include special character

#### Name and Surname
- Minimum 2 characters
- Maximum 50 characters
- Alphabetic characters only

#### Phone Number
- Minimum 5 characters
- Maximum 20 characters
- International format support

#### Area Code
- Minimum 2 characters
- Maximum 10 characters
- Format: +[1-4 digits]

#### Website URL
- Must be valid URL format
- Optional field
- HTTPS support

#### Custom Slug
- Lowercase letters only
- Numbers allowed
- Hyphens allowed
- Must be unique
- Cannot be modified once set (except by admin)

### Feature Dependencies

#### WhatsApp Integration
- **Requirement**: Phone number must be filled
- **Behavior**: WhatsApp button appears only when enabled and phone is provided

#### Website Display
- **Requirement**: Website URL must be filled
- **Behavior**: Website link appears only when enabled and URL is provided

#### vCard Export
- **Requirement**: Custom slug must be set
- **Behavior**: vCard download available only when enabled and slug is configured

### Security Rules

#### Authentication
- JWT tokens expire automatically
- Password hashing using bcrypt
- Rate limiting on login attempts
- Secure password recovery process

#### Data Access
- Users can only modify their own profiles
- Public profiles are accessible to everyone
- Admin can access all user data
- Sensitive information is encrypted

#### File Upload
- Maximum file size: 5MB
- Allowed formats: JPG, JPEG, PNG
- Automatic virus scanning (future)
- Secure file storage

## User Interface

### Design Principles
- **Modern and Clean**: Professional appearance suitable for business use
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessible**: WCAG 2.1 compliance for accessibility
- **Intuitive**: Easy-to-use interface with clear navigation
- **Fast**: Optimized performance and loading times

### Color Scheme
- **Primary**: Professional blue tones
- **Secondary**: Neutral grays and whites
- **Accent**: Highlight colors for important actions
- **Dark/Light Theme**: User preference support

### Navigation Structure
```
Dashboard
├── Profile Management
│   ├── Personal Information
│   ├── Professional Details
│   ├── Profile Photo
│   └── Settings
├── Digital Card
│   ├── QR Code
│   ├── Public Profile
│   └── Share Options
├── Account Settings
│   ├── Password Change
│   ├── Email Settings
│   └── Privacy Settings
└── Admin Panel (Admin only)
    ├── User Management
    ├── System Settings
    └── Analytics
```

### Key Pages

#### Dashboard
- **Profile Listing**: Key information overview

#### Profile Editor
- **Form Sections**: Organized information categories
- **Real-time Validation**: Immediate feedback on input
- **Preview Mode**: See changes before saving
- **Save Options**: Auto-save and manual save

#### Public Profile
- **Professional Layout**: Clean, business-appropriate design
- **Contact Information**: Prominently displayed details
- **Action Buttons**: Call, email, WhatsApp, website links
- **QR Code**: Easy access to digital card

## Technical Requirements

### Browser Support
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Device Support
- **Desktop**: Windows, macOS, Linux
- **Tablet**: iPad, Android tablets
- **Mobile**: iOS 14+, Android 8+

### Performance Requirements
- **Page Load Time**: < 3 seconds
- **Image Optimization**: Automatic compression and resizing
- **Progressive Loading**: Lazy loading for images and content

### Security Requirements
- **HTTPS**: All communications encrypted
- **CSP**: Content Security Policy implementation
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Sanitization**: All user inputs validated and sanitized

### Accessibility Requirements
- **WCAG 2.1 AA**: Web Content Accessibility Guidelines compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Indicators**: Clear focus states for all interactive elements

---

*This functional documentation provides a comprehensive overview of the VirtualCard platform's features, user journeys, and business rules. For technical implementation details, please refer to the API documentation and architecture documentation.* 