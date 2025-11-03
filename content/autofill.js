// 자동완성 메인 로직 (V4: 완전 AI 자율 방식)

// 저장된 데이터 (전역 변수)
let savedData = null;

// 자동완성 실행
async function autoFillForm() {
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다.", "error", []);
    return;
  }

  // AI 설정 확인
  const aiSettings = savedData.aiSettings || { mode: 'free', model: 'gpt-4o-mini' };
  console.log('[Autofill] AI 설정:', aiSettings);

  // API 모드인데 API 키가 없는 경우
  if (aiSettings.mode === 'api' && !aiSettings.apiKey) {
    showNotification("API 키가 설정되지 않았습니다. 익스텐션 설정에서 API 키를 입력하세요.", "error", []);
    return;
  }

  // 이전 자동완성의 테두리 제거
  document.querySelectorAll('input, textarea, select').forEach(field => {
    field.style.border = '';
  });

  // 사용된 필드 초기화
  clearUsedFields();
  clearFilledFieldsList();

  try {
    // 1단계: AI가 페이지 분석하고 코드 생성
    showNotification("🤖 AI가 페이지를 분석하고 코드 생성 중...", "info", []);

    const result = await analyzePageWithAI(savedData, aiSettings);

    if (!result.code) {
      showNotification("AI가 코드를 생성하지 못했습니다.", "error", []);
      return;
    }

    // 2단계: AI가 생성한 코드 실행
    showNotification("⚡ 자동완성 실행 중...", "info", []);
    console.log('[Autofill] AI 생성 코드 실행');

    const execResult = await executeSafeCode(result.code);

    if (!execResult.success) {
      console.error('[Autofill] 코드 실행 실패:', execResult.error);
      showNotification(`코드 실행 오류: ${execResult.error}`, "error", []);
      return;
    }

    // 3단계: 실패 감지 및 피드백
    await new Promise(r => setTimeout(r, 1000)); // DOM 업데이트 대기

    const missedFields = detectMissedFields(savedData);

    if (missedFields.length === 0) {
      // 모든 필드 채워짐 - 성공
      showNotification("✅ 자동완성 완료!", "success", []);
    } else {
      // 일부 필드 실패 - 사용자에게 피드백
      console.log(`[Autofill] 채워지지 않은 필드 ${missedFields.length}개 발견:`, missedFields);
      showUserFeedback(missedFields);
    }

  } catch (error) {
    console.error('[Autofill] AI 자동완성 오류:', error);

    let errorMessage = "자동완성 중 오류가 발생했습니다.";
    if (error.message.includes('Chrome AI')) {
      errorMessage = "Chrome AI를 사용할 수 없습니다. API 모드를 사용하거나 Chrome 127 이상으로 업데이트하세요.";
    } else if (error.message.includes('API')) {
      errorMessage = "OpenAI API 오류가 발생했습니다. API 키와 크레딧을 확인하세요.";
    }

    showNotification(errorMessage, "error", []);
  }
}

/**
 * 채워지지 않은 필드 감지
 * @param {Object} userData - 사용자 데이터
 * @returns {Array<Object>} - 채워지지 않은 필드 목록 [{fieldName, expectedValue}, ...]
 */
function detectMissedFields(userData) {
  const missedFields = [];

  // 개인정보 필수 필드 체크
  if (userData.personalInfo) {
    const personalFields = [
      { key: 'name', label: '이름' },
      { key: 'phone', label: '전화번호' },
      { key: 'email', label: '이메일' },
      { key: 'gender', label: '성별' },
      { key: 'birthdate', label: '생년월일' },
      { key: 'address', label: '주소' },
      { key: 'nationality', label: '국적' },
      { key: 'militaryService', label: '병역사항' },
    ];

    personalFields.forEach(field => {
      if (userData.personalInfo[field.key]) {
        // 해당 필드가 페이지에 존재하는지, 채워졌는지 확인
        const isEmpty = isFieldEmpty(field.key, userData.personalInfo[field.key]);
        if (isEmpty) {
          missedFields.push({
            fieldName: field.label,
            expectedValue: formatValueForDisplay(userData.personalInfo[field.key])
          });
        }
      }
    });
  }

  // 학력 필드 체크
  if (userData.education) {
    if (userData.education.highschool?.name) {
      if (isFieldEmpty('highschool', userData.education.highschool.name)) {
        missedFields.push({
          fieldName: '고등학교',
          expectedValue: userData.education.highschool.name
        });
      }
    }
    if (userData.education.university?.name) {
      if (isFieldEmpty('university', userData.education.university.name)) {
        missedFields.push({
          fieldName: '대학교',
          expectedValue: userData.education.university.name
        });
      }
    }
  }

  // 경력 필드 체크
  if (userData.careers && userData.careers.length > 0) {
    const firstCareer = userData.careers[0];
    if (firstCareer.companyName) {
      if (isFieldEmpty('career', firstCareer.companyName)) {
        missedFields.push({
          fieldName: '경력 (회사명)',
          expectedValue: firstCareer.companyName
        });
      }
    }
  }

  return missedFields;
}

