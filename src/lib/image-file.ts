/** يحمّل صورة من data URL. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('صورة غير صالحة.'));
    im.src = src;
  });
}

/**
 * يزيل الخلفية الصلبة المتّصلة بالحواف (Flood‑fill من الأركان) ويجعلها شفّافة.
 * مناسب للشعارات على خلفية بيضاء/موحّدة؛ لا يمسّ الألوان الداخلية غير المتّصلة بالحافة.
 */
export async function removeBackground(src: string, tolerance = 40): Promise<string> {
  const img = await loadImage(src);
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // لون الخلفية = متوسّط الأركان الأربعة
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  let br = 0, bg = 0, bb = 0;
  for (const c of corners) { br += px[c]; bg += px[c + 1]; bb += px[c + 2]; }
  br /= 4; bg /= 4; bb /= 4;
  const tol2 = tolerance * tolerance * 3;

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const pushIf = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    visited[i] = 1;
    const o = i * 4;
    const dr = px[o] - br, dg = px[o + 1] - bg, db = px[o + 2] - bb;
    if (dr * dr + dg * dg + db * db <= tol2) { px[o + 3] = 0; stack.push(i); }
  };
  for (let x = 0; x < w; x++) { pushIf(x, 0); pushIf(x, h - 1); }
  for (let y = 0; y < h; y++) { pushIf(0, y); pushIf(w - 1, y); }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w, y = (i / w) | 0;
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
  }

  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}

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
