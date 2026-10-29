import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function readJsonArray<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(data)) throw new Error(`Expected an array in ${filePath}.`);
  return data as T[];
}

export function writeJsonArray<T>(filePath: string, data: T[]): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(data), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}
