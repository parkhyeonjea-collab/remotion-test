# Remotion 유튜브 숏츠 영상 제작 프레임워크

## 사업 정보

- **사업체명**: 라이트모바일
- **사이트**: 라이트모바일.com
- **랜딩페이지**: https://90000.qshop.ai
- **워드프레스 블로그**: litemobile.co.kr
- **카카오톡 채널**: http://pf.kakao.com/_uQfpn/chat (홍보 최소화)
- **업종**: 선불폰 전문 개통 서비스

---

## 영상 제작 파이프라인

```
스크립트 작성 → video-script.json 생성 → TTS 음성 생성 → durationInFrames 조정 → Remotion 렌더링
```

### 1단계: 스크립트 → video-script.json

`video-script.json` (또는 `video-script-v2.json` 등) 파일에 씬별 구조를 정의한다.

**기본 구조:**
```json
{
  "title": "영상 제목",
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "scenes": [ ... ]
}
```

**씬 구조 (`SceneConfig`):**
```json
{
  "id": 1,
  "durationInFrames": 120,
  "backgroundColor": "#0a0a0a",
  "audioFile": "audio/scene_1.wav",
  "transition": "flash",
  "shake": false,
  "blocks": [ ... ]
}
```
- `transition`: `"flash"` | `"zoomIn"` | `"zoomOut"` | `"cut"`
- `shake`: 씬 전체 흔들림 효과 (boolean)
- `durationInFrames`: TTS 음성 길이(초) × 30(fps) + 여유 30프레임

**텍스트 블록 (`TextBlock`):**
```json
{
  "text": "표시할 텍스트",
  "effect": "scale",
  "direction": "left",
  "fontSize": 68,
  "color": "#FF3B3B",
  "highlight": true,
  "startFrame": 0,
  "bold": true
}
```
- `effect`: `"slide"` | `"scale"` | `"shake"` | `"typing"` | `"charByChar"` | `"fadeIn"`
- `direction` (slide 전용): `"left"` | `"right"` | `"top"` | `"bottom"`
- `highlight`: true면 네온 글로우 효과 추가
- `startFrame`: 해당 블록이 등장하는 프레임 (0부터 시작, 씬 내 상대 프레임)
- `fontSize`: 1080px 기준 크기 (자동 스케일링됨)

### 2단계: TTS 음성 생성

**권장: Edge TTS (로컬 환경, 완전 무료, 카드 불필요)**
```bash
pip install edge-tts

# 여성 음성 (자연스러움)
edge-tts --voice ko-KR-SunHiNeural --text "대사 텍스트" --write-media public/audio/scene_1.wav

# 남성 음성
edge-tts --voice ko-KR-InJoonNeural --text "대사 텍스트" --write-media public/audio/scene_1.wav
```

**오디오 후처리 (선택사항, ffmpeg):**
```bash
ffmpeg -y -i raw.wav \
  -af "highpass=f=80,lowpass=f=8000,loudnorm=I=-14:TP=-1:LRA=11,aresample=44100" \
  public/audio/scene_1.wav
```

**TTS 대사 작성 팁:**
- 영문/숫자/약어는 한글 발음으로 변환 (GS25 → "지에스이오", OK → "오케이")
- URL은 "닷 컴" 등으로 분리 (라이트모바일.com → "라이트모바일 닷 컴")
- 쉼표(,)와 마침표(.)로 호흡 조절

### 3단계: durationInFrames 계산

TTS 음성 생성 후 각 씬의 `durationInFrames`를 조정한다:
```
durationInFrames = (음성 길이 초 × 30) + 30 (여유)
```

**ffprobe로 음성 길이 확인:**
```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/audio/scene_1.wav
```

### 4단계: Root.tsx에서 스크립트 로드

`src/Root.tsx`에서 사용할 JSON 파일을 지정:
```typescript
videoScript = require("../video-script-v2.json") as ShortsScript;
```

### 5단계: 렌더링

```bash
npm install
npx remotion render src/index.ts VideoComposition out/shorts.mp4
```

