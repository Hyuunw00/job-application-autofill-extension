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
  console.log(`[AI Engine] 생성된 코드:\n`, result.code);

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

  const prompt = `You are a form auto-fill assistant. Analyze the HTML and generate JavaScript code to fill the form with user data.

=== USER DATA ===
${JSON.stringify(userInfo, null, 2)}

=== HTML ===
${pageDOM}

=== RULES ===
1. Generate executable JavaScript code (no function wrappers, execute immediately)
2. ALWAYS check element exists before using (if not found, skip)
3. Use standard CSS selectors only (NEVER use :contains - it will fail)
4. For finding elements by text: use Array.from().find() pattern

=== HANDLE ALL FIELD TYPES ===
- input[type="text"], textarea: set .value
- input[type="radio"], input[type="checkbox"]: set .checked = true
- select: set .value or .selectedIndex
- Custom dropdowns (div-based): find and click the trigger, then click the option
- Date fields: handle various formats (YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD)

=== EVENTS (CRITICAL) ===
After setting any value, MUST dispatch events:
- input event: new Event('input', {bubbles: true})
- change event: new Event('change', {bubbles: true})

=== SKIP THESE FIELDS ===
- Address search fields (주소 검색, 우편번호) - these require external API
- File upload fields
- CAPTCHA fields

=== SELECTOR STRATEGIES ===
Try multiple approaches to find fields:
- By name, id, placeholder attributes
- By associated label text
- By aria-label, data-* attributes
- By parent element context

Return JSON only: {"code":"..."}`;

  return prompt;
}

/**
 * 사용자 정보 준비 (단순화: 모든 값은 이미 string)
 * @param {Object} userData - 원본 사용자 데이터
 * @returns {Object} - AI에게 전달할 정보
 */
