import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const CURATED_PLANT_IMAGE_HOST = 'upload.wikimedia.org';
const CURATED_PLANT_IMAGE_PATH = '/wikipedia/commons/';

function isApprovedLocalAsset(url: string): boolean {
  if (!url.startsWith('/img/') || url.includes('..')) return false;

  const publicRoot = path.resolve(process.cwd(), 'public');
  const assetPath = path.resolve(publicRoot, url.slice(1));

  if (!assetPath.startsWith(`${publicRoot}${path.sep}`) || !existsSync(assetPath)) {
    return false;
  }

  return statSync(assetPath).isFile();
}

export function isApprovedPlantImageUrl(value: string): boolean {
  if (isApprovedLocalAsset(value)) return true;

  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === CURATED_PLANT_IMAGE_HOST &&
      parsed.pathname.startsWith(CURATED_PLANT_IMAGE_PATH) &&
      parsed.pathname.length > CURATED_PLANT_IMAGE_PATH.length &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}
