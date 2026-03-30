// 블로그 헤더 이미지 자동 생성 모듈 (sharp 기반)
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { PATHS, BUSINESS } from './config';

// 색상 팔레트
const PALETTES = [
  { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' },
  { bg: '#0f3460', accent: '#16c79a', text: '#ffffff' },
  { bg: '#2d3436', accent: '#6c5ce7', text: '#ffffff' },
  { bg: '#222f3e', accent: '#ff6b6b', text: '#ffffff' },
  { bg: '#1B1464', accent: '#0abde3', text: '#ffffff' },
  { bg: '#2C3A47', accent: '#f39c12', text: '#ffffff' },
  { bg: '#1e272e', accent: '#05c46b', text: '#ffffff' },
];

// 장식 패턴 생성 (SVG)
function createPattern(width: number, height: number, accent: string): string {
  const circles: string[] = [];
  const lines: string[] = [];

  // 랜덤 원형 장식
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 5 + Math.random() * 40;
    const opacity = 0.05 + Math.random() * 0.1;
    circles.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${accent}" opacity="${opacity}"/>`);
  }

  // 대각선 장식
  for (let i = 0; i < 5; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = x1 + (Math.random() - 0.5) * 200;
    const y2 = y1 + (Math.random() - 0.5) * 200;
    const opacity = 0.05 + Math.random() * 0.08;
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent}" stroke-width="2" opacity="${opacity}"/>`);
  }

  return circles.join('') + lines.join('');
}

/** 텍스트를 SVG로 렌더링 (한국어 지원) */
function textToSvg(
  text: string,
  fontSize: number,
  color: string,
  x: number,
  y: number,
  options: { bold?: boolean; anchor?: string; maxWidth?: number } = {}
): string {
  const { bold = false, anchor = 'middle', maxWidth } = options;
  const weight = bold ? 'bold' : 'normal';

  // 텍스트 줄바꿈 처리
  if (maxWidth) {
    const charsPerLine = Math.floor(maxWidth / fontSize);
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += charsPerLine) {
      lines.push(text.substring(i, i + charsPerLine));
    }
    return lines
      .map((line, idx) =>
        `<text x="${x}" y="${y + idx * (fontSize * 1.4)}" font-family="sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(line)}</text>`
      )
      .join('');
  }

  return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(text)}</text>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** 블로그 헤더 이미지 생성 */
export async function generateImage(
  keyword: string,
  index: number = 0
): Promise<string> {
  const width = 800;
  const height = 450;
  const palette = PALETTES[(index + Math.floor(Math.random() * PALETTES.length)) % PALETTES.length];

  // 하단 악센트 바
  const accentBar = `<rect x="0" y="${height - 6}" width="${width}" height="6" fill="${palette.accent}"/>`;

  // 상단 악센트 라인
  const topLine = `<rect x="${width * 0.1}" y="30" width="${width * 0.8}" height="3" fill="${palette.accent}" opacity="0.5" rx="1"/>`;

  // 패턴 장식
  const pattern = createPattern(width, height, palette.accent);

  // 텍스트
  const titleText = textToSvg(keyword, 42, palette.text, width / 2, height / 2 - 20, {
    bold: true,
    maxWidth: width * 0.8,
  });

  const subText = textToSvg(
    `${BUSINESS.name} | ${BUSINESS.siteUrl}`,
    18,
    palette.accent,
    width / 2,
    height / 2 + 50,
  );

  // 날짜
  const dateStr = new Date().toISOString().split('T')[0];
  const dateText = textToSvg(dateStr, 14, palette.text, width - 20, height - 20, {
    anchor: 'end',
  });

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${palette.bg}"/>
  ${pattern}
  ${topLine}
  ${accentBar}
  ${titleText}
  ${subText}
  ${dateText}
</svg>`;

  // 출력 디렉토리 확인
  if (!fs.existsSync(PATHS.outDir)) {
    fs.mkdirSync(PATHS.outDir, { recursive: true });
  }

  const filename = `blog-header-${Date.now()}-${index}.png`;
  const outPath = path.join(PATHS.outDir, filename);

  await sharp(Buffer.from(svg))
    .png({ quality: 90 })
    .toFile(outPath);

  console.log(`[이미지] 생성 완료: ${outPath}`);
  return outPath;
}

/** 여러 이미지 생성 */
export async function generateImages(keyword: string, count: number = 2): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    const p = await generateImage(keyword, i);
    paths.push(p);
  }
  return paths;
}

// CLI 실행
if (require.main === module) {
  const keyword = process.argv[2] || '선불폰 개통 가이드';
  const count = parseInt(process.argv[3] || '2');
  generateImages(keyword, count).then(paths => {
    console.log(`\n=== ${paths.length}개 이미지 생성 완료 ===`);
    paths.forEach(p => console.log(`  ${p}`));
  });
}
