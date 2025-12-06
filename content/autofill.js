// 자동완성 메인 로직 (V4: 완전 AI 자율 방식 + 실패 필드 보조)

// 저장된 데이터 (전역 변수)
let savedData = null;

// 실패한 필드 정보 (드롭다운용)
let failedFieldsInfo = [];

// AI 추천 캐시 (필드별 suggestions)
let suggestionsCache = new Map();

// 자동완성 실행
async function autoFillForm() {
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다.", "error", []);
    return;
  }

  // AI 설정 확인
  const aiSettings = savedData.aiSettings || {
    mode: "api",
    model: "gpt-4o-mini",
  };
  // console.log('[Autofill] AI 설정:', aiSettings);

  // API 모드인데 API 키가 없는 경우
  if (aiSettings.mode === "api" && !aiSettings.apiKey) {
    showNotification(
      "API 키가 설정되지 않았습니다. 익스텐션 설정에서 API 키를 입력하세요.",
      "error",
      []
    );
    return;
  }

  // 이전 자동완성의 테두리 제거
  document.querySelectorAll("input, textarea, select").forEach((field) => {
    field.style.border = "";
  });

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
    console.log("[Autofill] AI 생성 코드 실행");

    const execResult = await executeSafeCode(result.code);

    if (!execResult.success) {
      console.error("[Autofill] 코드 실행 실패:", execResult.error);
      showNotification(`코드 실행 오류: ${execResult.error}`, "error", []);
      return;
    }

    // 3단계: AI가 실패 필드 감지 + 제안값 생성
    await new Promise((r) => setTimeout(r, 1000)); // DOM 업데이트 대기

    showNotification("🔍 채워지지 않은 필드 분석 중...", "info", []);

    const aiAnalysis = await analyzeFailedFieldsWithAI(savedData, aiSettings);

    if (!aiAnalysis || aiAnalysis.length === 0) {
      // 모든 필드 채워짐 - 성공
      showNotification("✅ 자동완성 완료!", "success", []);
    } else {
      console.log(`[Autofill] AI가 감지한 미완성 필드:`, aiAnalysis);

      // AI 분석 결과로 필드 마킹 및 제안 캐시
      failedFieldsInfo = aiAnalysis;
      markFailedFieldsFromAI(aiAnalysis);
      cacheAISuggestions(aiAnalysis);

      // 드롭다운 이벤트 바인딩
      setupFailedFieldDropdowns();

      showUserFeedbackFromAI(aiAnalysis);
    }
  } catch (error) {
    console.error("[Autofill] AI 자동완성 오류:", error);

    let errorMessage = "자동완성 중 오류가 발생했습니다.";
    if (error.message.includes("Chrome AI")) {
      errorMessage =
        "Chrome AI를 사용할 수 없습니다. API 모드를 사용하거나 Chrome 127 이상으로 업데이트하세요.";
    } else if (error.message.includes("API")) {
      errorMessage =
        "OpenAI API 오류가 발생했습니다. API 키와 크레딧을 확인하세요.";
    }

    showNotification(errorMessage, "error", []);
  }
}

// ============================================
// [DEPRECATED] 아래 함수들은 더 이상 사용되지 않음
// AI 기반 감지로 대체됨 (analyzeFailedFieldsWithAI)
// ============================================

