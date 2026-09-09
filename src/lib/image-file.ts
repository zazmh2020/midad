/** يقرأ ملف صورة ويعيده كـ data URL. يُصغّر الصور النقطية إلى بُعد أقصى مع إبقاء الشفافية والجودة. */
export async function readLogoFile(file: File, maxDim = 512): Promise<string> {
  const asDataUrl = () =>
    new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(new Error('تعذّر قراءة الملف.'));
      fr.readAsDataURL(file);
    });

  // SVG عالي الجودة وخفيف — يُحفظ كما هو
  if (file.type === 'image/svg+xml') return asDataUrl();

  const dataUrl = await asDataUrl();
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('صورة غير صالحة.'));
    im.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}
