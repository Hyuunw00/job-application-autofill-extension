// AI 엔진 - 완전 자율 DOM 분석 및 처리

/**
 * AI를 사용하여 페이지 전체 분석 및 자동완성
 * @param {Object} userData - 사용자 저장 데이터
 * @param {Object} aiSettings - AI 설정 (mode, apiKey, model)
 * @returns {Promise<Object>} - { code: string }
 */
async function analyzePageWithAI(userData, aiSettings) {
  console.log('[AI Engine] 완전 자율 분석 시작:', aiSettings.mode);

  // 페이지 DOM 전체 추출 (AI가 직접 분석)
  const pageDOM = extractPageDOM();
  console.log(`[AI Engine] DOM 크기: ${pageDOM.length} chars`);

  // 프롬프트 생성
  const prompt = generateSmartPrompt(pageDOM, userData);

  // AI 모드에 따라 분기
  let response;
  if (aiSettings.mode === 'api') {
    response = await callOpenAI(prompt, aiSettings);
  } else {
    response = await callChromeAI(prompt);
  }

  // 응답 파싱
  const result = parseSmartAIResponse(response);
  console.log(`[AI Engine] 생성된 코드 길이: ${result.code ? result.code.length : 0} chars`);

  return result;
}

/**
 * 페이지 DOM 추출 (AI가 분석할 수 있는 형태)
 * @returns {string} - 페이지 HTML
 */
function extractPageDOM() {
  // body 전체 HTML을 추출하되, script/style 태그 제거하여 토큰 절약
  const clone = document.body.cloneNode(true);

  // 불필요한 요소 제거
  clone.querySelectorAll('script, style, svg, img').forEach(el => el.remove());

  // HTML 텍스트 추출
  let html = clone.innerHTML;

  console.log(`[AI Engine] 원본 HTML 크기: ${html.length} chars`);

  // 크기 제한 (100,000자)
  if (html.length > 100000) {
    // form 태그만 추출 시도
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      html = Array.from(forms).map(f => f.outerHTML).join('\n');
      console.log(`[AI Engine] form 태그만 추출: ${html.length} chars`);
    }
    // 그래도 크면 잘라내기
    if (html.length > 100000) {
      html = html.substring(0, 100000) + '\n...(truncated)';
      console.log(`[AI Engine] 100,000자로 잘라냄`);
    }
  }

  return html;
}

/**
 * 스마트 AI 프롬프트 생성 (AI가 모든 것을 판단)
 * @param {string} pageDOM - 페이지 HTML
 * @param {Object} userData - 사용자 데이터
 * @returns {string} - 생성된 프롬프트
 */
function generateSmartPrompt(pageDOM, userData) {
  // 사용자 정보 준비
  const userInfo = prepareUserInfo(userData);

  const prompt = `Fill form. Generate JavaScript code ONLY.

User data:
${JSON.stringify(userInfo)}

HTML:
${pageDOM}

CRITICAL RULES - MUST FOLLOW:
1. ALWAYS check if element exists (if not found, skip it)
2. Use ONLY standard CSS selectors (name, id, class, type, value, placeholder)
3. NEVER use :contains - it's jQuery ONLY and will FAIL
4. For buttons with text: Use Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('text'))
5. Dispatch input/change events after setting value
6. No addEventListener/fetch/localStorage
7. Execute immediately (no functions/wrappers)
8. Analyze DOM structure deeply - try multiple selector strategies (name, id, placeholder, label, data-*, aria-*)

WRONG (❌ WILL FAIL):
document.querySelector('button:contains("확인")')  // ❌ INVALID SELECTOR

CORRECT (✅):
const buttons = Array.from(document.querySelectorAll('button'));
const btn = buttons.find(b => b.textContent.includes('확인'));
if (btn) btn.click();

More examples:
// ✅ Text input
const el = document.querySelector('input[name="name"]');
if (el) {
  el.value = 'value';
  el.dispatchEvent(new Event('input', {bubbles: true}));
}

// ✅ Radio/Checkbox
const radio = document.querySelector('input[value="M"]');
if (radio) {
  radio.checked = true;
  radio.dispatchEvent(new Event('change', {bubbles: true}));
}

// ✅ Select/Dropdown buttons
const btns = Array.from(document.querySelectorAll('button'));
const targetBtn = btns.find(b => b.textContent && b.textContent.trim().includes('대한민국'));
if (targetBtn) targetBtn.click();

// ✅ Find input by label text
const labels = Array.from(document.querySelectorAll('label'));
const nameLabel = labels.find(l => l.textContent.includes('이름'));
if (nameLabel) {
  const input = nameLabel.querySelector('input') || document.getElementById(nameLabel.getAttribute('for'));
  if (input) {
    input.value = '홍길동';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }
}

Return JSON only:
{"code":"..."}`;

  return prompt;
}

/**
 * 사용자 정보 준비
 * @param {Object} userData - 원본 사용자 데이터
 * @returns {Object} - AI에게 전달할 정보
 */
