import { computeCoverRect } from './imageProcessor';

export const CARD_WIDTH = 1470;
export const CARD_HEIGHT = 768;
export const PFP_SIZE = 1080;

export interface BuilderCardData {
  image: HTMLImageElement;
  name: string;
  role: string;
  title: string;
  funFact?: string;
}

const COLORS = {
  green: '#07713F',
  greenDark: '#005930',
  greenDeep: '#003E25',
  yellow: '#FFE100',
  pink: '#FF0A7A',
  cream: '#F7F4DD',
  muted: 'rgba(247, 244, 221, 0.62)',
};

const DISPLAY_FONT = '"Big Shoulders Display", Impact, sans-serif';
const BODY_FONT = '"Space Grotesk", system-ui, sans-serif';

async function waitForFonts(): Promise<void> {
  const anyDoc = document as Document & { fonts?: FontFaceSet };
  if (anyDoc.fonts?.ready) {
    try {
      await anyDoc.fonts.load(`900 120px ${DISPLAY_FONT}`);
      await anyDoc.fonts.load(`700 32px ${BODY_FONT}`);
      await anyDoc.fonts.ready;
    } catch {
      // Browser fallback fonts are acceptable for generated images.
    }
  }
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, step = 54) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, COLORS.green);
  grad.addColorStop(1, COLORS.greenDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(247, 244, 221, 0.075)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTopStripe(ctx: CanvasRenderingContext2D, w: number) {
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(0, 0, w * 0.82, 10);
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(w * 0.82, 0, w * 0.18, 10);
}

function drawBrand(ctx: CanvasRenderingContext2D, x: number, y: number, size = 54) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  ctx.fillText('HACKER HOUSE', x, y);
  const width = ctx.measureText('HACKER HOUSE').width;
  ctx.fillStyle = COLORS.pink;
  ctx.font = `900 ${Math.round(size * 0.75)}px ${DISPLAY_FONT}`;
  ctx.fillText('GOA', x + width + size * 0.18, y);
  ctx.restore();
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  weight: number,
  maxSize: number,
  minSize: number,
  font: string
) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  upsideDown = false
) {
  const chars = text.split('');
  const angleStep = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((char, index) => {
    const angle = startAngle + angleStep * index;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + (upsideDown ? Math.PI / 2 : Math.PI / 2));
    if (upsideDown) ctx.rotate(Math.PI);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  verticalBias = 0.38
) {
  const rect = computeCoverRect(image.naturalWidth, image.naturalHeight, dw, dh, verticalBias);
  ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, dx, dy, dw, dh);
}

