// 네이버 블로그 자동 포스팅 메인 오케스트레이터
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env 로드
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { collectKeywords, pickRandomKeyword } from './keywords';
import { generatePost, BlogPost } from './content';
import { generateImages } from './image';
import { postToBlog } from './browser';
import { analyzeSeo } from './seo';

async function main() {
  console.log('============================================');
  console.log('  네이버 블로그 자동 포스팅 시스템');
  console.log('  사업체: 라이트모바일 (라이트모바일.com)');
  console.log('============================================\n');

  // === 1단계: 키워드 수집 ===
  console.log('📌 1단계: 키워드 수집');
  let keyword: string;

  try {
    const keywords = await collectKeywords();
    keyword = pickRandomKeyword(keywords);
    console.log(`선택된 키워드: "${keyword}"\n`);
  } catch (e) {
    // 네트워크 제한 시 시드 키워드 사용
    const seeds = ['선불폰 개통', '선불유심 구매', '알뜰폰 선불', '선불폰 요금제'];
    keyword = seeds[Math.floor(Math.random() * seeds.length)];
    console.log(`(키워드 수집 실패, 시드 키워드 사용: "${keyword}")\n`);
  }

  // === 2단계: 콘텐츠 생성 ===
  console.log('📌 2단계: SEO 최적화 콘텐츠 생성');
  let post: BlogPost;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    post = generatePost(keyword);
    attempts++;
    console.log(`  시도 ${attempts}: SEO 점수 ${post.seoReport.score}/100`);
    if (post.seoReport.issues.length > 0) {
      post.seoReport.issues.forEach(i => console.log(`    - ${i}`));
    }
  } while (!post.seoReport.pass && attempts < maxAttempts);

  console.log(`\n제목: ${post.title}`);
  console.log(`태그: ${post.tags.join(', ')}`);
  console.log(`글자 수: ${post.seoReport.charCount}`);
  console.log(`키워드 밀도: ${post.seoReport.keywordDensity.toFixed(1)}%`);
  console.log(`SEO 통과: ${post.seoReport.pass ? 'YES' : 'NO'}\n`);

  // === 3단계: 이미지 생성 ===
  console.log('📌 3단계: 블로그 이미지 생성');
  const imagePaths = await generateImages(keyword, 2);
  console.log(`${imagePaths.length}개 이미지 생성 완료\n`);

  // === 4단계: 브라우저 자동 포스팅 ===
  console.log('📌 4단계: 네이버 블로그 자동 포스팅');

  try {
    const url = await postToBlog(post, imagePaths, {
      useDraft: false,
      category: '선불폰',
    });
    console.log(`\n✅ 포스팅 완료!`);
    console.log(`URL: ${url}`);
  } catch (e) {
    const err = e as Error;
    if (err.message.includes('환경변수')) {
      console.log(`\n⚠️ ${err.message}`);
      console.log('\n[오프라인 모드] 콘텐츠만 생성되었습니다.');
      console.log('포스팅하려면 blog-auto/.env 파일을 설정하세요:');
      console.log('  NAVER_ID=네이버아이디');
      console.log('  NAVER_PW=네이버비밀번호');
    } else {
      console.error(`\n❌ 포스팅 실패: ${err.message}`);
    }
  }

  // === 결과 요약 ===
  console.log('\n============================================');
  console.log('  실행 결과 요약');
  console.log('============================================');
  console.log(`키워드: ${keyword}`);
  console.log(`제목: ${post.title}`);
  console.log(`SEO 점수: ${post.seoReport.score}/100`);
  console.log(`이미지: ${imagePaths.length}개`);
  console.log('============================================');
}

main().catch(console.error);
