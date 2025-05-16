import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/users.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let adminToken: string;
  let userToken: string;
  let testUserEmail: string;
  let resetToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable validation pipes
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    
    await app.init();

    // Create test user
    testUserEmail = `test.${Date.now()}@example.com`;
    const createResponse = await request(app.getHttpServer())
      .post('/user/create')
      .send({ email: testUserEmail })
      .expect(200);

    // Get reset token from logs (in a real scenario, this would come from email)
    const adminPayload = {
      sub: 'admin-uuid', // This should match your admin's UUID
      email: 'admin@example.com',
      role: UserRole.admin,
      reset: true,
      iat: Math.floor(Date.now() / 1000)
    };
    resetToken = jwtService.sign(adminPayload, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Password123!' })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUserEmail })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with email too long', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'a'.repeat(256) + '@example.com',
          password: 'Password123!'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with password too short', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: 'short'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with password too long', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: 'a'.repeat(129)
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with password missing required characters', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: 'password123'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });
  });

  describe('POST /auth/recover', () => {
    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/recover')
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/recover')
        .send({ email: 'invalid-email' })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with email too long', () => {
      return request(app.getHttpServer())
        .post('/auth/recover')
        .send({ email: 'a'.repeat(256) + '@example.com' })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should succeed even with non-existent email (security)', () => {
      return request(app.getHttpServer())
        .post('/auth/recover')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.expiresIn).toBe(600);
        });
    });

    it('should succeed with valid email', () => {
      return request(app.getHttpServer())
        .post('/auth/recover')
        .send({ email: testUserEmail })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.expiresIn).toBe(600);
        });
    });
  });

  describe('POST /auth/verify', () => {
    it('should fail with missing token', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          new_password: 'NewPassword123!',
          confirm_password: 'NewPassword123!'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with missing new password', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: resetToken,
          confirm_password: 'NewPassword123!'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with missing confirm password', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: resetToken,
          new_password: 'NewPassword123!'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: 'invalid-token',
          new_password: 'NewPassword123!',
          confirm_password: 'NewPassword123!'
        })
        .expect(401)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Invalid or expired token');
        });
    });

    it('should fail with expired token', () => {
      const expiredToken = jwtService.sign(
        { 
          sub: 'admin-uuid',
          email: 'admin@example.com',
          role: UserRole.admin,
          reset: true,
          iat: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
        },
        { expiresIn: '1h' }
      );

      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: expiredToken,
          new_password: 'NewPassword123!',
          confirm_password: 'NewPassword123!'
        })
        .expect(401)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Invalid or expired token');
        });
    });

    it('should fail with password mismatch', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: resetToken,
          new_password: 'NewPassword123!',
          confirm_password: 'DifferentPassword123!'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: resetToken,
          new_password: 'weak',
          confirm_password: 'weak'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with password too long', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: resetToken,
          new_password: 'a'.repeat(129),
          confirm_password: 'a'.repeat(129)
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should succeed with valid token and password', () => {
      return request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          token: resetToken,
          new_password: 'NewPassword123!',
          confirm_password: 'NewPassword123!'
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Password has been updated successfully');
        });
    });
  });
}); 