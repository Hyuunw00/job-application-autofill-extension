# 입사지원 자동완성 크롬 익스텐션

AI가 스스로 판단하여 입사지원 폼을 자동으로 채워주는 크롬 익스텐션입니다.

## 🎯 주요 기능

- **AI 완전 자율 시스템**: OpenAI API를 활용하여 DOM 분석부터 실패 감지까지 모두 AI가 처리
- **완전 자동 채우기**: 이름, 연락처, 학력, 경력, 자격증 등 모든 필드 자동 입력
- **AI 기반 실패 감지**: 커스텀 UI(datepicker, 커스텀 select 등) 포함 모든 필드 감지
- **스마트 제안**: 실패한 필드 클릭 시 AI가 적합한 값 추천
- **동적 DOM 대응**: 재분석 버튼으로 동적으로 생성된 필드도 처리
- **CSP 우회**: Main World 실행으로 Content Security Policy 제약 없이 동작

## 🚀 특징

### AI 완전 자율 방식

- 하드코딩 없이 AI가 직접 DOM을 분석하여 필드 식별
- 실패 필드 감지도 AI가 담당 (커스텀 UI 컴포넌트 포함)
- 필드별 적합한 값 자동 매칭 및 제안
- 다양한 폼 구조에 유연하게 대응

### 스마트 매칭

- "남" = "Male" = "M" (의미적 이해)
- "군필" = "Completed" = "복무완료"
- "대한민국" = "한국" = "Korea"
- 날짜 형식 자동 변환 (YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD)

### 동적 필드 지원

- 자동완성 전 확인 알림: "동적 필드를 먼저 모두 펼쳤나요?"
- 재분석 버튼: 새로 추가된 필드도 분석 가능
- 경력 추가, 학력 추가 등 동적 생성 필드 대응

### 보안

- `fetch`, `eval`, `Function` 등 위험한 API 자동 차단
- 사용자 데이터는 브라우저 로컬 저장소에만 보관
- Main World 실행으로 CSP 우회 (안전한 코드만 실행)

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/hyunw00/job-application-autofill-extension.git
cd job-application-autofill-extension
```

### 2. 크롬 익스텐션 로드

1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. 이 프로젝트 폴더 선택

### 3. OpenAI API 키 설정

1. 익스텐션 아이콘 클릭
2. "AI 설정" 섹션에서 API 키 입력
3. "테스트" 버튼으로 연결 확인

> API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.
>
> 💰 **비용**: GPT-4o-mini 기준 페이지당 약 0.7원 (자동완성 1회 + 실패 분석 1회)

## 💡 사용 방법

### 1. 데이터 입력

익스텐션 팝업에서 다음 정보를 입력하고 저장:

- **개인정보**: 이름, 연락처, 이메일, 생년월일, 주소 등
- **병역사항**: 병역여부, 군별, 계급, 제대유형, 입대일, 전역일
- **학력**: 고등학교, 대학교 정보
- **경력**: 회사명, 부서, 직급, 재직기간, 담당업무
- **어학점수**: 시험종류, 점수, 등록번호, 자격번호
- **자격증**: 자격증명, 취득일, 발행기관, 등록번호
- **교육이수사항**: 교육명, 기관, 활동내용
- **해외경험**: 국가, 목적, 기간, 기관명

### 2. 자동완성 실행

1. 입사지원 페이지 접속
2. 우측 하단 "📝 자동완성" 버튼 클릭
3. **확인 알림**: "동적 필드를 먼저 모두 펼쳤나요?" → "시작" 클릭
4. AI가 폼을 분석하고 자동으로 채움 (약 10-30초 소요)

### 3. 결과 확인

- **성공**: ✅ 자동완성 완료!
- **일부 실패**:
  - 빨간 테두리로 실패 필드 표시
  - 필드 클릭 시 AI 추천값 드롭다운
  - "🔄 새 필드 재분석" 버튼으로 동적 필드 재분석

## 🏗️ 아키텍처

```
Main World (CSP 없음)
  └─ main-world-executor.js (코드 실행)
       ↑ postMessage