function prepareUserInfo(userData) {
  return {
    개인정보: {
      이름: userData.personalInfo?.name || '',
      이메일: userData.personalInfo?.email?.id && userData.personalInfo?.email?.domain
        ? `${userData.personalInfo.email.id}@${userData.personalInfo.email.domain}`
        : '',
      전화번호: userData.personalInfo?.phone || '',
      긴급연락처: userData.personalInfo?.emergencyContact || '',
      입사가능일자: userData.personalInfo?.availableDate || '',
      비밀번호: userData.personalInfo?.password || '',
      생년월일: formatBirthdate(userData.personalInfo?.birthdate),
      성별: userData.personalInfo?.gender || '',
      주소: userData.personalInfo?.address || '',
      상세주소: userData.personalInfo?.addressDetail || '',
      지원경로: userData.personalInfo?.applicationPath || '',
      희망연봉: userData.personalInfo?.desiredSalary || '',
      직전연봉: userData.personalInfo?.previousSalary || '',
      국적: userData.personalInfo?.nationality || '',
      영문명: userData.personalInfo?.nameEnglish || '',
      한자명: userData.personalInfo?.nameChinese || '',
      병역사항: userData.personalInfo?.militaryService || '',
      군별: userData.personalInfo?.militaryBranch || '',
      계급: userData.personalInfo?.militaryRank || '',
      병과: userData.personalInfo?.militarySpecialty || '',
      입대일: formatDateObject(userData.personalInfo?.militaryEnlistmentDate),
      전역일: formatDateObject(userData.personalInfo?.militaryDischargeDate),
    },
    학력: {
      고등학교: userData.education?.highschool?.name || '',
      고등학교_입학여부: userData.education?.highschool?.admissionStatus || '',
      고등학교_졸업여부: userData.education?.highschool?.graduationStatus || '',
      고등학교_입학: formatDateObject(userData.education?.highschool?.start),
      고등학교_졸업: formatDateObject(userData.education?.highschool?.graduation),
      고등학교_계열: userData.education?.highschool?.type || '',
      대학교: userData.education?.university?.name || '',
      대학교_본교분교: userData.education?.university?.campusType || '',
      대학교_입학여부: userData.education?.university?.admissionStatus || '',
      대학교_졸업여부: userData.education?.university?.graduationStatus || '',
      대학교_주간야간: userData.education?.university?.dayNight || '',
      대학교_입학: formatDateObject(userData.education?.university?.start),
      대학교_졸업: formatDateObject(userData.education?.university?.graduation),
      학과계열: userData.education?.university?.departmentCategory || '',
      전공: userData.education?.university?.major || '',
      전공여부: userData.education?.university?.majorType || '',
      학위: userData.education?.university?.degree || '',
      취득평점: userData.education?.university?.gpa || '',
      전체평점: userData.education?.university?.gpaMax || '',
      기준학점: userData.education?.university?.maxGpa || '',
    },
    경력: userData.careers?.map(c => ({
      회사명: c.career_company || '',
      부서: c.career_department || '',
      직급: c.career_position || '',
      고용형태: c.career_employment_type || '',
      재직중: c.career_is_current ? '재직중' : '',
      시작일: formatDateObject({
        year: c.career_start_year,
        month: c.career_start_month,
        day: c.career_start_day
      }),
      종료일: c.career_is_current ? '재직중' : formatDateObject({
        year: c.career_end_year,
        month: c.career_end_month,
        day: c.career_end_day
      }),
      퇴직사유: c.career_resignation_reason || '',
      업무내용: c.career_description || '',
    })) || [],
    외부활동: userData.activities?.map(a => ({
      분류: a.activity_type || '',
      기관: a.activity_organization || '',
      시작일: formatDateObject({
        year: a.activity_start_year,
        month: a.activity_start_month,
        day: a.activity_start_day
      }),
      종료일: formatDateObject({
        year: a.activity_end_year,
        month: a.activity_end_month,
        day: a.activity_end_day
      }),
      활동명: a.activity_name || '',
      내용: a.activity_description || '',
    })) || [],
    어학점수: userData.languageScores?.map(l => ({
      시험종류: l.language_test_type || '',
      점수: l.language_score || '',
      회화수준: l.language_speaking_level || '',
      취득일: formatDateObject({
        year: l.language_date_year,
        month: l.language_date_month,
        day: l.language_date_day
      }),
      만료일: formatDateObject({
        year: l.language_expiry_year,
        month: l.language_expiry_month,
        day: l.language_expiry_day
      }),
    })) || [],
    자격증: userData.certificates?.map(c => ({
      자격증명: c.certificate_name || '',
      발급기관: c.certificate_issuer || '',
      취득일: formatDateObject({
        year: c.certificate_date_year,
        month: c.certificate_date_month,
        day: c.certificate_date_day
      }),
      등록번호: c.certificate_registration_number || '',
      자격번호: c.certificate_license_number || '',
    })) || [],
    해외경험: userData.overseas?.map(o => ({
      국가: o.overseas_country || '',
      목적: o.overseas_purpose || '',
      시작일: formatDateObject({
        year: o.overseas_start_year,
        month: o.overseas_start_month,
        day: o.overseas_start_day
      }),
      종료일: formatDateObject({
        year: o.overseas_end_year,
        month: o.overseas_end_month,
        day: o.overseas_end_day
      }),
      기관명: o.overseas_institution || '',
      내용: o.overseas_description || '',
    })) || [],
    교육이수: userData.educations?.map(e => ({
      교육명: e.education_name || '',
      교육기관: e.education_organization || '',
      교육시작일: formatDateObject({
        year: e.education_start_year,
        month: e.education_start_month,
        day: e.education_start_day
      }),
      교육종료일: formatDateObject({
        year: e.education_end_year,
        month: e.education_end_month,
        day: e.education_end_day
      }),
      교육시간: e.education_hours || '',
      활동내용: e.education_description || '',
    })) || [],
    증명서: {
      성적증명서: userData.documents?.transcript || false,
      졸업증명서: userData.documents?.graduation || false,
      자격증: userData.documents?.certificate || false,
      공인외국어: userData.documents?.language || false,
      기타: userData.documents?.other || false,
      메모: userData.documents?.notes || '',
    },
    장애보훈: {
      장애사항: userData.disabilityVeteran?.disabilityStatus || '',
      장애등급: userData.disabilityVeteran?.disabilityGrade || '',
      보훈여부: userData.disabilityVeteran?.veteranStatus || '',
      보훈등급: userData.disabilityVeteran?.veteranGrade || '',
    },
  };
}