/**
 * 특정 필드가 페이지에서 비어있는지 확인
 * @param {string} fieldType - 필드 타입 (name, phone, email 등)
 * @param {*} expectedValue - 예상 값
 * @returns {boolean} - 비어있으면 true
 */
function isFieldEmpty(fieldType, expectedValue) {
  // 페이지의 모든 입력 필드 검색
  const inputs = Array.from(document.querySelectorAll('input, textarea, select'));

  // 필드 타입에 따른 키워드 매칭
  const keywords = getFieldKeywords(fieldType);
  const expectedString = String(expectedValue).toLowerCase();

  for (const input of inputs) {
    // name, id, placeholder, label 등에서 키워드 찾기
    const fieldName = (input.name || '').toLowerCase();
    const fieldId = (input.id || '').toLowerCase();
    const fieldPlaceholder = (input.placeholder || '').toLowerCase();
    const fieldLabel = getFieldLabel(input).toLowerCase();

    const fieldText = `${fieldName} ${fieldId} ${fieldPlaceholder} ${fieldLabel}`;

    // 키워드 매칭
    const hasKeyword = keywords.some(keyword => fieldText.includes(keyword));

    if (hasKeyword) {
      // 해당 필드가 비어있거나 기본값인 경우
      const currentValue = (input.value || '').toLowerCase().trim();

      if (!currentValue || currentValue === '' || currentValue === 'select' || currentValue === '선택') {
        return true; // 비어있음
      }

      // 값이 채워져 있으면 false 반환
      return false;
    }
  }

  // 필드를 찾지 못했으면 (DOM에 없음) 실패로 간주
  return true;
}

/**
 * 필드 타입에 따른 키워드 반환
 */
function getFieldKeywords(fieldType) {
  const keywordMap = {
    name: ['name', '이름', '성명', '성함'],
    phone: ['phone', 'tel', 'mobile', '전화', '연락처', '휴대폰'],
    email: ['email', '이메일', '메일'],
    gender: ['gender', 'sex', '성별'],
    birthdate: ['birth', 'birthday', '생년월일', '생일'],
    address: ['address', '주소', '거주지'],
    nationality: ['nationality', '국적'],
    militaryService: ['military', '병역', '군필'],
    highschool: ['highschool', 'high_school', '고등학교', '고교'],
    university: ['university', 'college', '대학교', '대학'],
    career: ['company', 'career', 'work', '회사', '경력', '근무'],
  };

  return keywordMap[fieldType] || [];
}

/**
 * input 요소의 label 텍스트 가져오기
 */
function getFieldLabel(input) {
  // label[for="id"] 찾기
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent || '';
  }

  // 부모 label 찾기
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent || '';

  // 이전 형제 label 찾기
  if (input.previousElementSibling?.tagName === 'LABEL') {
    return input.previousElementSibling.textContent || '';
  }

  return '';
}

/**
 * 값을 표시용으로 포맷팅
 */
function formatValueForDisplay(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value).substring(0, 50); // 최대 50자
}

/**
 * 사용자에게 실패한 필드 피드백 표시
 * @param {Array<Object>} missedFields - 실패한 필드 목록
 */
function showUserFeedback(missedFields) {
  console.log('[Autofill] 사용자 피드백 표시:', missedFields);

  const fieldList = missedFields.map(f => `• ${f.fieldName}: ${f.expectedValue}`).join('\n');

  showNotification(
    `⚠️ 일부 필드를 자동으로 채우지 못했습니다.\n수동으로 입력이 필요한 필드 (${missedFields.length}개):\n\n${fieldList}`,
    "warning",
    []
  );
}

// Chrome 익스텐션 메시지 리스너
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "fillForm") {
    savedData = request.data;
    console.log('[Autofill] 데이터 수신:', savedData);

    // 자동완성 실행
    autoFillForm().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('[Autofill] 오류:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // 비동기 응답을 위해 true 반환
  }
});

console.log('[Autofill] V4 자동완성 스크립트 로드 완료 (완전 AI 자율 방식)');