/*
function detectMissedFields(userData) {
  const missedFields = [];
  const allInputs = Array.from(
    document.querySelectorAll("input, textarea, select")
  );

  allInputs.forEach((input) => {
    if (["hidden", "submit", "button", "reset", "file"].includes(input.type))
      return;

    if (input.type === "radio" || input.type === "checkbox") {
      if (input.type === "radio" && input.name) {
        const group = document.querySelectorAll(`input[name="${input.name}"]`);
        const anyChecked = Array.from(group).some((r) => r.checked);
        if (anyChecked) return;
      } else if (input.checked) {
        return;
      }
    } else {
      const currentValue = (input.value || "").trim();
      if (currentValue && currentValue !== "" && currentValue !== "선택")
        return;
    }

    const fieldInfo = extractFieldInfo(input);
    if (fieldInfo.label || fieldInfo.placeholder || fieldInfo.name) {
      missedFields.push({
        element: input,
        fieldInfo: fieldInfo,
      });
    }
  });

  return missedFields;
}

function extractFieldInfo(input) {
  return {
    tagName: input.tagName.toLowerCase(),
    type: input.type || "",
    name: input.name || "",
    id: input.id || "",
    placeholder: input.placeholder || "",
    label: getFieldLabel(input),
    className: input.className || "",
    options:
      input.tagName === "SELECT"
        ? Array.from(input.options)
            .map((o) => o.text)
            .slice(0, 20)
        : [],
  };
}

function isFieldEmpty(fieldType) {
  const inputs = Array.from(
    document.querySelectorAll("input, textarea, select")
  );
  const keywords = getFieldKeywords(fieldType);

  for (const input of inputs) {
    const fieldName = (input.name || "").toLowerCase();
    const fieldId = (input.id || "").toLowerCase();
    const fieldPlaceholder = (input.placeholder || "").toLowerCase();
    const fieldLabel = getFieldLabel(input).toLowerCase();
    const fieldText = `${fieldName} ${fieldId} ${fieldPlaceholder} ${fieldLabel}`;
    const hasKeyword = keywords.some((keyword) => fieldText.includes(keyword));

    if (hasKeyword) {
      const currentValue = (input.value || "").toLowerCase().trim();
      if (
        !currentValue ||
        currentValue === "" ||
        currentValue === "select" ||
        currentValue === "선택"
      ) {
        return true;
      }
      return false;
    }
  }
  return true;
}

function getFieldKeywords(fieldType) {
  const keywordMap = {
    name: ["name", "이름", "성명", "성함"],
    phone: ["phone", "tel", "mobile", "전화", "연락처", "휴대폰"],
    email: ["email", "이메일", "메일"],
    gender: ["gender", "sex", "성별"],
    birthdate: ["birth", "birthday", "생년월일", "생일"],
    address: ["address", "주소", "거주지"],
    nationality: ["nationality", "국적"],
    militaryService: ["military", "병역", "군필"],
    highschool: ["highschool", "high_school", "고등학교", "고교"],
    university: ["university", "college", "대학교", "대학"],
    career: ["company", "career", "work", "회사", "경력", "근무"],
  };
  return keywordMap[fieldType] || [];
}
*/

/**
 * input 요소의 label 텍스트 가져오기
 */
function getFieldLabel(input) {
  // label[for="id"] 찾기
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent || "";
  }

  // 부모 label 찾기
  const parentLabel = input.closest("label");
  if (parentLabel) return parentLabel.textContent || "";

  // 이전 형제 label 찾기
  if (input.previousElementSibling?.tagName === "LABEL") {
    return input.previousElementSibling.textContent || "";
  }

  return "";
}

/**
 * 값을 표시용으로 포맷팅
 */
function formatValueForDisplay(value) {
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value).substring(0, 50); // 최대 50자
}

/**
 * 사용자에게 실패한 필드 피드백 표시 + 재분석 버튼
 * @param {Array<Object>} missedFields - 실패한 필드 목록
 */
function showUserFeedback(missedFields) {
  console.log("[Autofill] 사용자 피드백 표시:", missedFields);

  const fieldList = missedFields
    .slice(0, 5) // 최대 5개만 표시
    .map((f) => {
      const label =
        f.fieldInfo?.label ||
        f.fieldInfo?.placeholder ||
        f.fieldInfo?.name ||
        "알 수 없음";
      return `• ${label}`;
    })
    .join("\n");

  const moreText = missedFields.length > 5 ? `\n• ...외 ${missedFields.length - 5}개` : "";

  showNotificationWithReanalyze(
    `⚠️ ${missedFields.length}개 필드를 자동으로 채우지 못했습니다.`,
    `빨간 테두리 필드를 클릭하면 AI가 추천값을 제안합니다.\n\n${fieldList}${moreText}`,
    "warning"
  );
}

/**
 * 재분석 버튼이 포함된 알림 표시
 */
