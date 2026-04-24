export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Alerts Mock Server',
    version: '1.1.0',
    description: 'Mock API for simulating api.alerts.in.ua. Allows state management for E2E and manual testing.',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Enter any token (the mock server does not cryptographically validate it, but it is required to simulate a real application request).',
      },
    },
  },
  paths: {
    '/v1/alerts/active.json': {
      get: {
        summary: 'Get active alerts (App Endpoint)',
        tags: ['Business API'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': { description: 'Array of current alerts' },
          '401': { description: 'Unauthorized (Missing Bearer Token)' },
        },
      },
    },
    '/__admin/start': {
      post: {
        summary: 'Trigger an alert',
        tags: ['Admin API'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  locationUid: { type: 'number', example: 31 },
                  locationTitle: { type: 'string', example: 'Kyiv Oblast' },
                  alertType: { type: 'string', example: 'air_raid' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Alert successfully started' } },
      },
    },
    '/__admin/stop': {
      post: {
        summary: 'Stop an alert',
        tags: ['Admin API'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  locationUid: { type: 'number', example: 31 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Alert successfully stopped' } },
      },
    },
    '/__admin/reset': {
      post: {
        summary: 'Clear all alerts',
        tags: ['Admin API'],
        responses: { '200': { description: 'All alerts cleared' } },
      },
    },
  },
};
