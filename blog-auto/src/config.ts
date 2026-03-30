// 사업체 및 환경 설정
import * as path from 'path';

export const BUSINESS = {
  name: '라이트모바일',
  siteUrl: '라이트모바일.com',
  landingPage: 'https://90000.qshop.ai',
  wordpress: 'litemobile.co.kr',
  // 카카오톡 채널 - 최소한으로만 사용
  kakaoChannel: 'http://pf.kakao.com/_uQfpn/chat',
  phone: '',
  description: '선불폰 전문 개통 서비스',
} as const;

export const SEO = {
  minChars: parseInt(process.env.MIN_CHARS || '1500'),
  maxChars: parseInt(process.env.MAX_CHARS || '2500'),
  keywordDensity: { min: 1.5, max: 3.5 }, // 퍼센트
  maxTags: 10,
  titleMaxLen: 40,
} as const;

export const BROWSER = {
  headless: process.env.HEADLESS !== 'false',
  slowMo: parseInt(process.env.SLOW_MO || '100'),
  naverId: process.env.NAVER_ID || '',
  naverPw: process.env.NAVER_PW || '',
} as const;

export const PATHS = {
  dataDir: path.resolve(__dirname, '../data'),
  assetsDir: path.resolve(__dirname, '../assets'),
  imagesDir: path.resolve(__dirname, '../assets/images'),
  outDir: path.resolve(__dirname, '../out'),
} as const;

// 주요 키워드 시드
export const SEED_KEYWORDS = [
  '선불폰',
  '선불폰 개통',
  '선불유심',
  '알뜰폰 선불',
  '무약정 선불폰',
  '선불폰 요금제',
  '선불 유심 구매',
  '선불폰 번호이동',
  '통신요금 미납 개통',
  '폰 정지 해결',
];
