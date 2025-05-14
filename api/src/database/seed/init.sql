CREATE TABLE IF NOT EXISTS users (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  is_configured BOOLEAN NOT NULL DEFAULT FALSE,
  name VARCHAR(255),
  surname VARCHAR(255),
  area_code VARCHAR(16),
  phone VARCHAR(32),
  website VARCHAR(255),
  is_whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_website_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_vcard_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Inserisce l'utente admin solo se non esiste già
INSERT INTO users (email, password, role, is_configured, created_at, updated_at)
SELECT 
  'admin@mail.com', 
  '$2b$12$DSsaplfryYCKjyr7PBpVWOcgKwInjvNphjJRDJnlgNdL6rvhJyfAu', 
  'admin',
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@mail.com'
);