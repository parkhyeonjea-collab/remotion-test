// 네이버 자동완성 키워드 수집 모듈
import { SEED_KEYWORDS } from './config';

interface KeywordResult {
  keyword: string;
  source: string;
}

/** 네이버 자동완성 API에서 키워드 수집 */
async function fetchNaverSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(query)}&con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    // 네이버 자동완성 응답 구조: { items: [["키워드1", ...], ...] }
    const items: string[][] = data.items || [];
    return items.flat().filter((s: string) => typeof s === 'string' && s.length > 0);
  } catch (e) {
    console.error(`[키워드] ${query} 수집 실패:`, (e as Error).message);
    return [];
  }
}

/** 시드 키워드 확장 (접미어 조합) */
function expandSeed(seed: string): string[] {
  const suffixes = [
    '', ' 방법', ' 가격', ' 추천', ' 비교',
    ' 후기', ' 장점', ' 단점', ' 신청', ' 구매',
  ];
  return suffixes.map(s => seed + s);
}

/** 전체 키워드 수집 파이프라인 */
export async function collectKeywords(): Promise<KeywordResult[]> {
  const results: KeywordResult[] = [];
  const seen = new Set<string>();

  for (const seed of SEED_KEYWORDS) {
    const expanded = expandSeed(seed);

    for (const query of expanded) {
      const suggestions = await fetchNaverSuggestions(query);
      for (const kw of suggestions) {
        const normalized = kw.trim().toLowerCase();
        if (!seen.has(normalized) && normalized.length >= 2) {
          seen.add(normalized);
          results.push({ keyword: kw.trim(), source: query });
        }
      }
      // 요청 간 딜레이 (차단 방지)
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`[키워드] 총 ${results.length}개 수집 완료`);
  return results;
}

/** 키워드 중 랜덤으로 하나 선택 */
export function pickRandomKeyword(keywords: KeywordResult[]): string {
  if (keywords.length === 0) {
    // fallback: 시드 키워드 사용
    return SEED_KEYWORDS[Math.floor(Math.random() * SEED_KEYWORDS.length)];
  }
  return keywords[Math.floor(Math.random() * keywords.length)].keyword;
}

// CLI 실행
if (require.main === module) {
  collectKeywords().then(keywords => {
    console.log('\n=== 수집된 키워드 ===');
    keywords.forEach(k => console.log(`  ${k.keyword} (← ${k.source})`));
  });
}
