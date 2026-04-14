# 🚨 Alerts Mock Server

This microservice acts as a mock for the external air raid alerts API (`api.alerts.in.ua`). It is designed for E2E automation (via Playwright) and manual testing of alert notifications in the mobile application.

The service is completely stateless and has no database connection. All data is kept in-memory and is fully cleared upon restart or by calling the `/__admin/reset` endpoint.

## 🚀 Local Development

Ensure you are in the `/apps/mock-server` directory:

```bash
# Install dependencies
npm install

# Run the server in watch mode
npm run dev
```

The server will start on `http://localhost:3001`.

## 📚 Swagger UI (Manual Testing)

For manual QA or debugging, you can manage the mock server's state using the interactive Swagger UI.

Open in your browser: 👉 **[http://localhost:3001/api-docs](https://www.google.com/search?q=http://localhost:3001/api-docs)**

From there, you can manually trigger alerts, resolve them, or reset the entire state without writing any code or CLI commands.

## 🏗 Architecture & Endpoints

The server is split into two logical groups:

### 1\. Business API (For `core-api`)

Endpoints that simulate the real 3rd-party service. Your backend should be configured to point here in the staging/test environment.

- `GET /v1/alerts/active.json` — Returns a list of active alerts in the exact schema expected by `core-api`.

### 2\. Admin API (For Playwright / E2E)

Hidden endpoints used to manipulate the state during test execution.

- `POST /__admin/start` — Trigger an alert (requires `locationUid` and `locationTitle`).
- `POST /__admin/stop` — Stop an alert by `locationUid`.
- `POST /__admin/reset` — Clear all active alerts (highly recommended in `beforeEach` test hooks to ensure test isolation).

## 🐳 Docker & Deployment (Railway)

This service is containerized using a multi-stage `Dockerfile`.
When deployed to Railway, the platform automatically detects the Dockerfile, compiles the TypeScript code, and builds a lightweight production image.

**Important Environment Configuration:**
To connect your backend to this mock server, ensure the `core-api` staging environment has the following variable set:

`ALERTS_API_URL=https://<your-mock-server-domain>/v1/alerts/active.json`
