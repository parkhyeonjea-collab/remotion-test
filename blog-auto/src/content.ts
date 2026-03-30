// 블로그 콘텐츠 생성 모듈 (템플릿 기반 SEO 최적화 글 생성)
import { BUSINESS, SEO } from './config';
import { analyzeSeo, replaceForbiddenWords, SeoReport } from './seo';

export interface BlogPost {
  title: string;
  body: string;       // HTML 형식
  tags: string[];
  keyword: string;
  seoReport: SeoReport;
}

// 글 구조 템플릿들
const TEMPLATES = [
  {
    name: 'howto',
    titlePattern: '{keyword} 방법 총정리 ({year}년)',
    sections: ['인트로', '이런 분들에게 추천', '단계별 안내', '주의사항', '마무리'],
  },
  {
    name: 'comparison',
    titlePattern: '{keyword} 비교 가이드 - 어떤 게 좋을까?',
    sections: ['인트로', '종류별 특징', '장단점 비교', '추천 선택법', '마무리'],
  },
  {
    name: 'faq',
    titlePattern: '{keyword} 자주 묻는 질문 Q&A',
    sections: ['인트로', 'Q1', 'Q2', 'Q3', 'Q4', '마무리'],
  },
  {
    name: 'review',
    titlePattern: '{keyword} 실제 이용 후기 및 팁',
    sections: ['인트로', '선택 이유', '이용 과정', '결과 및 느낀점', '꿀팁 정리'],
  },
];

// 선불폰 관련 콘텐츠 블록
const CONTENT_BLOCKS: Record<string, string[]> = {
  '인트로': [
    `요즘 {keyword}에 대한 관심이 높아지고 있습니다. 통신 환경이 빠르게 변화하면서 다양한 선택지가 생겨났는데요, 오늘은 {keyword}에 대해 꼼꼼하게 알아보겠습니다.`,
    `{keyword}, 어디서부터 알아봐야 할지 막막하셨나요? 이 글에서는 실제로 도움이 되는 정보만 모아 정리했습니다.`,
    `{keyword} 관련 정보를 찾고 계시다면 잘 오셨습니다. 핵심만 짚어서 알려드리겠습니다.`,
  ],
  '이런 분들에게 추천': [
    `<b>{keyword}</b>은 다음과 같은 분들에게 특히 유용합니다.\n\n• 기존 통신사 약정이 부담스러운 분\n• 통신요금 미납으로 기존 회선 이용이 어려운 분\n• 단기간 사용할 번호가 필요한 분\n• 자녀나 어르신용 보조 회선이 필요한 분`,
  ],
  '단계별 안내': [
    `<b>{keyword} 진행 순서</b>\n\n<b>1단계:</b> 본인에게 맞는 요금제를 선택합니다. 데이터 사용량과 통화량을 기준으로 비교해보세요.\n\n<b>2단계:</b> 유심(USIM)을 준비합니다. 온라인 또는 편의점에서 구매할 수 있습니다.\n\n<b>3단계:</b> ${BUSINESS.name} 홈페이지(${BUSINESS.siteUrl})에서 개통 신청을 진행합니다.\n\n<b>4단계:</b> 유심을 단말기에 장착하면 개통이 완료됩니다.`,
  ],
  '주의사항': [
    `{keyword} 진행 시 몇 가지 확인할 점이 있습니다.\n\n• 본인 명의 인증이 필요할 수 있습니다\n• 유심 규격(Nano, Micro 등)을 단말기에 맞게 선택하세요\n• 데이터 요금제는 사용 패턴에 맞게 선택하는 것이 좋습니다\n• 번호이동 시 기존 번호의 계약 상태를 확인하세요`,
  ],
  '마무리': [
    `지금까지 {keyword}에 대해 살펴보았습니다. 더 자세한 내용이나 상담이 필요하시면 ${BUSINESS.name}(${BUSINESS.siteUrl})을 방문해주세요. 합리적인 요금으로 편리하게 이용하실 수 있습니다.`,
    `{keyword} 관련 궁금한 점이 해결되셨기를 바랍니다. ${BUSINESS.name}에서는 다양한 선불 요금제와 간편한 개통 서비스를 제공하고 있으니 참고해보세요. 홈페이지: ${BUSINESS.siteUrl}`,
  ],
  '종류별 특징': [
    `{keyword}의 종류를 크게 나눠보면 다음과 같습니다.\n\n<b>일반 선불폰</b>: 통화와 문자 중심의 기본 요금제. 데이터 사용이 적은 분께 적합합니다.\n\n<b>데이터 선불폰</b>: 데이터 위주 요금제. 영상 시청이나 SNS 이용이 많은 분께 좋습니다.\n\n<b>알뜰폰 선불</b>: MVNO 기반으로 대형 통신사 망을 저렴하게 이용할 수 있습니다.`,
  ],
  '장단점 비교': [
    `<b>{keyword}의 장점</b>\n• 약정 없이 자유롭게 이용 가능\n• 월 통신비 절감 효과\n• 신용 상태와 무관하게 개통 가능\n• 필요할 때만 충전하여 사용\n\n<b>고려할 점</b>\n• 일부 요금제는 데이터 제한이 있을 수 있음\n• 단말기는 별도 준비가 필요한 경우가 있음\n• 충전 잔액 관리가 필요함`,
  ],
  '추천 선택법': [
    `자신에게 맞는 {keyword}을 선택하려면 다음을 고려해보세요.\n\n1. <b>사용 목적</b>: 통화 위주인지, 데이터 위주인지 파악\n2. <b>사용 기간</b>: 단기 사용인지, 장기 사용인지 결정\n3. <b>예산</b>: 월 통신비 예산을 미리 설정\n4. <b>개통 편의성</b>: 온라인 개통이 가능한 곳을 선택\n\n${BUSINESS.name}(${BUSINESS.siteUrl})에서는 다양한 요금제를 비교하고 온라인으로 간편하게 개통할 수 있습니다.`,
  ],
  'Q1': [
    `<b>Q. {keyword}은 누구나 가능한가요?</b>\n\nA. 네, 대부분의 경우 본인 인증만 가능하면 누구나 이용할 수 있습니다. 통신요금 미납이 있는 경우에도 선불 방식이기 때문에 개통이 가능한 경우가 많습니다.`,
  ],
  'Q2': [
    `<b>Q. 기존 번호를 유지할 수 있나요?</b>\n\nA. 번호이동 서비스를 이용하면 기존에 사용하던 번호를 그대로 가져올 수 있습니다. 다만, 기존 통신사의 미납 요금이 있다면 먼저 확인이 필요합니다.`,
  ],
  'Q3': [
    `<b>Q. 유심은 어디서 구매하나요?</b>\n\nA. 편의점, 온라인 쇼핑몰, 또는 ${BUSINESS.name} 홈페이지에서 구매할 수 있습니다. 단말기에 맞는 유심 규격을 확인한 후 구매하세요.`,
  ],
  'Q4': [
    `<b>Q. 요금은 어떻게 충전하나요?</b>\n\nA. 편의점 충전, 온라인 충전, 자동 충전 등 다양한 방법이 있습니다. ${BUSINESS.name}에서는 홈페이지를 통한 간편 충전도 지원합니다.`,
  ],
  '선택 이유': [
    `{keyword}을 알아보게 된 계기는 다양합니다. 약정 만료 후 더 저렴한 요금제를 찾는 분, 통신 정지 후 새 회선이 필요한 분, 또는 보조 회선이 필요한 분까지. 각자의 상황에 맞는 선택이 중요합니다.`,
  ],
  '이용 과정': [
    `실제 {keyword} 과정을 살펴보면 생각보다 간단합니다.\n\n먼저 ${BUSINESS.name}(${BUSINESS.siteUrl})에 접속하여 요금제를 비교합니다. 원하는 요금제를 선택한 후 개통 신청서를 작성하고, 유심을 받아 단말기에 장착하면 됩니다. 전체 과정이 온라인으로 진행되어 편리합니다.`,
  ],
  '결과 및 느낀점': [
    `{keyword}을 진행하고 나면 매달 통신비가 절감되는 것을 체감할 수 있습니다. 약정에 묶이지 않아 자유롭게 요금제를 변경할 수 있다는 점도 큰 장점입니다. 필요에 따라 데이터를 추가하거나 줄일 수 있어 효율적입니다.`,
  ],
  '꿀팁 정리': [
    `{keyword} 꿀팁을 정리해드립니다.\n\n• 요금제 비교 시 데이터 단가를 기준으로 비교하세요\n• 유심은 미리 준비하면 개통이 더 빠릅니다\n• ${BUSINESS.name}(${BUSINESS.siteUrl}) 홈페이지에서 실시간 요금제 확인 가능\n• 개통 후 APN 설정이 필요할 수 있으니 안내를 참고하세요`,
  ],
};

