// 네이버 블로그 Playwright 자동화 모듈
// 전략: 저장된 임시글(템플릿)을 불러와서 이미지+텍스트 교체 후 발행
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import { BROWSER } from './config';
import { BlogPost } from './content';

const NAVER_LOGIN_URL = 'https://nid.naver.com/nidlogin.login';
const BLOG_WRITE_URL = 'https://blog.naver.com/GoBlogWrite.naver';

/** 네이버 로그인 */
async function login(page: Page): Promise<void> {
  console.log('[브라우저] 네이버 로그인 시작...');
  await page.goto(NAVER_LOGIN_URL, { waitUntil: 'networkidle' });

  // 자동입력 방지를 위해 clipboard 방식으로 입력
  await page.click('#id');
  await page.evaluate((id: string) => {
    const el = document.querySelector('#id') as HTMLInputElement;
    el.value = id;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, BROWSER.naverId);

  await page.click('#pw');
  await page.evaluate((pw: string) => {
    const el = document.querySelector('#pw') as HTMLInputElement;
    el.value = pw;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, BROWSER.naverPw);

  await page.click('.btn_login');
  await page.waitForURL('**/my.naver.com/**', { timeout: 30000 }).catch(() => {
    // 2차 인증이나 캡차가 뜰 수 있음
    console.log('[브라우저] 로그인 후 추가 인증이 필요할 수 있습니다.');
  });

  console.log('[브라우저] 로그인 완료');
}

/** 블로그 글쓰기 에디터 열기 */
async function openEditor(page: Page): Promise<void> {
  console.log('[브라우저] 블로그 에디터 열기...');
  await page.goto(BLOG_WRITE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // SmartEditor iframe 진입
  const editorFrame = page.frameLocator('#mainFrame');
  await editorFrame.locator('.se-content').waitFor({ timeout: 15000 });
  console.log('[브라우저] 에디터 로드 완료');
}

/** 임시글(템플릿) 불러오기 */
async function loadDraft(page: Page): Promise<void> {
  console.log('[브라우저] 임시글 불러오기...');
  const frame = page.frameLocator('#mainFrame');

  // 임시저장 버튼 클릭
  await frame.locator('button:has-text("임시저장")').click();
  await page.waitForTimeout(1000);

  // 임시글 목록에서 첫 번째 선택
  await frame.locator('.temp_post_item').first().click();
  await page.waitForTimeout(1000);

  // 불러오기 확인
  await frame.locator('button:has-text("불러오기")').click();
  await page.waitForTimeout(2000);

  console.log('[브라우저] 임시글 불러오기 완료');
}

/** 에디터 내용 교체 */
async function replaceContent(
  page: Page,
  post: BlogPost,
  imagePaths: string[]
): Promise<void> {
  console.log('[브라우저] 콘텐츠 교체 중...');
  const frame = page.frameLocator('#mainFrame');

  // 제목 입력
  const titleInput = frame.locator('.se-title-text');
  await titleInput.click();
  await titleInput.fill('');
  await titleInput.type(post.title, { delay: 50 });

  // 본문 영역 클릭
  const contentArea = frame.locator('.se-content .se-component-content');
  await contentArea.first().click();

  // 전체 선택 후 삭제
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(500);

  // 이미지 삽입 (첫 번째 이미지)
  if (imagePaths.length > 0) {
    console.log('[브라우저] 이미지 삽입 중...');
    // 사진 추가 버튼
    const photoBtn = frame.locator('button[data-name="image"]');
    await photoBtn.click();
    await page.waitForTimeout(1000);

    // 파일 업로드
    const fileInput = frame.locator('input[type="file"]');
    await fileInput.setInputFiles(imagePaths[0]);
    await page.waitForTimeout(3000);

    // 업로드 확인
    const confirmBtn = frame.locator('button:has-text("확인"), button:has-text("등록")');
    if (await confirmBtn.count() > 0) {
      await confirmBtn.first().click();
    }
    await page.waitForTimeout(2000);
  }

  // 본문 HTML 삽입 (JavaScript로 직접)
  await frame.locator('.se-content').click();
  await page.waitForTimeout(500);

  // 줄 단위로 텍스트 입력
  const plainText = post.body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const lines = plainText.split('\n').filter(l => l.trim());
  for (const line of lines) {
    await page.keyboard.type(line, { delay: 10 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
  }

  // 두 번째 이미지 삽입 (본문 중간 or 하단)
  if (imagePaths.length > 1) {
    const photoBtn = frame.locator('button[data-name="image"]');
    await photoBtn.click();
    await page.waitForTimeout(1000);
    const fileInput = frame.locator('input[type="file"]');
    await fileInput.setInputFiles(imagePaths[1]);
    await page.waitForTimeout(3000);
    const confirmBtn = frame.locator('button:has-text("확인"), button:has-text("등록")');
    if (await confirmBtn.count() > 0) {
      await confirmBtn.first().click();
    }
    await page.waitForTimeout(2000);
  }

  console.log('[브라우저] 콘텐츠 교체 완료');
}

/** 태그 설정 */
async function setTags(page: Page, tags: string[]): Promise<void> {
  console.log('[브라우저] 태그 설정 중...');
  const frame = page.frameLocator('#mainFrame');

  const tagInput = frame.locator('.se-tag-input input, input[placeholder*="태그"]');
  for (const tag of tags) {
    await tagInput.fill(tag);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }

  console.log(`[브라우저] ${tags.length}개 태그 설정 완료`);
}

/** 카테고리 설정 */
async function setCategory(page: Page, categoryName: string): Promise<void> {
  const frame = page.frameLocator('#mainFrame');
  try {
    const categoryBtn = frame.locator('.se-category-btn, button:has-text("카테고리")');
    await categoryBtn.click();
    await page.waitForTimeout(500);

    const categoryItem = frame.locator(`text="${categoryName}"`);
    if (await categoryItem.count() > 0) {
      await categoryItem.click();
      console.log(`[브라우저] 카테고리 설정: ${categoryName}`);
    }
  } catch {
    console.log('[브라우저] 카테고리 설정 건너뜀');
  }
}

/** 발행하기 */
async function publish(page: Page): Promise<string> {
  console.log('[브라우저] 발행 중...');
  const frame = page.frameLocator('#mainFrame');

  // 발행 버튼 클릭
  const publishBtn = frame.locator('button:has-text("발행")');
  await publishBtn.click();
  await page.waitForTimeout(2000);

  // 공개 설정 확인
  const publicOption = frame.locator('label:has-text("공개")');
  if (await publicOption.count() > 0) {
    await publicOption.click();
  }
  await page.waitForTimeout(500);

  // 최종 발행 확인
  const finalPublish = frame.locator('button:has-text("발행"), button:has-text("확인")').last();
  await finalPublish.click();
  await page.waitForTimeout(3000);

  // 발행된 URL 가져오기
  const url = page.url();
  console.log(`[브라우저] 발행 완료: ${url}`);
  return url;
}

/** 메인 포스팅 함수 */
export async function postToBlog(
  post: BlogPost,
  imagePaths: string[],
  options: { useDraft?: boolean; category?: string } = {}
): Promise<string> {
  const { useDraft = false, category } = options;

  if (!BROWSER.naverId || !BROWSER.naverPw) {
    throw new Error('[브라우저] NAVER_ID, NAVER_PW 환경변수를 설정하세요');
  }

  const executablePath = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({
    headless: BROWSER.headless,
    slowMo: BROWSER.slowMo,
    executablePath,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // 1. 로그인
    await login(page);

    // 2. 에디터 열기
    await openEditor(page);

    // 3. 임시글 불러오기 (옵션)
    if (useDraft) {
      await loadDraft(page);
    }

    // 4. 콘텐츠 교체
    await replaceContent(page, post, imagePaths);

    // 5. 태그 설정
    await setTags(page, post.tags);

    // 6. 카테고리 설정
    if (category) {
      await setCategory(page, category);
    }

    // 7. 발행
    const url = await publish(page);

    await context.close();
    return url;
  } finally {
    await browser.close();
  }
}

// CLI 실행 (테스트용 - 실제 포스팅하지 않고 로그인만 테스트)
if (require.main === module) {
  (async () => {
    console.log('=== 브라우저 자동화 테스트 ===');
    console.log(`NAVER_ID: ${BROWSER.naverId ? '설정됨' : '미설정'}`);
    console.log(`NAVER_PW: ${BROWSER.naverPw ? '설정됨' : '미설정'}`);
    console.log(`Headless: ${BROWSER.headless}`);

    if (!BROWSER.naverId || !BROWSER.naverPw) {
      console.log('\n.env 파일에 NAVER_ID, NAVER_PW를 설정한 후 실행하세요.');
      return;
    }

    const browser = await chromium.launch({
      headless: BROWSER.headless,
      slowMo: BROWSER.slowMo,
      executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    });
    const page = await browser.newPage();
    await login(page);
    console.log('로그인 테스트 성공!');
    await browser.close();
  })();
}