출력: `out/` 디렉토리에 H.264 + AAC MP4 파일

---

## 모션 이펙트 레퍼런스

| 이펙트 | 설명 | 추천 용도 |
|--------|------|-----------|
| `slide` | 방향에서 스프링 슬라이드인 + 모션블러 | 일반 텍스트, 설명 |
| `scale` | 바운스 팝업 (0.2→1.18→0.93→1) | 강조, 핵심 메시지 |
| `shake` | scale + 진동 (10~22프레임) | 충격적 내용, 훅 |
| `typing` | 타자기 효과 + 커서 깜빡임 | 목록, 상세 정보 |
| `charByChar` | 글자 하나씩 스프링 등장 | URL, 브랜드명, CTA |
| `fadeIn` | 단순 페이드인 | 보조 텍스트 |

## 씬 전환 효과 레퍼런스

| 전환 | 설명 | 추천 용도 |
|------|------|-----------|
| `flash` | 흰색 플래시 오버레이 (0.7→0, 8프레임) | 강한 전환, 훅 직후 |
| `zoomIn` | 1.12→1 줌인 (10프레임) | 공감/설명 씬 |
| `zoomOut` | 0.88→1 줌아웃 (10프레임) | 정보 나열 씬 |
| `cut` | 효과 없음 (직접 컷) | 빠른 전환 |

---

## 숏츠 레이아웃 규칙

- **해상도**: 1080×1920 (9:16)
- **안전 영역**: 상단 15% ~ 하단 35% 사이에 콘텐츠 배치
  - 하단 35%는 유튜브 숏츠 UI(좋아요/댓글/공유 버튼)에 가려짐
- **최대 텍스트 너비**: 화면의 85%
- **폰트**: Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic (fallback)

---

## 색상 팔레트 가이드

| 용도 | 색상 | 코드 |
|------|------|------|
| 훅/위험/경고 | 빨강 | `#FF3B3B`, `#FF5252` |
| 강조/CTA | 노랑 | `#FFD600` |
| 솔루션/긍정 | 초록 | `#00E676` |
| 정보/링크 | 하늘 | `#4FC3F7`, `#00E5FF` |
| 브랜드/보라 | 보라 | `#AB47BC`, `#6C5CE7` |
| 주의/경고 | 주황 | `#FF9800` |
| 일반 텍스트 | 흰/회 | `#FFFFFF`, `#CCCCCC`, `#AAAAAA` |
| 배경 | 다크 | `#0a0a0a`, `#0d0d14`, `#0a0a12` |

---

## 숏츠 스크립트 구성 패턴

유튜브 숏츠는 보통 30~60초. 4~6씬 구성이 적절.

```
씬1 [훅 2~3초]      → shake/scale + flash 전환, 빨강/노랑, 질문형
씬2 [공감 5~10초]   → slide 위주 + zoomIn, 회색→주황 강조
씬3 [솔루션 10~25초] → 다양한 이펙트 혼합 + flash, 하늘/초록/노랑
씬4 [CTA 5~10초]    → charByChar(URL) + shake, 노랑/빨강 강조
```

---

## 기존 영상 파일

| 파일 | 내용 |
|------|------|
| `video-script.json` | v1: 폰 정지 전 대처법 (6씬, 54.8초) |
| `video-script-v2.json` | v2: 신용불량/무직 타겟 개통 (4씬, 41.8초) |
| `out/shorts_tts.mp4` | v1 렌더링 결과물 |
| `out/shorts_v2.mp4` | v2 렌더링 결과물 |

---

## blog-auto/ - 네이버 블로그 자동 포스팅

별도 시스템. 자세한 내용은 `blog-auto/` 디렉토리 참고.

```bash
cd blog-auto && npm install && npx playwright install chromium
npx ts-node src/main.ts
```

### 주의사항

- `.env` 파일에 네이버 계정 정보 있음 → 절대 커밋 금지
- 카카오톡 채널 홍보 최소화 (사업주 요청)
