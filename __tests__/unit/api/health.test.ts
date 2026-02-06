import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('GET /api/health', () => {
  it('should return healthy status when database is accessible', async () => {
    vi.mocked(db.execute).mockResolvedValue(undefined as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('linky');
    expect(data.timestamp).toBeDefined();
  });

  it('should return unhealthy status when database is not accessible', async () => {
    vi.mocked(db.execute).mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.error).toBe('Database connection failed');
  });
});
