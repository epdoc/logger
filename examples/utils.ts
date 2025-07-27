// my_file.ts
import { fromFileUrl } from 'https://deno.land/std@0.224.0/path/mod.ts';

/**
 * @param fileUrl - Use import.meta.url to get the current filename
 * @returns
 */
export function getFileName(fileUrl: string, parts = 1) {
  const filePath = fromFileUrl(fileUrl);
  return filePath.substring(filePath.lastIndexOf('/') + 1);
}
