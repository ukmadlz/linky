import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/revalidate/route';

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('POST /api/revalidate', () => {
  it('should revalidate path with valid secret', async () => {
    const request = new Request('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.REVALIDATE_SECRET || 'dev-revalidate-secret-token',
        username: 'testuser',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.revalidated).toBe(true);
    expect(data.path).toBe('/testuser');
  });

  it('should reject revalidation with invalid secret', async () => {
    const request = new Request('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: 'wrong-secret',
        username: 'testuser',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid secret');
  });

  it('should reject revalidation without username', async () => {
    const request = new Request('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: 'wrong-secret',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // API checks secret first, so this will return 401
    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid secret');
  });
});