function showNotificationWithReanalyze(title, message, type) {
  // 기존 알림 제거
  const existing = document.getElementById("auto-fill-notification");
  if (existing) existing.remove();

  const backgroundColor = type === "warning" ? "#f39c12" : "#3498db";

  const notification = document.createElement("div");
  notification.id = "auto-fill-notification";
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10001;
    background: ${backgroundColor};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 400px;
    white-space: pre-wrap;
  `;

  // 헤더 (제목 + 닫기)
  const header = document.createElement("div");
  header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: bold;";
  header.innerHTML = `<span>${title}</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = "background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.8;";
  closeBtn.onclick = () => notification.remove();
  header.appendChild(closeBtn);
  notification.appendChild(header);

  // 메시지
  const msgDiv = document.createElement("div");
  msgDiv.style.cssText = "font-size: 13px; margin-bottom: 16px; line-height: 1.5;";
  msgDiv.textContent = message;
  notification.appendChild(msgDiv);

  // 안내 메시지
  const tipDiv = document.createElement("div");
  tipDiv.style.cssText = "font-size: 12px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 4px; margin-bottom: 12px;";
  tipDiv.innerHTML = "💡 <b>동적 필드</b>(경력 추가, 학력 추가 등)가 있다면<br>먼저 모두 펼친 후 아래 버튼을 눌러주세요.";
  notification.appendChild(tipDiv);

  // 재분석 버튼
  const reanalyzeBtn = document.createElement("button");
  reanalyzeBtn.textContent = "🔄 새 필드 재분석";
  reanalyzeBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 4px;
    color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
  `;
  reanalyzeBtn.onmouseover = () => reanalyzeBtn.style.background = "rgba(255,255,255,0.3)";
  reanalyzeBtn.onmouseout = () => reanalyzeBtn.style.background = "rgba(255,255,255,0.2)";
  reanalyzeBtn.onclick = () => {
    notification.remove();
    reanalyzeNewFields();
  };
  notification.appendChild(reanalyzeBtn);

  document.body.appendChild(notification);
}

/**
 * 새 필드 재분석 (전체 DOM 다시 분석)
 */
async function reanalyzeNewFields() {
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다.", "error", []);
    return;
  }

  showNotification("🔄 새 필드 분석 중...", "info", []);

  // 기존 자동완성 로직 재실행
  await autoFillForm();
}

// Chrome 익스텐션 메시지 리스너
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "fillForm") {
    savedData = request.data;
    console.log("[Autofill] 데이터 수신:", savedData);

    // 확인 알림 표시 후 자동완성 실행
    showPreFillConfirmation()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("[Autofill] 오류:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // 비동기 응답을 위해 true 반환
  }
});

/**
 * 자동완성 전 확인 알림 표시
 */
function showPreFillConfirmation() {
  // 데이터 없으면 바로 에러 표시
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다. 팝업에서 정보를 먼저 저장해주세요.", "error", []);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // 기존 알림 제거
    const existing = document.getElementById("auto-fill-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.id = "auto-fill-notification";
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10001;
      background: #3498db;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 400px;
    `;

    // 제목
    const title = document.createElement("div");
    title.style.cssText = "font-weight: bold; margin-bottom: 12px; font-size: 15px;";
    title.textContent = "🤖 자동완성을 시작할까요?";
    notification.appendChild(title);

    // 안내 메시지
    const tipDiv = document.createElement("div");
    tipDiv.style.cssText = "font-size: 13px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 4px; margin-bottom: 16px; line-height: 1.5;";
    tipDiv.innerHTML = "💡 <b>동적 필드</b>(경력 추가, 학력 추가 등)가 있다면<br>먼저 모두 펼친 후 시작해주세요.";
    notification.appendChild(tipDiv);

    // 버튼 컨테이너
    const btnContainer = document.createElement("div");
    btnContainer.style.cssText = "display: flex; gap: 8px;";

    // 시작 버튼
    const startBtn = document.createElement("button");
    startBtn.textContent = "✓ 시작";
    startBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: rgba(255,255,255,0.25);
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
    `;
    startBtn.onclick = async () => {
      notification.remove();
      try {
        await autoFillForm();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    btnContainer.appendChild(startBtn);

    // 취소 버튼
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "✕ 취소";
    cancelBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: rgba(0,0,0,0.2);
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      cursor: pointer;
    `;
    cancelBtn.onclick = () => {
      notification.remove();
      resolve();
    };
    btnContainer.appendChild(cancelBtn);

    notification.appendChild(btnContainer);
    document.body.appendChild(notification);
  });
}

console.log("[Autofill] V4 자동완성 스크립트 로드 완료 (완전 AI 자율 방식)");

// ============================================
// 실패 필드 보조 기능 (드롭다운 UI + AI 추천)
// ============================================

/**
 * 실패한 필드에 빨간 테두리 + data 속성 마킹
 */
