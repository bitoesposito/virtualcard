import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/users.entity';
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';

describe('User Management (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let testUserEmail: string;
  let testUserUuid: string;
  let testUserSlug: string;

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
    await app.init();

    // Create test user
    testUserEmail = `test.${Date.now()}@example.com`;
    const createResponse = await request(app.getHttpServer())
      .post('/user/create')
      .send({ email: testUserEmail })
      .expect(200);

    testUserUuid = createResponse.body.data.uuid;

    // Generate tokens
    adminToken = jwtService.sign({
      sub: 'admin-uuid',
      email: 'admin@example.com',
      role: UserRole.admin
    });

    userToken = jwtService.sign({
      sub: testUserUuid,
      email: testUserEmail,
      role: UserRole.user
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /user/create', () => {
    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .post('/user/create')
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/user/create')
        .send({ email: 'invalid-email' })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with email too long', () => {
      return request(app.getHttpServer())
        .post('/user/create')
        .send({ email: 'a'.repeat(256) + '@example.com' })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with existing email', () => {
      return request(app.getHttpServer())
        .post('/user/create')
        .send({ email: testUserEmail })
        .expect(409)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('User with this email already exists');
        });
    });

    it('should succeed with valid email', () => {
      const newEmail = `new.${Date.now()}@example.com`;
      return request(app.getHttpServer())
        .post('/user/create')
        .send({ email: newEmail })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(newEmail);
          expect(res.body.data.role).toBe(UserRole.user);
          expect(res.body.data.is_configured).toBe(false);
        });
    });
  });

  describe('PUT /user/edit', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .send({
          email: testUserEmail,
          name: 'Test',
          surname: 'User'
        })
        .expect(401);
    });

    it('should fail with invalid name length', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          name: 'T',
          surname: 'User'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with name too long', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          name: 'a'.repeat(51),
          surname: 'User'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid area code format', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          areaCode: 'invalid'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid phone format', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          phone: '123'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid website format', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .send({
          email: testUserEmail,
          website: 'invalid-url'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid slug format', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          slug: 'invalid slug'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with slug too short', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          slug: 'ab'
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with slug too long', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          slug: 'a'.repeat(51)
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail when trying to edit another user', () => {
      return request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'other@example.com',
          name: 'Other',
          surname: 'User'
        })
        .expect(403)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('You can only edit your own profile');
        });
    });

    it('should succeed with valid data', async () => {
      const response = await request(app.getHttpServer())
        .put('/user/edit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: testUserEmail,
          name: 'Test',
          surname: 'User',
          areaCode: '+39',
          phone: '3331234567',
          website: 'https://example.com',
          slug: `test-user-${Date.now()}`,
          isWhatsappEnabled: true,
          isWebsiteEnabled: true,
          isVcardEnabled: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test');
      expect(response.body.data.surname).toBe('User');
      expect(response.body.data.is_configured).toBe(true);
      testUserSlug = response.body.data.slug;
    });
  });

  describe('DELETE /user/delete', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete('/user/delete')
        .send({ email: testUserEmail })
        .expect(401);
    });

    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .delete('/user/delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .delete('/user/delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'invalid-email' })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Validation error');
        });
    });

    it('should fail when trying to delete another user', () => {
      return request(app.getHttpServer())
        .delete('/user/delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'other@example.com' })
        .expect(403)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('You can only delete your own account');
        });
    });

    it('should fail when trying to delete last admin', async () => {
      // Create a new admin user first
      const adminEmail = `admin.${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/user/create')
        .send({ email: adminEmail })
        .expect(200);

      // Try to delete the original admin
      return request(app.getHttpServer())
        .delete('/user/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'admin@example.com' })
        .expect(403)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Cannot delete the last admin user');
        });
    });

    it('should succeed when deleting own account', () => {
      return request(app.getHttpServer())
        .delete('/user/delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: testUserEmail })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User deleted successfully');
        });
    });
  });

  describe('GET /user/list', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/user/list')
        .expect(401);
    });

    it('should fail with non-admin user', () => {
      return request(app.getHttpServer())
        .get('/user/list')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Admin privileges required');
        });
    });

    it('should succeed with admin user', () => {
      return request(app.getHttpServer())
        .get('/user/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0]).toHaveProperty('uuid');
          expect(res.body.data[0]).toHaveProperty('email');
          expect(res.body.data[0]).toHaveProperty('role');
          expect(res.body.data[0]).toHaveProperty('is_configured');
        });
    });
  });

  describe('GET /user/:slug', () => {
    it('should fail with invalid slug', () => {
      return request(app.getHttpServer())
        .get('/user/invalid-slug')
        .expect(404)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('User not found');
        });
    });

    it('should succeed with valid slug', () => {
      return request(app.getHttpServer())
        .get(`/user/${testUserSlug}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.slug).toBe(testUserSlug);
          expect(res.body.data).toHaveProperty('name');
          expect(res.body.data).toHaveProperty('surname');
          expect(res.body.data).toHaveProperty('areaCode');
          expect(res.body.data).toHaveProperty('phone');
          expect(res.body.data).toHaveProperty('website');
          expect(res.body.data).toHaveProperty('isWhatsappEnabled');
          expect(res.body.data).toHaveProperty('isWebsiteEnabled');
          expect(res.body.data).toHaveProperty('isVcardEnabled');
        });
    });
  });

  describe('GET /user/by-id/:uuid', () => {
    it('should fail with invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/user/by-id/invalid-uuid')
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Invalid UUID format');
        });
    });

    it('should fail with non-existent UUID', () => {
      return request(app.getHttpServer())
        .get('/user/by-id/123e4567-e89b-12d3-a456-426614174000')
        .expect(404)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('User not found');
        });
    });

    it('should succeed with valid UUID', () => {
      return request(app.getHttpServer())
        .get(`/user/by-id/${testUserUuid}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.uuid).toBe(testUserUuid);
          expect(res.body.data).toHaveProperty('name');
          expect(res.body.data).toHaveProperty('surname');
          expect(res.body.data).toHaveProperty('areaCode');
          expect(res.body.data).toHaveProperty('phone');
          expect(res.body.data).toHaveProperty('website');
          expect(res.body.data).toHaveProperty('isWhatsappEnabled');
          expect(res.body.data).toHaveProperty('isWebsiteEnabled');
          expect(res.body.data).toHaveProperty('isVcardEnabled');
        });
    });
  });
}); 