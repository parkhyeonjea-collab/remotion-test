# 프로젝트 개요

이 저장소는 두 가지 프로젝트를 포함합니다:

1. **Remotion 유튜브 숏츠 영상** (루트 디렉토리) - 선불폰 마케팅 모션 타이포그래피 영상
2. **네이버 블로그 자동 포스팅** (`blog-auto/`) - Playwright 기반 자동화 시스템

---

## 사업 정보

- **사업체명**: 라이트모바일
- **사이트**: 라이트모바일.com
- **랜딩페이지**: https://90000.qshop.ai
- **워드프레스 블로그**: litemobile.co.kr
- **카카오톡 채널**: http://pf.kakao.com/_uQfpn/chat (홍보 최소화 - 응대 번거로움)
- **업종**: 선불폰 전문 개통 서비스

---

## blog-auto/ - 네이버 블로그 자동 포스팅 시스템

### 아키텍처 (4단계 파이프라인)

```
키워드 수집 → SEO 콘텐츠 생성 → 이미지 생성 → Playwright 자동 포스팅
```

### 모듈 구조

| 파일 | 역할 |
|------|------|
| `src/config.ts` | 사업체 정보, SEO 설정, 시드 키워드 |
| `src/keywords.ts` | 네이버 자동완성 API로 선불폰 관련 키워드 수집 |
| `src/seo.ts` | 금칙어 필터(46개) + 대체어 치환 + 키워드 밀도 분석 |
| `src/content.ts` | 4종 템플릿(how-to/비교/FAQ/후기) 기반 SEO 최적화 글 생성 |
| `src/image.ts` | sharp 기반 유니크 헤더 이미지 생성 (7가지 색상 팔레트) |
| `src/browser.ts` | Playwright로 네이버 로그인 → 에디터 → 콘텐츠/이미지/태그 입력 → 발행 |
| `src/main.ts` | 전체 파이프라인 오케스트레이터 |
| `data/forbidden-words.json` | 금칙어 + 대체어 데이터베이스 |

### 환경 설정

```bash
cd blog-auto
cp .env.example .env
# .env에 NAVER_ID, NAVER_PW 입력
```

### 실행 방법

```bash
cd blog-auto
npm install
npx playwright install chromium

# 전체 실행
npx ts-node src/main.ts

# 개별 모듈
npx ts-node src/keywords.ts          # 키워드 수집
npx ts-node src/content.ts "선불폰"    # 콘텐츠 생성
npx ts-node src/image.ts "선불폰" 2    # 이미지 생성
npx ts-node src/seo.ts                # SEO 분석
```

### 알려진 이슈 및 TODO

- `browser.ts`의 `executablePath`가 하드코딩됨 → 로컬에서는 제거하거나 환경에 맞게 변경 필요
- 콘텐츠 글자 수가 SEO 최소 기준(1500자)에 미달하는 경우 있음 → 템플릿 보강 필요
- 네이버 SmartEditor 셀렉터가 버전에 따라 다를 수 있음 → 실행 후 셀렉터 확인/수정 필요
- 네이버 2단계 인증 시 수동 확인 필요할 수 있음
- `HEADLESS=false`로 설정하면 브라우저 화면 확인 가능 (디버깅용)

### SEO 기준

- 최소 글자 수: 1500자
- 최대 글자 수: 2500자
- 키워드 밀도: 1.5% ~ 3.5%
- 태그 최대: 10개
- 금칙어 자동 필터링 및 대체어 치환

---

## Remotion 영상 (루트 디렉토리)

- 유튜브 숏츠용 9:16 (1080x1920) 모션 타이포그래피 영상
- TTS: sherpa-onnx VITS Korean KSS 모델 사용
- 출력: `out/shorts_tts.mp4`
- 스크립트: `video-script.json` (6씬 구성)

### 실행

```bash
npm install
npx remotion render src/index.ts VideoComposition out/shorts_tts.mp4
```

---

## 주의사항

- `.env` 파일에 네이버 계정 정보가 있음 → 절대 커밋하지 말 것 (.gitignore에 포함됨)
- `blog-auto/out/` 디렉토리는 생성된 이미지 출력 폴더 (.gitignore에 포함됨)
- 카카오톡 채널은 홍보 최소화 (사업주 요청)
