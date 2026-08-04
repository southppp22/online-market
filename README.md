# online-market

NestJS 기반 이커머스 API 서버.

## 실행 방법

요구 사항: Node.js 20+, Docker

```bash
# 1. 인프라 기동 (MySQL 8, Redis 7)
docker compose up -d

# 2. 의존성 설치 + 환경변수
npm ci
cp .env.example .env

# 3. 시딩
npm run seed

# 4. 서버 실행 → http://localhost:3000/api
npm run start:dev

# 5. 테스트
npm run lint
npm run test        # 유닛
npm run test:e2e    # e2e (별도 online_market_test DB를 자동 생성해 사용)
```
