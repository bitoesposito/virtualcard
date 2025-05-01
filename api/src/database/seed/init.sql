CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
  name VARCHAR(255),
  surname VARCHAR(255),
  areaCode VARCHAR(16),
  phone VARCHAR(32),
  website VARCHAR(255),
  isWhatsappEnabled BOOLEAN NOT NULL DEFAULT FALSE,
  isWebsiteEnabled BOOLEAN NOT NULL DEFAULT FALSE,
  isVcardEnabled BOOLEAN NOT NULL DEFAULT FALSE,
  slug VARCHAR(255) UNIQUE,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Inserisce l'utente admin solo se non esiste già
INSERT INTO users (email, password, role, createdAt, updatedAt)
SELECT 'admin@admin.com', '$2b$10$QeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQe', 'ADMIN', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@admin.com'
);