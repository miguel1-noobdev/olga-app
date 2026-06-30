import { promises as fs } from 'node:fs';
import path from 'node:path';

export class JsonStore {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.resolve(process.cwd(), '.data');
  }

  async read<T>(file: string): Promise<T | null> {
    this.assertSafeFile(file);
    const fullPath = this.resolve(file);
    let raw: string;
    try {
      raw = await fs.readFile(fullPath, 'utf8');
    } catch (err) {
      if (JsonStore.isNotFound(err)) return null;
      throw err;
    }
    return JSON.parse(raw) as T;
  }

  async write<T>(file: string, data: T): Promise<void> {
    this.assertSafeFile(file);
    const fullPath = this.resolve(file);
    const tmpPath = `${fullPath}.tmp`;
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpPath, fullPath);
  }

  async exists(file: string): Promise<boolean> {
    this.assertSafeFile(file);
    const fullPath = this.resolve(file);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(file: string): Promise<void> {
    this.assertSafeFile(file);
    const fullPath = this.resolve(file);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      if (JsonStore.isNotFound(err)) return;
      throw err;
    }
  }

  private resolve(file: string): string {
    return path.join(this.baseDir, file);
  }

  private assertSafeFile(file: string): void {
    if (typeof file !== 'string' || file.length === 0) {
      throw new Error('JsonStore: file name must be a non-empty string');
    }
    for (const segment of file.split(/[\\/]+/)) {
      if (segment === '..' || segment === '.') {
        throw new Error(`JsonStore: path traversal not allowed: ${file}`);
      }
    }
    if (this.isAbsolute(file)) {
      throw new Error(`JsonStore: absolute paths not allowed: ${file}`);
    }
    const fullPath = path.resolve(this.baseDir, file);
    const relative = path.relative(path.resolve(this.baseDir), fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`JsonStore: path escapes base directory: ${file}`);
    }
  }

  private isAbsolute(file: string): boolean {
    if (path.isAbsolute(file)) return true;
    return /^[a-zA-Z]:[\\/]/.test(file);
  }

  private static isNotFound(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: unknown }).code === 'ENOENT'
    );
  }
}
