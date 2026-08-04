import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp, truncateAllTables } from './helpers/e2e-app';
import { expectErrorBody, TEST_PASSWORD } from './helpers/e2e-fixtures';

describe('인증 (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('회원가입 → 로그인(쿠키) → 내 정보 → 로그아웃 → 로그아웃 후 401', async () => {
    const server = app.getHttpServer();
    const email = 'auth-flow@test.com';

    await request(server)
      .post('/api/auth/signup')
      .send({
        email,
        password: TEST_PASSWORD,
        name: '김남인',
        phone: '01012345678',
        agreements: { termsOfService: true, privacyPolicy: true },
      })
      .expect(201);

    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ email, password: TEST_PASSWORD })
      .expect(204);
    const setCookie = loginRes.get('Set-Cookie') ?? [];
    expect(setCookie[0]).toContain('sid=');
    const cookie = setCookie[0].split(';')[0];

    const meRes = await request(server)
      .get('/api/users/me')
      .set('Cookie', cookie)
      .expect(200);
    const me = meRes.body as { email: string; payMoneyBalance: number };
    expect(me.email).toBe(email);
    expect(me.payMoneyBalance).toBe(0);

    await request(server)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(204);

    const unauthorized = await request(server)
      .get('/api/users/me')
      .set('Cookie', cookie)
      .expect(401);
    expectErrorBody(unauthorized.body, 'UNAUTHENTICATED');
  });

  it('비로그인: GET /products는 200, GET /cart는 401', async () => {
    const server = app.getHttpServer();

    await request(server).get('/api/products').expect(200);

    const res = await request(server).get('/api/cart').expect(401);
    expectErrorBody(res.body, 'UNAUTHENTICATED');
  });
});