function markFailedFields(missedFields) {
  missedFields.forEach((field, index) => {
    if (field.element) {
      field.element.style.border = "2px solid #e74c3c";
      field.element.style.boxShadow = "0 0 5px rgba(231, 76, 60, 0.5)";
      field.element.dataset.autofillFailed = "true";
      field.element.dataset.autofillIndex = index;
    }
  });
  console.log(`[Autofill] ${missedFields.length}개 실패 필드 마킹 완료`);
}

/**
 * 실패 필드에 드롭다운 이벤트 바인딩
 */
function setupFailedFieldDropdowns() {
  const failedFields = document.querySelectorAll(
    '[data-autofill-failed="true"]'
  );

  failedFields.forEach((field) => {
    // 기존 이벤트 제거 (중복 방지)
    field.removeEventListener("focus", handleFieldFocus);
    field.removeEventListener("blur", handleFieldBlur);

    // 새 이벤트 등록
    field.addEventListener("focus", handleFieldFocus);
    field.addEventListener("blur", handleFieldBlur);
  });

  console.log(
    `[Autofill] ${failedFields.length}개 필드에 드롭다운 이벤트 바인딩`
  );
}

/**
 * 필드 포커스 시 캐시된 추천 드롭다운 표시
 */
function handleFieldFocus(event) {
  const field = event.target;
  const fieldIndex = field.dataset.autofillIndex;

  console.log(
    "[Autofill] 필드 포커스, index:",
    fieldIndex,
    "타입:",
    typeof fieldIndex
  );
  console.log("[Autofill] 캐시 키 목록:", Array.from(suggestionsCache.keys()));

  // 캐시에서 추천값 가져오기
  const suggestions = suggestionsCache.get(fieldIndex);
  console.log("[Autofill] 찾은 suggestions:", suggestions);

  if (suggestions && suggestions.length > 0) {
    showDropdown(
      field,
      suggestions.map((s) => ({ value: s, isLoading: false }))
    );
  } else {
    showDropdown(field, [{ value: "추천할 값이 없습니다", isLoading: true }]);
  }
}

/**
 * 필드 블러 시 드롭다운 숨김 (약간의 딜레이)
 */
function handleFieldBlur() {
  // 드롭다운 클릭을 위해 약간의 딜레이
  setTimeout(() => {
    hideDropdown();
  }, 200);
}

/**
 * 모든 실패 필드에 대한 AI 추천을 한 번에 요청
 */
async function preloadAllSuggestions(missedFields, userData) {
  const aiSettings = userData?.aiSettings || {
    mode: "api",
    model: "gpt-4o-mini",
  };

  if (aiSettings.mode === "api" && !aiSettings.apiKey) {
    console.warn("[Autofill] API 키 없음, 추천 생략");
    return;
  }

  // 캐시 초기화
  suggestionsCache = new Map();

  // 필드 정보 배열 생성
  const fieldsInfo = missedFields.map((f, index) => ({
    index: String(index),
    ...f.fieldInfo,
  }));

  const prompt = generateBatchSuggestionPrompt(fieldsInfo, userData);

  try {
    let response;
    if (aiSettings.mode === "api") {
      response = await callOpenAIForSuggestion(prompt, aiSettings);
    } else {
      response = await callChromeAIForSuggestion(prompt);
    }

    console.log("[Autofill] AI 추천 응답:", response);

    const result = parseBatchSuggestionResponse(response);
    console.log("[Autofill] 파싱 결과:", result);

    // 캐시에 저장
    if (result) {
      Object.entries(result).forEach(([index, suggestions]) => {
        suggestionsCache.set(index, suggestions);
      });
    }

    console.log("[Autofill] 추천 캐시 완료:", suggestionsCache.size, "개 필드");
  } catch (error) {
    console.error("[Autofill] 일괄 추천 요청 실패:", error);
  }
}

/**
 * 일괄 추천 요청용 프롬프트 생성
 */