Isolated World (Content Script)
  ├─ ai-engine.js         (AI 코드 생성)
  ├─ code-executor.js     (보안 검증)
  ├─ autofill.js          (AI 기반 실패 감지 + 제안)
  ├─ ui.js                (알림)
  └─ index.js             (버튼)
```

### AI 호출 플로우

```
1. 자동완성 버튼 클릭
   ↓
2. [AI 1차 호출] DOM 분석 + 기입 코드 생성
   ↓
3. 코드 실행 (Main World)
   ↓
4. [AI 2차 호출] 실패 필드 감지 + 제안값 생성
   ↓
5. 실패 필드 마킹 + 드롭다운 바인딩
```

### 주요 컴포넌트

#### AI Engine (`ai-engine.js`)

- OpenAI API (GPT-4o-mini) 호출
- 페이지 DOM 구조 추출
- 사용자 데이터를 AI 프롬프트로 변환
- 순수 JavaScript 코드 생성

#### Autofill Logic (`autofill.js`)

- 오케스트레이션 (AI 호출 → 실행 → AI 실패 분석)
- AI 기반 실패 필드 감지 (커스텀 UI 포함)
- AI 제안값 캐싱 및 드롭다운 표시
- 확인 알림 + 재분석 버튼

#### Code Executor (`code-executor.js`)

- 생성된 코드 보안 검증
- 위험한 API 차단 (fetch, eval, XMLHttpRequest 등)
- Main World로 안전한 코드 전달

#### Main World Executor (`main-world-executor.js`)

- CSP 제약 없이 코드 실행
- postMessage로 결과 반환

## ⚠️ 제한사항

### 가능한 것

- ✅ 단일 페이지 폼 자동완성
- ✅ 텍스트 입력, 라디오, 체크박스
- ✅ 드롭다운 (select, 커스텀 버튼)
- ✅ 커스텀 UI 컴포넌트 (datepicker 등)
- ✅ 동적 생성 필드 (재분석 버튼)

### 불가능한 것

- ❌ 다단계 폼 자동화 (페이지 이동, 다음 버튼)
- ❌ 파일 업로드 (이력서, 증명서)
- ❌ 캡차(CAPTCHA) 우회
- ❌ 인증 우회 (로그인 필수 페이지)
- ❌ 주소 검색 필드 (외부 API 연동 필요)

## 🔧 개발

### 프로젝트 구조

```
job-application-autofill-extension/
├── manifest.json           # 익스텐션 설정
├── popup/                  # 팝업 UI
│   ├── popup.html
│   ├── popup.css
│   ├── index.js            # 메인 진입점
│   ├── data-collector.js   # 데이터 수집
│   ├── form-populator.js   # 데이터 로드
│   ├── dynamic-sections.js # 동적 섹션 (경력, 자격증)
│   └── event-handlers.js   # 이벤트 핸들러
├── content/                # Content Scripts
│   ├── ai-engine.js        # AI 코드 생성
│   ├── code-executor.js    # 보안 검증
│   ├── main-world-executor.js # Main World 실행
│   ├── autofill.js         # AI 실패 감지 + 제안
│   ├── ui.js               # 알림 UI
│   └── index.js            # 버튼 생성
└── icons/                  # 아이콘 파일
```

### 디버깅

1. 개발자 도구 열기 (F12)
2. Console 탭에서 로그 확인
   - `[AI Engine]`: AI 요청/응답, 생성된 코드
   - `[Code Executor]`: 보안 검증
   - `[Autofill]`: 실패 필드 분석, 제안 캐시

### 코드 수정 후 리로드

1. `chrome://extensions/` 접속
2. 익스텐션 "새로고침" 버튼 클릭
3. 페이지 새로고침 (F5)

## 📊 기술 스택

- **AI**: OpenAI API (GPT-4o-mini)
- **Language**: Vanilla JavaScript (ES6+)
- **Storage**: Chrome Storage API (Local)
- **Manifest**: Chrome Extension Manifest V3
