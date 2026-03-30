// SEO 최적화 모듈: 금칙어 필터 + 키워드 밀도 분석
import * as fs from 'fs';
import * as path from 'path';
import { SEO, PATHS } from './config';

interface ForbiddenData {
  forbidden: string[];
  replacements: Record<string, string>;
}

let forbiddenData: ForbiddenData | null = null;

function loadForbiddenWords(): ForbiddenData {
  if (forbiddenData) return forbiddenData;
  const raw = fs.readFileSync(path.join(PATHS.dataDir, 'forbidden-words.json'), 'utf-8');
  forbiddenData = JSON.parse(raw);
  return forbiddenData!;
}

/** 금칙어 검출 */
export function findForbiddenWords(text: string): string[] {
  const { forbidden } = loadForbiddenWords();
  return forbidden.filter(word => text.includes(word));
}

/** 금칙어를 대체어로 치환 */
export function replaceForbiddenWords(text: string): string {
  const { forbidden, replacements } = loadForbiddenWords();
  let result = text;
  for (const word of forbidden) {
    if (result.includes(word)) {
      const replacement = replacements[word] || '';
      if (replacement) {
        result = result.split(word).join(replacement);
      }
    }
  }
  return result;
}

/** 간이 한국어 형태소 분리 (공백+조사 기반) */
function tokenize(text: string): string[] {
  // 공백, 구두점으로 분리 후 조사 제거
  const particles = /[은는이가을를의에서도와과로으로부터까지만도며고]$/;
  return text
    .replace(/[.,!?;:"""''()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => t.replace(particles, '') || t);
}

/** 키워드 밀도 계산 (%) */
export function calcKeywordDensity(text: string, keyword: string): number {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;

  // 키워드가 복합어일 수 있으므로 원문에서 직접 카운트
  const keywordClean = keyword.replace(/\s+/g, '');
  const textClean = text.replace(/\s+/g, '');

  let count = 0;
  let idx = 0;
  while ((idx = textClean.indexOf(keywordClean, idx)) !== -1) {
    count++;
    idx += keywordClean.length;
  }

  // 단어 수 기준 밀도
  const totalWords = tokens.length;
  const keywordWords = keyword.split(/\s+/).length;
  return (count * keywordWords / totalWords) * 100;
}

/** SEO 점수 분석 */
export interface SeoReport {
  score: number;           // 0~100
  charCount: number;
  keywordDensity: number;
  forbiddenFound: string[];
  issues: string[];
  pass: boolean;
}

export function analyzeSeo(text: string, keyword: string): SeoReport {
  const charCount = text.length;
  const density = calcKeywordDensity(text, keyword);
  const forbidden = findForbiddenWords(text);
  const issues: string[] = [];
  let score = 100;

  // 글자 수 체크
  if (charCount < SEO.minChars) {
    issues.push(`글자 수 부족: ${charCount}자 (최소 ${SEO.minChars}자)`);
    score -= 20;
  }
  if (charCount > SEO.maxChars) {
    issues.push(`글자 수 초과: ${charCount}자 (최대 ${SEO.maxChars}자)`);
    score -= 10;
  }

  // 키워드 밀도
  if (density < SEO.keywordDensity.min) {
    issues.push(`키워드 밀도 부족: ${density.toFixed(1)}% (최소 ${SEO.keywordDensity.min}%)`);
    score -= 15;
  }
  if (density > SEO.keywordDensity.max) {
    issues.push(`키워드 과다: ${density.toFixed(1)}% (최대 ${SEO.keywordDensity.max}%)`);
    score -= 15;
  }

  // 금칙어
  if (forbidden.length > 0) {
    issues.push(`금칙어 발견: ${forbidden.join(', ')}`);
    score -= forbidden.length * 5;
  }

  score = Math.max(0, score);

  return {
    score,
    charCount,
    keywordDensity: density,
    forbiddenFound: forbidden,
    issues,
    pass: score >= 60,
  };
}

// CLI 실행
if (require.main === module) {
  const sample = `
    선불폰 개통이 필요하신 분들을 위한 안내입니다.
    라이트모바일에서는 선불폰 개통 서비스를 제공하고 있습니다.
    선불 유심을 구매하여 간편하게 개통할 수 있으며,
    번호이동도 가능합니다. 통신요금 미납으로 폰이 정지된 경우에도
    선불폰으로 새롭게 시작할 수 있습니다.
  `;
  const report = analyzeSeo(sample, '선불폰');
  console.log('=== SEO 분석 결과 ===');
  console.log(JSON.stringify(report, null, 2));
}