function generateBatchSuggestionPrompt(fieldsInfo, userData) {
  const userInfo = prepareUserInfo(userData);

  const fieldsDescription = fieldsInfo
    .map(
      (f) => `
[Field ${f.index}]
- Tag: ${f.tagName}
- Type: ${f.type}
- Name: ${f.name}
- ID: ${f.id}
- Placeholder: ${f.placeholder}
- Label: ${f.label}
${f.options?.length > 0 ? `- Options: ${f.options.join(", ")}` : ""}`
    )
    .join("\n");

  return `You are a form-filling assistant. Suggest appropriate values for each field.

=== FIELDS ===
${fieldsDescription}

=== USER DATA ===
${JSON.stringify(userInfo, null, 2)}

=== CRITICAL MATCHING RULES ===
You MUST match fields to the CORRECT data based on the field's meaning:

- 생년월일/birthdate/birth → ONLY use 개인정보.생년월일
- 성별/gender/sex → ONLY use 개인정보.성별
- 이름/name → ONLY use 개인정보.이름, 영문명, 한자명
- 이메일/email → ONLY use 개인정보.이메일
- 전화/phone/mobile → ONLY use 개인정보.전화번호
- 입대일/enlistment → ONLY use 개인정보.입대일
- 전역일/discharge → ONLY use 개인정보.전역일
- 입학일/admission → Use appropriate 학력 dates
- 졸업일/graduation → Use appropriate 학력 dates
- 입사일/career start → Use 경력 시작일
- 퇴사일/career end → Use 경력 종료일

DO NOT mix up dates! A birthdate field should NEVER show military or career dates.

=== FORMAT VARIATIONS ===
- Dates: provide multiple formats (2025-10-12, 2025.10.12, 2025/10/12)
- Names: provide variations (Korean, English)
- Select fields: match from provided options

=== RESPONSE FORMAT ===
Return JSON only:
{
  "0": ["value1", "value2"],
  "1": ["value1"]
}`;
}

/**
 * 일괄 추천 응답 파싱
 */
function parseBatchSuggestionResponse(response) {
  try {
    // JSON 객체 추출
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      // 각 값이 배열인지 확인
      const validated = {};
      Object.entries(result).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          validated[key] = value
            .filter((v) => v && typeof v === "string")
            .slice(0, 5);
        }
      });
      return validated;
    }
    return null;
  } catch (error) {
    console.error("[Autofill] 일괄 추천 파싱 오류:", error);
    return null;
  }
}

/**
 * OpenAI API 호출 (추천용 - 간단한 요청)
 */
async function callOpenAIForSuggestion(prompt, aiSettings) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that suggests form field values. Always respond with a JSON array only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Chrome AI 호출 (추천용)
 */
async function callChromeAIForSuggestion(prompt) {
  if (!window.ai || !window.ai.languageModel) {
    throw new Error("Chrome AI를 사용할 수 없습니다");
  }

  const session = await window.ai.languageModel.create({
    temperature: 0.1,
    topK: 1,
  });

  return await session.prompt(prompt);
}

// ============================================
// 드롭다운 UI
// ============================================

let currentDropdown = null;

/**
 * 드롭다운 표시
 */
