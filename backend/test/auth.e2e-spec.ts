import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth & Guards (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health should be public', async () => {
    await request(httpServer).get('/api/v1/health').expect(200);
  });

  let token: string;

  it('POST /api/v1/auth/register should register first user as ADMIN', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({ email: 'admin@test.local', password: 'Secret123!', nombre: 'Admin' })
      .expect(201);

    expect(res.body?.token).toBeDefined();
    expect(res.body?.user?.rol).toBeDefined();
    token = res.body.token;
  });

  it('Protected route should require JWT', async () => {
    await request(httpServer).get('/api/v1/personas').expect(401);
  });

  it('Protected route should work with JWT', async () => {
    await request(httpServer)
      .get('/api/v1/personas')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        if (![200, 204].includes(res.status)) {
          throw new Error(`Unexpected status ${res.status}`);
        }
      });
  });
});


