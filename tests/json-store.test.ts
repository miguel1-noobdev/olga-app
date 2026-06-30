import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from '@/lib/db/json-store';

let tmpDir: string;
let store: JsonStore;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'json-store-'));
  store = new JsonStore(tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('JsonStore (T-004)', () => {
  describe('read', () => {
    it('returns null when the file does not exist', async () => {
      const result = await store.read<{ name: string }>('missing.json');
      expect(result).toBeNull();
    });

    it('returns parsed data when the file exists', async () => {
      await store.write('present.json', { name: 'Olga' });
      const result = await store.read<{ name: string }>('present.json');
      expect(result).toEqual({ name: 'Olga' });
    });

    it('preserves nested data shapes', async () => {
      const payload = {
        id: 'u_1',
        email: 'olga@example.com',
        meta: { roles: ['admin'], tags: ['staff', 'founder'] },
      };
      await store.write('users/u_1.json', payload);
      const result = await store.read<typeof payload>('users/u_1.json');
      expect(result).toEqual(payload);
    });

    it('throws on JSON parse error', async () => {
      writeFileSync(join(tmpDir, 'broken.json'), '{not valid json');
      await expect(store.read('broken.json')).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('persists data that can be read back', async () => {
      await store.write('foo.json', { value: 42 });
      const result = await store.read<{ value: number }>('foo.json');
      expect(result).toEqual({ value: 42 });
    });

    it('replaces existing data atomically', async () => {
      await store.write('foo.json', { value: 1 });
      await store.write('foo.json', { value: 2 });
      const result = await store.read<{ value: number }>('foo.json');
      expect(result).toEqual({ value: 2 });
    });

    it('creates intermediate directories as needed', async () => {
      await store.write('nested/dir/file.json', { ok: true });
      const result = await store.read<{ ok: boolean }>('nested/dir/file.json');
      expect(result).toEqual({ ok: true });
    });

    it('cleans up the .tmp file after a successful write', async () => {
      await store.write('atomic.json', { ok: true });
      const { existsSync } = await import('node:fs');
      expect(existsSync(join(tmpDir, 'atomic.json'))).toBe(true);
      expect(existsSync(join(tmpDir, 'atomic.json.tmp'))).toBe(false);
    });
  });

  describe('exists', () => {
    it('returns false when the file does not exist', async () => {
      expect(await store.exists('nope.json')).toBe(false);
    });

    it('returns true after a write', async () => {
      await store.write('present.json', { x: 1 });
      expect(await store.exists('present.json')).toBe(true);
    });

    it('returns false after a delete', async () => {
      await store.write('temp.json', { x: 1 });
      await store.delete('temp.json');
      expect(await store.exists('temp.json')).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes the file', async () => {
      await store.write('to-remove.json', { x: 1 });
      expect(await store.exists('to-remove.json')).toBe(true);
      await store.delete('to-remove.json');
      expect(await store.exists('to-remove.json')).toBe(false);
    });

    it('is a no-op when the file does not exist', async () => {
      await expect(store.delete('missing.json')).resolves.toBeUndefined();
    });
  });

  describe('path traversal protection', () => {
    it('rejects filenames that contain a .. segment', async () => {
      await expect(store.read('../etc/passwd')).rejects.toThrow(
        /path traversal/i
      );
    });

    it('rejects .. in a nested path', async () => {
      await expect(
        store.write('users/../admin.json', { x: 1 })
      ).rejects.toThrow(/path traversal/i);
    });

    it('rejects a lone . segment', async () => {
      await expect(store.read('.')).rejects.toThrow();
    });

    it('rejects an empty filename', async () => {
      await expect(store.read('')).rejects.toThrow();
    });

    it('rejects an absolute path (POSIX)', async () => {
      await expect(store.read('/etc/passwd')).rejects.toThrow();
    });

    it('rejects an absolute path (Windows-style)', async () => {
      await expect(store.read('C:/Windows/System32')).rejects.toThrow();
    });
  });

  describe('construction', () => {
    it('accepts a custom base directory', async () => {
      const customDir = mkdtempSync(join(tmpdir(), 'json-store-custom-'));
      try {
        const customStore = new JsonStore(customDir);
        await customStore.write('hello.json', { greeting: 'hola' });
        const result = await customStore.read<{ greeting: string }>(
          'hello.json'
        );
        expect(result).toEqual({ greeting: 'hola' });
      } finally {
        rmSync(customDir, { recursive: true, force: true });
      }
    });
  });
});
