import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600
  });
  
  // Set global prefix in case of SSL configuration with nginx
  app.setGlobalPrefix('api');
  
  // Initialize database
  const databaseService = app.get(DatabaseService);
  await databaseService.initializeDatabase();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