/**
 * OpenAI API 호출
 * @param {string} prompt - 프롬프트
 * @param {Object} aiSettings - AI 설정
 * @returns {Promise<string>} - AI 응답
 */
async function callOpenAI(prompt, aiSettings) {
  console.log('[OpenAI] API 호출 시작:', aiSettings.model);

  try {
    // 타임아웃 설정 (90초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [
          {
            role: 'system',
            content: '당신은 웹 페이지 자동화 전문가입니다. DOM을 분석하고 적절한 동작을 판단하여 JSON으로만 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 오류 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('[OpenAI] 응답 받음:', content.substring(0, 200) + '...');

    return content;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[OpenAI] API 타임아웃 (90초 초과)');
      throw new Error('OpenAI API 응답 시간 초과 (90초). 서버가 과부하 상태일 수 있습니다.');
    }
    console.error('[OpenAI] 오류:', error);
    throw error;
  }
}

/**
 * Chrome AI 호출 (무료 모드)
 * @param {string} prompt - 프롬프트
 * @returns {Promise<string>} - AI 응답
 */
async function callChromeAI(prompt) {
  console.log('[Chrome AI] 호출 시작');

  try {
    if (!window.ai || !window.ai.languageModel) {
      throw new Error('Chrome AI를 사용할 수 없습니다. Chrome 127 이상이 필요합니다.');
    }

    const session = await window.ai.languageModel.create({
      temperature: 0.1,
      topK: 1,
    });

    const response = await session.prompt(prompt);
    console.log('[Chrome AI] 응답 받음:', response.substring(0, 100) + '...');

    return response;
  } catch (error) {
    console.error('[Chrome AI] 오류:', error);
    throw error;
  }
}

/**
 * AI 응답 파싱 (초간단 방식)
 * @param {string} response - AI 응답 (JSON 문자열)
 * @returns {Object} - { code: string }
 */
function parseSmartAIResponse(response) {
  try {
    const data = JSON.parse(response);

    if (!data.code) {
      throw new Error('AI 응답에 code 필드가 없습니다');
    }

    return {
      code: data.code
    };
  } catch (error) {
    console.error('[AI Engine] 응답 파싱 오류:', error);
    console.error('[AI Engine] 원본 응답:', response);
    return {
      code: null
    };
  }
}

/**
 * 생년월일 포맷팅 헬퍼
 * @param {Object} birthdate - {year, month, day}
 * @returns {string} - YYYY-MM-DD 형식
 */
function formatBirthdate(birthdate) {
  if (!birthdate || !birthdate.year) return '';

  const year = birthdate.year;
  const month = birthdate.month ? String(birthdate.month).padStart(2, '0') : '01';
  const day = birthdate.day ? String(birthdate.day).padStart(2, '0') : '01';

  return `${year}-${month}-${day}`;
}

/**
 * 날짜 객체 포맷팅 헬퍼
 * @param {Object} dateObj - {year, month, day}
 * @returns {string} - YYYY-MM-DD 형식
 */
function formatDateObject(dateObj) {
  if (!dateObj || !dateObj.year) return '';

  const year = dateObj.year;
  const month = dateObj.month ? String(dateObj.month).padStart(2, '0') : '01';
  const day = dateObj.day ? String(dateObj.day).padStart(2, '0') : '01';

  return `${year}-${month}-${day}`;
}
