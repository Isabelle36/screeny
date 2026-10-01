export const imageProxyUrl = (src: string, filename?: string) =>
  `/api/image?src=${encodeURIComponent(src)}${filename ? `&filename=${encodeURIComponent(filename)}` : ''}`;

async function toPngBlob(src: string) {
  const response = await fetch(imageProxyUrl(src));
  if (!response.ok) throw new Error(`Image request failed (${response.status})`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  );
}

export async function copyImage(src: string) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': toPngBlob(src) })]);
}

export function downloadImage(src: string, filename: string) {
  const link = document.createElement('a');
  link.href = imageProxyUrl(src, filename);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}
