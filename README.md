# nest-ready

> Skip the boring setup. Clone, configure, and start building your actual service.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Batteries Included

|   |   |
|---|---|
| 🔐 **Auth** | API Key guard (Passport) |
| 🗄 **Database** | PostgreSQL + Prisma ORM |
| ✅ **Validation** | Global `ValidationPipe` — whitelist, forbidNonWhitelisted, transform |
| 📦 **Serialization** | `@Serialize()` interceptor + `@Mask()` for sensitive fields |
| 🧾 **Response Format** | Standardized `{ success, data, timestamp, requestId }` |
| 🚨 **Error Handling** | Global exception filter with Prisma error mapping |
| 📄 **Pagination** | `PaginationQueryDto` + `PaginatedResult<T>` |
| 📋 **Logging** | Pino — structured, request-scoped, redacted (pino-pretty in dev) |
| 🛡 **Security** | Helmet (CSP) + CORS + Rate limiting (`ThrottlerModule`) |
| 🗜 **Compression** | gzip / deflate via `compression` |
| 🔢 **API Versioning** | Header-based versioning (`version` header, default v1) |
| 📖 **API Docs** | Swagger (toggle via `SWAGGER_ENABLED` env var) |
| 🏥 **Health Check** | `/health` with DB connectivity |
| 🐳 **Docker** | Multi-stage Dockerfile + Compose |
| 🧪 **Testing** | Jest + Supertest (e2e with Postgres CI service) |
| 🔁 **CI** | GitHub Actions — lint → typecheck → test → e2e |
| 🪝 **Git Hooks** | Husky + lint-staged on commit |
| 🔎 **Env Check** | Validates `.env` against `.env.example` at startup |

## Get Started

```bash
git clone <this-repo> my-api && cd my-api
rm -rf .git && git init

cp .env.example .env
# fill in your values

docker compose up -d        # starts postgres + api
```

Or locally:

```bash
npm install
npx prisma migrate dev --name init
npm run start:dev
```

| | URL |
|---|---|
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Health | http://localhost:3000/health |

## Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `NODE_ENV` | `development` | `development` \| `production` |
| `PORT` | `3000` | HTTP port |
| `API_KEY` | — | Secret key for the `apiKey` header guard |
| `THROTTLE_TTL_MS` | `60000` | Rate-limit window in milliseconds |
| `THROTTLE_LIMIT` | `30` | Max requests per window |
| `SWAGGER_ENABLED` | `true` | Enable Swagger UI at `/docs` |
| `CORS_ORIGIN` | `*` | Allowed CORS origin(s) |

## Add a Module

```bash
nest g module services/users
nest g controller services/users
nest g service services/users
```

Register in `src/services/index.ts`:

```ts
export const ServiceModules = [AuthModule, UsersModule];
```

Protect with API key (optional):

```ts
@Controller('users')
@UseGuards(AuthGuard('apiKey'))
export class UsersController {}
```

```bash
curl -H "apiKey: your-secret" http://localhost:3000/api/users
```

## Serialization & Response

### 1. Define a response DTO

Use `@Expose()` to whitelist fields. Anything without `@Expose()` is stripped automatically.

```ts
import { Expose } from 'class-transformer';
import { Mask } from 'src/common/decorators/mask.decorator';

export class UserResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() email: string;         // "john@gmail.com"

  @Expose()
  @Mask({ type: 'email' })
  emailMasked: string;             // "j**n@gmail.com"

  @Expose()
  @Mask({ type: 'phone' })
  phone: string;                   // "010-****-5678"

  @Expose()
  @Mask({ type: 'tail', visibleChars: 4 })
  ssn: string;                     // "***-**-6789"

  // no @Expose() → stripped from response
  password: string;
}
```

### 2. Apply to a controller

Use `@ApiSerializedResponse` to document the Swagger response schema **and** serialize the response in one decorator:

```ts
import { ApiSerializedResponse } from 'src/common/decorators/api-serialized-response.decorator';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiSerializedResponse({ status: 200, dataType: UserResponseDto })
  findOne() { ... }

  @Get()
  @ApiSerializedResponse({ status: 200, dataType: UserResponseDto, paginated: true })
  findAll() { ... }
}
```

- `dataType` — the DTO class used for both Swagger schema and serialization
- `paginated: true` — wraps `data` as an array with a `meta` object in Swagger

### 3. Response shape

Every response is automatically wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": { "id": "...", "name": "...", "email": "..." },
  "timestamp": "2026-03-23T00:00:00.000Z",
  "requestId": "abc-123"
}
```

Paginated responses (`{ items, meta }`) are unwrapped automatically:

```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 100, "page": 1, "lastPage": 10 },
  "timestamp": "...",
  "requestId": "..."
}
```

### Mask types

| Type | Example input | Output |
|------|--------------|--------|
| `tail` (default) | `"123-45-6789"` | `"***-**-6789"` |
| `email` | `"john@gmail.com"` | `"j**n@gmail.com"` |
| `phone` | `"010-1234-5678"` | `"010-****-5678"` |
| `full` | `"secret"` | `"******"` |

## API Versioning

Versioning is handled via the `version` request header (defaults to `v1` when omitted).

```bash
# Default (version 1)
curl http://localhost:3000/api/users

# Explicit version
curl -H "version: 2" http://localhost:3000/api/users
```

To add a v2 endpoint alongside v1:

```ts
@Controller({ path: 'users', version: '2' })
export class UsersV2Controller {}
```

## Rate Limiting

`ThrottlerModule` is configured globally. Tune limits via `.env`:

```bash
THROTTLE_TTL_MS=60000   # 1 minute window
THROTTLE_LIMIT=30       # max 30 requests per window
```

To skip throttling on a specific handler:

```ts
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('public')
publicEndpoint() { ... }
```

## Scripts

```bash
npm run start:dev   # dev server
npm run test        # unit tests
npm run test:e2e    # e2e tests
npm run lint        # ESLint fix
npm run format      # Prettier
npm run build       # production build
```

## License

MIT