function prepareUserInfo(userData) {
  const p = userData.personalInfo || {};
  const edu = userData.education || {};

  return {
    개인정보: {
      이름: p.name || '',
      이메일: typeof p.email === 'object' ? `${p.email.id}@${p.email.domain}` : (p.email || ''),
      전화번호: p.phone || '',
      긴급연락처: p.emergencyContact || '',
      입사가능일자: p.availableDate || '',
      비밀번호: p.password || '',
      생년월일: formatStringOrObject(p.birthdate),
      성별: p.gender || '',
      주소: p.address || '',
      상세주소: p.addressDetail || '',
      지원경로: p.applicationPath || '',
      희망연봉: p.desiredSalary || '',
      직전연봉: p.previousSalary || '',
      국적: p.nationality || '',
      영문명: p.nameEnglish || '',
      한자명: p.nameChinese || '',
      병역사항: p.militaryService || '',
      군별: p.militaryBranch || '',
      계급: p.militaryRank || '',
      병과: p.militarySpecialty || '',
      제대유형: p.militaryDischargeType || '',
      입대일: formatStringOrObject(p.militaryEnlistmentDate),
      전역일: formatStringOrObject(p.militaryDischargeDate),
    },
    학력: {
      고등학교: edu.highschool?.name || '',
      고등학교_입학여부: edu.highschool?.admissionStatus || '',
      고등학교_졸업여부: edu.highschool?.graduationStatus || '',
      고등학교_입학: formatStringOrObject(edu.highschool?.start),
      고등학교_졸업: formatStringOrObject(edu.highschool?.graduation),
      고등학교_계열: edu.highschool?.type || '',
      대학교: edu.university?.name || '',
      대학교_본교분교: edu.university?.campusType || '',
      대학교_입학여부: edu.university?.admissionStatus || '',
      대학교_졸업여부: edu.university?.graduationStatus || '',
      대학교_주간야간: edu.university?.dayNight || '',
      대학교_입학: formatStringOrObject(edu.university?.start),
      대학교_졸업: formatStringOrObject(edu.university?.graduation),
      학과계열: edu.university?.departmentCategory || '',
      전공: edu.university?.major || '',
      전공여부: edu.university?.majorType || '',
      학위: edu.university?.degree || '',
      취득평점: edu.university?.gpa || '',
      전체평점: edu.university?.gpaMax || '',
      기준학점: edu.university?.maxGpa || '',
    },
    경력: userData.careers?.map(c => ({
      회사명: c.career_company || '',
      부서: c.career_department || '',
      직급: c.career_position || '',
      고용형태: c.career_employment_type || '',
      재직중: c.career_is_current ? '재직중' : '',
      시작일: c.career_start_date || '',
      종료일: c.career_is_current ? '재직중' : (c.career_end_date || ''),
      퇴직사유: c.career_resignation_reason || '',
      업무내용: c.career_description || '',
    })) || [],
    프로젝트: userData.projects?.map(p => ({
      프로젝트명: p.project_name || '',
      기관: p.project_organization || '',
      시작일: p.project_start_date || '',
      종료일: p.project_end_date || '',
      내용: p.project_description || '',
    })) || [],
    수상경력: userData.awards?.map(a => ({
      수상명: a.award_name || '',
      수여기관: a.award_organization || '',
      수상일: a.award_date || '',
      내용: a.award_description || '',
    })) || [],
    외부활동: userData.activities?.map(a => ({
      활동명: a.activity_name || '',
      기관: a.activity_organization || '',
      시작일: a.activity_start_date || '',
      종료일: a.activity_end_date || '',
      내용: a.activity_description || '',
    })) || [],
    어학점수: userData.languageScores?.map(l => ({
      시험종류: l.language_test_type || '',
      점수: l.language_score || '',
      회화수준: l.language_speaking_level || '',
      취득일: l.language_date || '',
      만료일: l.language_expiry_date || '',
      등록번호: l.language_registration_number || '',
      자격번호: l.language_license_number || '',
    })) || [],
    자격증: userData.certificates?.map(c => ({
      자격증명: c.certificate_name || '',
      발급기관: c.certificate_issuer || '',
      취득일: c.certificate_date || '',
      만료일: c.certificate_expiry_date || '',
      등록번호: c.certificate_registration_number || '',
      자격번호: c.certificate_license_number || '',
    })) || [],
    해외경험: userData.overseas?.map(o => ({
      국가: o.overseas_country || '',
      목적: o.overseas_purpose || '',
      시작일: o.overseas_start_date || '',
      종료일: o.overseas_end_date || '',
      기관명: o.overseas_institution || '',
      내용: o.overseas_description || '',
    })) || [],
    교육이수: userData.educations?.map(e => ({
      교육명: e.education_name || '',
      교육기관: e.education_organization || '',
      교육시작일: e.education_start_date || '',
      교육종료일: e.education_end_date || '',
      교육시간: e.education_hours || '',
      활동내용: e.education_description || '',
    })) || [],
    컴퓨터활용능력: userData.computerSkills?.map(cs => ({
      활용능력: cs.computer_skill_type || '',
      프로그램명: cs.computer_skill_program || '',
      활용수준: cs.computer_skill_level || '',
      사용기간: cs.computer_skill_duration || '',
    })) || [],
    외국어활용능력: userData.languageSkills?.map(ls => ({
      외국어: ls.language_skill_language || '',
      회화수준: ls.language_skill_speaking || '',
      작문수준: ls.language_skill_writing || '',
      독해수준: ls.language_skill_reading || '',
    })) || [],
    장애보훈: {
      장애사항: userData.disabilityVeteran?.disabilityStatus || '',
      장애등급: userData.disabilityVeteran?.disabilityGrade || '',
      보훈여부: userData.disabilityVeteran?.veteranStatus || '',
      보훈등급: userData.disabilityVeteran?.veteranGrade || '',
    },
  };
}

/**
 * string 또는 객체 형식 호환 처리
 */
function formatStringOrObject(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  // 이전 형식 (객체) 호환
  if (value.year) {
    const y = value.year;
    const m = String(value.month || 1).padStart(2, '0');
    const d = String(value.day || 1).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
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
            content: 'You are a web form automation expert. Analyze DOM structure and generate JavaScript code. Respond with JSON only.'
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

