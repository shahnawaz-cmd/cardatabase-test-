const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');

test.describe('API & Route Health Checks', () => {

  const coreRoutes = [
    { path: '/', name: 'Homepage' },
    { path: '/pricing', name: 'Pricing Matrix' },
    { path: '/about', name: 'About Page' },
    { path: '/contact', name: 'Contact Page' },
    { path: '/login', name: 'Customer Login & Signup Portal' },
    { path: '/year-make-model', name: 'Year-Make-Model Product Page' },
    { path: '/dtc', name: 'Diagnostic Trouble Codes (DTC) Page' },
    { path: '/auto-parts', name: 'Auto Parts Catalog Page' },
    { path: '/makes', name: 'Vehicle Makes Directory' },
    { path: '/alternatives/carfax-api', name: 'Carfax Alternative Comparison Page' }
  ];

  for (const route of coreRoutes) {
    test(`Route ${route.path} (${route.name}) responds with HTTP 200 and nosniff security header`, async ({ request }, testInfo) => {
      const logger = new Logger(testInfo);
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);

      const headers = response.headers();
      expect(headers).toHaveProperty('x-content-type-options', 'nosniff');

      await logger.passProof(`Route_${route.path.replace(/[^a-zA-Z0-9]/g, '_')}_Health`, {
        route: route.path,
        status: response.status(),
        contentType: headers['content-type'],
        securityHeaderNosniff: headers['x-content-type-options']
      });
    });
  }

  test('Checkout API rejects empty product orders with HTTP 400 and validation message', async ({ request }, testInfo) => {
    const logger = new Logger(testInfo);
    const res = await request.post('/api/checkout', {
      data: {
        productIds: [],
        email: 'test@example.com'
      }
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('No products selected');

    await logger.passProof('API_Checkout_Negative_Validation', {
      endpoint: '/api/checkout',
      status: res.status(),
      expectedError: json.error
    });
  });

  test('Session check API returns HTTP 401 when user is not authenticated', async ({ request }, testInfo) => {
    const logger = new Logger(testInfo);
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('user', null);

    await logger.passProof('API_Auth_Me_Unauthenticated', {
      endpoint: '/api/auth/me',
      status: res.status(),
      user: json.user
    });
  });

});