/** 랜덤으로 하나 선택 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 태그 생성 */
function generateTags(keyword: string): string[] {
  const baseTags = [keyword, '선불폰', '선불유심', BUSINESS.name];
  const extraTags = [
    '알뜰폰', '유심개통', '선불요금제', '폰개통',
    '번호이동', '통신비절약', '무약정폰', '데이터요금제',
    '선불폰추천', '유심구매',
  ];
  // 랜덤으로 추가 태그 섞기
  const shuffled = extraTags.sort(() => Math.random() - 0.5);
  const tags = [...new Set([...baseTags, ...shuffled])];
  return tags.slice(0, SEO.maxTags);
}

/** 콘텐츠 생성 */
export function generatePost(keyword: string): BlogPost {
  const template = pick(TEMPLATES);
  const year = new Date().getFullYear();
  const title = template.titlePattern
    .replace('{keyword}', keyword)
    .replace('{year}', String(year));

  // 각 섹션에서 콘텐츠 블록 선택
  const sections: string[] = [];
  for (const section of template.sections) {
    const blocks = CONTENT_BLOCKS[section];
    if (blocks) {
      let content = pick(blocks).replace(/\{keyword\}/g, keyword);
      sections.push(content);
    }
  }

  // HTML로 조합
  let body = sections
    .map((s, i) => {
      if (i === 0) return `<p>${s}</p>`;
      return `<p>&nbsp;</p>\n<p>${s}</p>`;
    })
    .join('\n');

  // 금칙어 치환
  body = replaceForbiddenWords(body);

  const tags = generateTags(keyword);
  const seoReport = analyzeSeo(body.replace(/<[^>]*>/g, ''), keyword);

  return { title, body, tags, keyword, seoReport };
}

// CLI 실행
if (require.main === module) {
  const keyword = process.argv[2] || '선불폰 개통';
  const post = generatePost(keyword);
  console.log('=== 생성된 블로그 포스트 ===');
  console.log(`제목: ${post.title}`);
  console.log(`태그: ${post.tags.join(', ')}`);
  console.log(`\nSEO 점수: ${post.seoReport.score}/100`);
  console.log(`글자 수: ${post.seoReport.charCount}`);
  console.log(`키워드 밀도: ${post.seoReport.keywordDensity.toFixed(1)}%`);
  if (post.seoReport.issues.length > 0) {
    console.log('\n문제점:');
    post.seoReport.issues.forEach(i => console.log(`  - ${i}`));
  }
  console.log('\n--- 본문 (HTML) ---');
  console.log(post.body);
}
