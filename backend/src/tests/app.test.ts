import request from 'supertest';
import { app } from '../index';

describe('Health endpoint', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('should list opportunities', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should authenticate preseeded graduate', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'grad@example.com',
      password: 'Secret123!',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
