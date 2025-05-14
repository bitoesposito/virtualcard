import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

// Genera il contenuto del file SQL
const generateSql = () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminHashedPassword = process.env.ADMIN_HASHED_PASSWORD;

    if (!adminEmail || !adminHashedPassword) {
        throw new Error('ADMIN_EMAIL and ADMIN_HASHED_PASSWORD must be set in .env');
    }

    return `CREATE TABLE IF NOT EXISTS users (
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
  '${adminEmail}', 
  '${adminHashedPassword}', 
  'admin',
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = '${adminEmail}'
);`;
};

// Percorso del file di output
const outputPath = path.join(__dirname, '../database/seed/init.sql');

// Genera e scrive il file
try {
    const sqlContent = generateSql();
    fs.writeFileSync(outputPath, sqlContent);
    console.log('init.sql generated successfully!');
} catch (error) {
    console.error('Error generating init.sql:', error);
    process.exit(1);
} 