function drawEventFooter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(0, h - 58, w, 58);
  ctx.fillStyle = COLORS.greenDeep;
  ctx.font = `800 22px ${BODY_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('#FrameInGoa', 64, h - 29);
  ctx.fillText('MAKE YOURS', 270, h - 29);
  ctx.textAlign = 'right';
  ctx.fillText('HHGOA.COM', w - 64, h - 29);
  ctx.restore();
}

export async function generateBuilderCard(data: BuilderCardData): Promise<Blob> {
  await waitForFonts();

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;
  drawGrid(ctx, w, h, 56);
  drawTopStripe(ctx, w);

  const photoW = 520;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 10, photoW, h - 68);
  ctx.clip();
  drawPhotoCover(ctx, data.image, 0, 10, photoW, h - 68, 0.36);
  ctx.fillStyle = 'rgba(0, 89, 48, 0.34)';
  ctx.fillRect(0, 10, photoW, h - 68);
  ctx.restore();

  const badgeX = 30;
  const badgeY = h - 250;
  roundedRectPath(ctx, badgeX, badgeY, 210, 112, 10);
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 62, 37, 0.58)';
  ctx.fill();
  ctx.fillStyle = COLORS.muted;
  ctx.font = `800 20px ${BODY_FONT}`;
  ctx.fillText('OPEN TRIALS', badgeX + 20, badgeY + 34);
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `900 54px ${BODY_FONT}`;
  ctx.fillText('247', badgeX + 20, badgeY + 88);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `800 18px ${BODY_FONT}`;
  ctx.fillText('SEATS', badgeX + 126, badgeY + 83);

  ctx.fillStyle = COLORS.cream;
  ctx.font = `800 20px ${BODY_FONT}`;
  ctx.fillText('GOA, INDIA  ·  28-31 OCT 2026', 30, h - 92);

  const contentX = 575;
  drawBrand(ctx, contentX, 82, 55);
  ctx.fillStyle = COLORS.cream;
  ctx.font = `800 34px ${BODY_FONT}`;
  ctx.fillText('2026', contentX + 285, 80);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.yellow;
  ctx.font = `800 24px ${BODY_FONT}`;
  ctx.fillText('GOA, INDIA · 28-31 OCT 2026', w - 72, 116);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(247, 244, 221, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(contentX, 140);
  ctx.lineTo(w - 72, 140);
  ctx.moveTo(contentX, 462);
  ctx.lineTo(w - 72, 462);
  ctx.stroke();

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `800 22px ${BODY_FONT}`;
  ctx.fillText('OPEN TRIALS · HHGOA’26', contentX, 196);

  const name = data.name.trim() || 'Your Name';
  const nameSize = fitFontSize(ctx, name, w - contentX - 120, 800, 82, 42, BODY_FONT);
  ctx.fillStyle = COLORS.cream;
  ctx.font = `800 ${nameSize}px ${BODY_FONT}`;
  ctx.fillText(name, contentX, 355);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `800 24px ${BODY_FONT}`;
  ctx.fillText('- STACK / ROLE', contentX, 520);
  ctx.fillStyle = COLORS.cream;
  ctx.font = `700 38px ${BODY_FONT}`;
  ctx.fillText(data.role || 'Builder', contentX + 30, 574);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `800 24px ${BODY_FONT}`;
  ctx.fillText('- BUILDER CLASS', contentX, 625);
  ctx.font = `800 38px ${BODY_FONT}`;
  ctx.fillText(data.title || 'Goa Builder', contentX + 30, 680);

  if (data.funFact?.trim()) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.muted;
    ctx.font = `700 18px ${BODY_FONT}`;
    ctx.fillText(data.funFact.trim(), w - 72, 680);
    ctx.textAlign = 'left';
  }

  drawEventFooter(ctx, w, h);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the card image.'))), 'image/png', 1);
  });
}

export async function generatePfpFrame(image: HTMLImageElement): Promise<Blob> {
  await waitForFonts();

  const canvas = document.createElement('canvas');
  canvas.width = PFP_SIZE;
  canvas.height = PFP_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  const w = PFP_SIZE;
  const h = PFP_SIZE;
  const cx = w / 2;
  const cy = h / 2 + 18;
  const photoRadius = 345;
  const ringRadius = 430;

  drawGrid(ctx, w, h, 64);
  drawTopStripe(ctx, w);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoRadius, 0, Math.PI * 2);
  ctx.clip();
  drawPhotoCover(ctx, image, cx - photoRadius, cy - photoRadius, photoRadius * 2, photoRadius * 2, 0.36);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
  ctx.arc(cx, cy, photoRadius + 8, 0, Math.PI * 2, true);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill('evenodd');
  ctx.strokeStyle = COLORS.greenDeep;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, photoRadius + 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = COLORS.greenDeep;
  ctx.font = `800 42px ${BODY_FONT}`;
  drawArcText(ctx, 'HACKER HOUSE GOA 2026', cx, cy, 390, Math.PI * 1.15, Math.PI * 1.85);
  drawArcText(ctx, '28-31 OCT 2026 · GOA · 247 SEATS', cx, cy, 390, Math.PI * 0.2, Math.PI * 0.82, true);

  ctx.fillStyle = COLORS.pink;
  ctx.beginPath();
  ctx.rect(cx - ringRadius + 26, cy + 4, 26, 26);
  ctx.rect(cx + ringRadius - 52, cy + 4, 26, 26);
  ctx.fill();

  roundedRectPath(ctx, cx - 160, cy + 170, 320, 70, 34);
  ctx.fillStyle = 'rgba(0, 62, 37, 0.9)';
  ctx.fill();
  drawBrand(ctx, cx - 126, cy + 218, 32);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `800 20px ${BODY_FONT}`;
  ctx.fillText('#FrameInGoa', 48, 70);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('HHGOA.COM', w - 48, 70);
  ctx.fillText('less noise. more signal.', w - 48, h - 70);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText('MAKE YOURS', 48, h - 80);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the frame image.'))), 'image/png', 1);
  });
}

export function sanitiseFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return cleaned || 'Builder';
}