function showDropdown(targetField, items) {
  hideDropdown(); // 기존 드롭다운 제거

  const dropdown = document.createElement("div");
  dropdown.id = "autofill-suggestion-dropdown";
  dropdown.style.cssText = `
    position: absolute;
    z-index: 10002;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-height: 200px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;

  // 위치 계산
  const rect = targetField.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY + 2}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.minWidth = `${rect.width}px`;

  // 항목 추가
  items.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.style.cssText = `
      padding: 10px 12px;
      cursor: ${item.isLoading ? "default" : "pointer"};
      border-bottom: 1px solid #eee;
      color: ${item.isLoading ? "#999" : "#333"};
      font-style: ${item.isLoading ? "italic" : "normal"};
    `;
    itemEl.textContent = item.value;

    if (!item.isLoading) {
      itemEl.addEventListener("mouseenter", () => {
        itemEl.style.background = "#f5f5f5";
      });
      itemEl.addEventListener("mouseleave", () => {
        itemEl.style.background = "white";
      });
      itemEl.addEventListener("mousedown", (e) => {
        e.preventDefault(); // blur 방지
        fillFieldWithValue(targetField, item.value);
        hideDropdown();
      });
    }

    dropdown.appendChild(itemEl);
  });

  document.body.appendChild(dropdown);
  currentDropdown = dropdown;
}

/**
 * 드롭다운 숨김
 */
function hideDropdown() {
  if (currentDropdown) {
    currentDropdown.remove();
    currentDropdown = null;
  }
}

/**
 * 필드에 값 입력 + 이벤트 발생
 */
function fillFieldWithValue(field, value) {
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));

  // 성공 표시 (테두리 변경)
  field.style.border = "2px solid #27ae60";
  field.style.boxShadow = "0 0 5px rgba(39, 174, 96, 0.5)";
  field.dataset.autofillFailed = "false";

  console.log(`[Autofill] 필드 입력 완료: ${value}`);
}

// ============================================
// AI 기반 실패 필드 감지 및 제안
// ============================================

/**
 * AI가 DOM을 분석하여 채워지지 않은 필드 감지 + 제안값 생성
 */
async function analyzeFailedFieldsWithAI(userData, aiSettings) {
  const pageDOM = extractPageDOMForAnalysis();
  const userInfo = prepareUserInfo(userData);

  const prompt = `You are analyzing a form page to find UNFILLED fields and suggest values.

=== CURRENT PAGE HTML ===
${pageDOM}

=== USER DATA ===
${JSON.stringify(userInfo, null, 2)}

=== TASK ===
1. Find all form fields that are EMPTY or not properly filled (including custom UI components like date pickers, custom selects, etc.)
2. For each unfilled field, suggest appropriate values from user data
3. Provide a CSS selector to identify each field

=== CRITICAL MATCHING RULES ===
- 생년월일/birthdate → ONLY use 개인정보.생년월일
- 성별/gender → ONLY use 개인정보.성별
- 병역/military → ONLY use 개인정보.병역사항, 군별, 계급, etc.
- 이름/name → ONLY use 개인정보.이름
- Match dates to their CORRECT context (birth dates, military dates, career dates are DIFFERENT)

=== RESPONSE FORMAT ===
Return JSON array only:
[
  {
    "selector": "CSS selector to find the element",
    "label": "Field name/label in Korean",
    "suggestions": ["suggestion1", "suggestion2"]
  }
]

If all fields are filled, return empty array: []

Return JSON only:`;

  try {
    let response;
    if (aiSettings.mode === "api") {
      response = await callOpenAIForSuggestion(prompt, aiSettings);
    } else {
      response = await callChromeAIForSuggestion(prompt);
    }

    console.log("[Autofill] AI 실패 필드 분석 응답:", response);

    // JSON 파싱
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.filter(item => item.selector && item.suggestions?.length > 0);
    }
    return [];
  } catch (error) {
    console.error("[Autofill] AI 실패 필드 분석 오류:", error);
    return [];
  }
}

/**
 * 분석용 DOM 추출 (간소화)
 */
function extractPageDOMForAnalysis() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('script, style, svg, img').forEach(el => el.remove());
  let html = clone.innerHTML;

  // 크기 제한
  if (html.length > 50000) {
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      html = Array.from(forms).map(f => f.outerHTML).join('\n');
    }
    if (html.length > 50000) {
      html = html.substring(0, 50000) + '\n...(truncated)';
    }
  }
  return html;
}

/**
 * AI 분석 결과로 필드 마킹
 */
function markFailedFieldsFromAI(aiAnalysis) {
  aiAnalysis.forEach((item, index) => {
    try {
      const element = document.querySelector(item.selector);
      if (element) {
        element.style.border = "2px solid #e74c3c";
        element.style.boxShadow = "0 0 5px rgba(231, 76, 60, 0.5)";
        element.dataset.autofillFailed = "true";
        element.dataset.autofillIndex = index;
        item.element = element; // 참조 저장
      }
    } catch (e) {
      console.warn(`[Autofill] 셀렉터 오류: ${item.selector}`, e);
    }
  });
  console.log(`[Autofill] ${aiAnalysis.length}개 실패 필드 마킹 완료 (AI 기반)`);
}

/**
 * AI 제안값을 캐시에 저장
 */
function cacheAISuggestions(aiAnalysis) {
  suggestionsCache = new Map();
  aiAnalysis.forEach((item, index) => {
    if (item.suggestions && item.suggestions.length > 0) {
      suggestionsCache.set(String(index), item.suggestions);
    }
  });
  console.log(`[Autofill] ${suggestionsCache.size}개 필드 제안 캐시 완료`);
}

/**
 * AI 분석 결과 기반 사용자 피드백
 */
function showUserFeedbackFromAI(aiAnalysis) {
  const fieldList = aiAnalysis
    .slice(0, 5)
    .map((item) => `• ${item.label}`)
    .join("\n");

  const moreText = aiAnalysis.length > 5 ? `\n• ...외 ${aiAnalysis.length - 5}개` : "";

  showNotificationWithReanalyze(
    `⚠️ ${aiAnalysis.length}개 필드를 자동으로 채우지 못했습니다.`,
    `빨간 테두리 필드를 클릭하면 AI가 추천값을 제안합니다.\n\n${fieldList}${moreText}`,
    "warning"
  );
}
