// 입사지원 자동완성 익스텐션 - popup.js

document.addEventListener("DOMContentLoaded", function () {
  // 저장 버튼 이벤트
  document.getElementById("save-btn").addEventListener("click", saveData);

  // 초기화 버튼 이벤트
  document.getElementById("clear-btn").addEventListener("click", clearData);

  // 동적 섹션 추가 버튼들
  document.getElementById("add-career").addEventListener("click", addCareer);
  document
    .getElementById("add-certificate")
    .addEventListener("click", addCertificate);
  document
    .getElementById("add-activity")
    .addEventListener("click", addActivity);
  document
    .getElementById("add-overseas")
    .addEventListener("click", addOverseas);
  document
    .getElementById("add-language-score")
    .addEventListener("click", addLanguageScore);

  // 페이지 로드 시 저장된 데이터 불러오기
  loadData();

  // 직접입력 기능 이벤트 리스너 추가
  setupCustomInputHandlers();

  // 병역사항 선택 이벤트 리스너 추가
  setupMilitaryServiceHandler();

  // 사진 업로드 미리보기 이벤트 리스너 추가
  setupPhotoPreview();

  // 이메일 도메인 선택 이벤트 리스너 추가
  setupEmailDomainHandler();
});

// 데이터 저장 함수
async function saveData() {
  try {
    const data = await collectFormData();
    await chrome.storage.local.set({ jobApplicationData: data });
    showMessage("데이터가 저장되었습니다!", "success");
  } catch (error) {
    console.error("저장 오류:", error);
    showMessage("저장 중 오류가 발생했습니다.", "error");
  }
}

// 데이터 불러오기 함수
async function loadData() {
  try {
    const result = await chrome.storage.local.get(["jobApplicationData"]);
    if (result.jobApplicationData) {
      populateForm(result.jobApplicationData);
      showMessage("데이터를 불러왔습니다!", "success");
    }
  } catch (error) {
    console.error("불러오기 오류:", error);
  }
}

// 폼 데이터 수집 함수
async function collectFormData() {
  // 사진 파일을 Base64로 변환
  const photoFile = document.getElementById("photo").files[0];
  let photoData = "";

  if (photoFile) {
    // 새로운 사진이 업로드된 경우
    photoData = await fileToBase64(photoFile);
  } else {
    // 새로운 사진이 없으면 기존 저장된 사진 유지
    const previewImg = document.getElementById("photo-preview-img");
    if (previewImg && previewImg.src && previewImg.src.startsWith("data:")) {
      photoData = previewImg.src;
    }
  }

  const data = {
    // 개인정보
    personalInfo: {
      name: document.getElementById("name").value,
      birthdate: {
        year: document.getElementById("birthdate_year").value,
        month: document.getElementById("birthdate_month").value,
        day: document.getElementById("birthdate_day").value,
      },
      phone: document.getElementById("phone").value,
      password: document.getElementById("password").value,
      photo: photoData,
      dateFormat: document.getElementById("date_format").value,
      gender: document.getElementById("gender").value,
      nationality: document.getElementById("nationality").value,
      nameEnglish: document.getElementById("name_english").value,
      nameChinese: document.getElementById("name_chinese").value,
      email: {
        id: document.getElementById("email_id").value,
        domain: document.getElementById("email_domain").value,
      },
      address: document.getElementById("address").value,
      militaryService: document.getElementById("military_service").value,
      militaryBranch: document.getElementById("military_branch")?.value || "",
      militaryRank: document.getElementById("military_rank")?.value || "",
      militaryEnlistmentDate: {
        year: document.getElementById("military_enlistment_year")?.value || "",
        month: document.getElementById("military_enlistment_month")?.value || "",
        day: document.getElementById("military_enlistment_day")?.value || "",
      },
      militaryDischargeDate: {
        year: document.getElementById("military_discharge_year")?.value || "",
        month: document.getElementById("military_discharge_month")?.value || "",
        day: document.getElementById("military_discharge_day")?.value || "",
      },
    },

    // 학력
    education: {
      highschool: {
        name: document.getElementById("highschool_name").value,
        start: {
          year: document.getElementById("highschool_start_year").value,
          month: document.getElementById("highschool_start_month").value,
          day: document.getElementById("highschool_start_day").value,
        },
        graduation: {
          year: document.getElementById("highschool_graduation_year").value,
          month: document.getElementById("highschool_graduation_month").value,
          day: document.getElementById("highschool_graduation_day").value,
        },
        type: getSelectValue("highschool_type", "highschool_type_custom"),
      },
      university: {
        name: document.getElementById("university_name").value,
        start: {
          year: document.getElementById("university_start_year").value,
          month: document.getElementById("university_start_month").value,
          day: document.getElementById("university_start_day").value,
        },
        graduation: {
          year: document.getElementById("university_graduation_year").value,
          month: document.getElementById("university_graduation_month").value,
          day: document.getElementById("university_graduation_day").value,
        },
        type: getSelectValue("university_type", "university_type_custom"),
        major: document.getElementById("university_major").value,
        degree: document.getElementById("university_degree").value,
        gpa: document.getElementById("university_gpa").value,
        maxGpa: document.getElementById("university_max_gpa").value,
      },
    },

    // 경력
    careers: collectDynamicData("career"),

    // 외부활동
    activities: collectDynamicData("activity"),

    // 해외 경험
    overseas: collectDynamicData("overseas"),

    // 어학점수
    languageScores: collectDynamicData("language-score"),

    // 자격증
    certificates: collectDynamicData("certificate"),

    // 장애사항, 보훈여부
    disabilityVeteran: {
      disabilityStatus: document.getElementById("disability_status").value,
      disabilityGrade: document.getElementById("disability_grade").value,
      veteranStatus: document.getElementById("veteran_status").value,
      veteranGrade: document.getElementById("veteran_grade").value,
    },
  };

  return data;
}

// 동적 섹션 데이터 수집 함수
function collectDynamicData(type) {
  const items = [];
  const container = document.getElementById(getContainerId(type));

  if (!container) return items;

  const elements = container.querySelectorAll(`.${type}-item`);

  elements.forEach((element) => {
    const item = {};
    const inputs = element.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      const className = input.className;
      if (className) {
        item[className] = input.value;
      }
    });

    items.push(item);
  });

  return items;
}

// 컨테이너 ID 반환 함수
function getContainerId(type) {
  const containerMap = {
    career: "careers-container",
    certificate: "certificates-container",
    activity: "activities-container",
    overseas: "overseas-container",
    "language-score": "language-scores-container",
  };

  return containerMap[type] || "";
}

// 폼에 데이터 채우기 함수
function populateForm(data) {
  // 개인정보
  if (data.personalInfo) {
    // 사진 처리
    if (data.personalInfo.photo) {
      const previewImg = document.getElementById("photo-preview-img");
      const previewDiv = document.getElementById("photo-preview");
      if (previewImg && previewDiv) {
        previewImg.src = data.personalInfo.photo;
        previewDiv.style.display = "block";
      }
    }

    // 일반 필드 처리
    const simpleFields = {
      name: "name",
      phone: "phone",
      password: "password",
      gender: "gender",
      nationality: "nationality",
      nameEnglish: "name_english",
      nameChinese: "name_chinese",
      address: "address",
      dateFormat: "date_format",
      militaryService: "military_service",
      militaryBranch: "military_branch",
      militaryRank: "military_rank",
    };

    Object.keys(simpleFields).forEach((key) => {
      const elementId = simpleFields[key];
      const element = document.getElementById(elementId);
      if (element && data.personalInfo[key]) {
        element.value = data.personalInfo[key];
      }
    });

    // 이메일 분리 필드 처리
    if (data.personalInfo.email) {
      if (typeof data.personalInfo.email === "object") {
        // 새로운 형식 (분리된 이메일)
        if (data.personalInfo.email.id) {
          document.getElementById("email_id").value = data.personalInfo.email.id;
        }
        if (data.personalInfo.email.domain) {
          document.getElementById("email_domain").value = data.personalInfo.email.domain;
        }
      } else {
        // 이전 형식 (통합 이메일) - 자동 분리
        const emailParts = data.personalInfo.email.split("@");
        if (emailParts.length === 2) {
          document.getElementById("email_id").value = emailParts[0];
          document.getElementById("email_domain").value = emailParts[1];
        }
      }
    }

    // 생년월일
    if (data.personalInfo.birthdate) {
      setDateFields("birthdate", data.personalInfo.birthdate);
    }

    // 병역 날짜
    if (data.personalInfo.militaryEnlistmentDate) {
      setDateFields("military_enlistment", data.personalInfo.militaryEnlistmentDate);
    }
    if (data.personalInfo.militaryDischargeDate) {
      setDateFields("military_discharge", data.personalInfo.militaryDischargeDate);
    }

    // 병역사항이 군필이면 상세 항목 표시
    if (data.personalInfo.militaryService === "군필") {
      const militaryDetails = document.getElementById("military_details");
      if (militaryDetails) militaryDetails.style.display = "block";
    }
  }

  // 학력
  if (data.education) {
    // 고등학교
    if (data.education.highschool) {
      const hs = data.education.highschool;
      if (hs.name) document.getElementById("highschool_name").value = hs.name;
      if (hs.type) setSelectValue("highschool_type", "highschool_type_custom", hs.type);
      if (hs.start) setDateFields("highschool_start", hs.start);
      if (hs.graduation) setDateFields("highschool_graduation", hs.graduation);
    }

    // 대학교
    if (data.education.university) {
      const uni = data.education.university;
      if (uni.name) document.getElementById("university_name").value = uni.name;
      if (uni.type) setSelectValue("university_type", "university_type_custom", uni.type);
      if (uni.major) document.getElementById("university_major").value = uni.major;
      if (uni.degree) document.getElementById("university_degree").value = uni.degree;
      if (uni.gpa) document.getElementById("university_gpa").value = uni.gpa;
      if (uni.maxGpa) document.getElementById("university_max_gpa").value = uni.maxGpa;
      if (uni.start) setDateFields("university_start", uni.start);
      if (uni.graduation) setDateFields("university_graduation", uni.graduation);
    }
  }

  // 동적 섹션들
  populateDynamicData("career", data.careers);
  populateDynamicData("certificate", data.certificates);
  populateDynamicData("activity", data.activities);
  populateDynamicData("overseas", data.overseas);
  populateDynamicData("language-score", data.languageScores);

  // 장애사항, 보훈여부
  if (data.disabilityVeteran) {
    Object.keys(data.disabilityVeteran).forEach((key) => {
      const element = document.getElementById(key);
      if (element) element.value = data.disabilityVeteran[key];
    });
  }
}

// 동적 섹션 데이터 채우기 함수
function populateDynamicData(type, items) {
  if (!items || items.length === 0) return;

  const container = document.getElementById(getContainerId(type));
  if (!container) return;

  // 기존 항목들 제거 (첫 번째 제외)
  const existingItems = container.querySelectorAll(`.${type}-item`);
  for (let i = 1; i < existingItems.length; i++) {
    existingItems[i].remove();
  }

  // 첫 번째 항목에 데이터 채우기
  if (items[0]) {
    const firstItem = existingItems[0];
    if (firstItem) {
      Object.keys(items[0]).forEach((key) => {
        const input = firstItem.querySelector(`.${key}`);
        if (input) input.value = items[0][key];
      });
    }
  }

  // 추가 항목들 생성
  for (let i = 1; i < items.length; i++) {
    addDynamicItem(type, items[i]);
  }
}

// 동적 항목 추가 함수
function addDynamicItem(type, data = {}) {
  const container = document.getElementById(getContainerId(type));
  if (!container) return;

  const count = container.querySelectorAll(`.${type}-item`).length + 1;
  const template = getItemTemplate(type, count);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = template;
  const newItem = tempDiv.firstElementChild;

  // 데이터 채우기
  if (data) {
    Object.keys(data).forEach((key) => {
      const input = newItem.querySelector(`.${key}`);
      if (input) input.value = data[key];
    });
  }

  container.appendChild(newItem);
}

// 항목 템플릿 반환 함수
function getItemTemplate(type, count) {
  const templates = {
    career: `
      <div class="career-item">
        <h3>경력 ${count}</h3>
        <div class="form-group">
          <label>회사명</label>
          <input type="text" class="career_company" placeholder="○○회사" />
        </div>
        <div class="form-group">
          <label>소속입력값</label>
          <input type="text" class="career_department" placeholder="개발팀" />
        </div>
        <div class="form-group">
          <label>직급/직책 입력값</label>
          <input type="text" class="career_position" placeholder="백엔드 개발자" />
        </div>
        <div class="form-group">
          <label>재직기간 (시작)</label>
          <div class="date-group">
            <input type="text" class="career_start_year" placeholder="년" maxlength="4" />
            <input type="text" class="career_start_month" placeholder="월" maxlength="2" />
            <input type="text" class="career_start_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>재직기간 (종료)</label>
          <div class="date-group">
            <input type="text" class="career_end_year" placeholder="년" maxlength="4" />
            <input type="text" class="career_end_month" placeholder="월" maxlength="2" />
            <input type="text" class="career_end_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>담당업무</label>
          <textarea class="career_description" placeholder="주요 담당 업무를 입력하세요"></textarea>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    certificate: `
      <div class="certificate-item">
        <h3>자격증 ${count}</h3>
        <div class="form-group">
          <label>자격증명</label>
          <input type="text" class="certificate_name" placeholder="정보처리기사" />
        </div>
        <div class="form-group">
          <label>발급기관</label>
          <input type="text" class="certificate_issuer" placeholder="한국산업인력공단" />
        </div>
        <div class="form-group">
          <label>등록번호</label>
          <input type="text" class="certificate_registration_number" placeholder="12345678" />
        </div>
        <div class="form-group">
          <label>자격번호</label>
          <input type="text" class="certificate_license_number" placeholder="2024-123456" />
        </div>
        <div class="form-group">
          <label>취득일</label>
          <div class="date-group">
            <input type="text" class="certificate_date_year" placeholder="년" maxlength="4" />
            <input type="text" class="certificate_date_month" placeholder="월" maxlength="2" />
            <input type="text" class="certificate_date_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    activity: `
      <div class="activity-item">
        <h3>활동 ${count}</h3>
        <div class="form-group">
          <label>분류</label>
          <select class="activity_type">
            <option value="">선택하세요</option>
            <option value="수상">수상</option>
            <option value="교육">교육</option>
            <option value="프로젝트">프로젝트</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div class="form-group">
          <label>기관/장소</label>
          <input type="text" class="activity_organization" placeholder="○○기관" />
        </div>
        <div class="form-group">
          <label>시작년월일</label>
          <div class="date-group">
            <input type="text" class="activity_start_year" placeholder="년" maxlength="4" />
            <input type="text" class="activity_start_month" placeholder="월" maxlength="2" />
            <input type="text" class="activity_start_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>종료년월일</label>
          <div class="date-group">
            <input type="text" class="activity_end_year" placeholder="년" maxlength="4" />
            <input type="text" class="activity_end_month" placeholder="월" maxlength="2" />
            <input type="text" class="activity_end_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>활동명</label>
          <input type="text" class="activity_name" placeholder="○○프로젝트" />
        </div>
        <div class="form-group">
          <label>활동 내용</label>
          <textarea class="activity_description" placeholder="활동 내용을 입력하세요"></textarea>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    overseas: `
      <div class="overseas-item">
        <h3>해외 경험 ${count}</h3>
        <div class="form-group">
          <label>국가</label>
          <input type="text" class="overseas_country" placeholder="미국" />
        </div>
        <div class="form-group">
          <label>목적</label>
          <select class="overseas_purpose">
            <option value="">선택하세요</option>
            <option value="유학">유학</option>
            <option value="어학연수">어학연수</option>
            <option value="교환학생">교환학생</option>
            <option value="인턴십">인턴십</option>
            <option value="여행">여행</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div class="form-group">
          <label>기간 (시작)</label>
          <div class="date-group">
            <input type="text" class="overseas_start_year" placeholder="년" maxlength="4" />
            <input type="text" class="overseas_start_month" placeholder="월" maxlength="2" />
            <input type="text" class="overseas_start_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>기간 (종료)</label>
          <div class="date-group">
            <input type="text" class="overseas_end_year" placeholder="년" maxlength="4" />
            <input type="text" class="overseas_end_month" placeholder="월" maxlength="2" />
            <input type="text" class="overseas_end_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>기관/학교명</label>
          <input type="text" class="overseas_institution" placeholder="○○대학교" />
        </div>
        <div class="form-group">
          <label>상세 내용</label>
          <textarea class="overseas_description" placeholder="해외 경험 상세 내용을 입력하세요"></textarea>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    "language-score": `
      <div class="language-score-item">
        <h3>어학점수 ${count}</h3>
        <div class="form-group">
          <label>어학시험 종류</label>
          <select class="language_test_type">
            <option value="">선택하세요</option>
            <option value="TOEIC">TOEIC</option>
            <option value="TOEFL">TOEFL</option>
            <option value="IELTS">IELTS</option>
            <option value="OPIc">OPIc</option>
            <option value="TEPS">TEPS</option>
            <option value="JLPT">JLPT</option>
            <option value="HSK">HSK</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div class="form-group">
          <label>점수</label>
          <input type="text" class="language_score" placeholder="850" />
        </div>
        <div class="form-group">
          <label>취득일</label>
          <div class="date-group">
            <input type="text" class="language_date_year" placeholder="년" maxlength="4" />
            <input type="text" class="language_date_month" placeholder="월" maxlength="2" />
            <input type="text" class="language_date_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <div class="form-group">
          <label>만료일 (해당시)</label>
          <div class="date-group">
            <input type="text" class="language_expiry_year" placeholder="년" maxlength="4" />
            <input type="text" class="language_expiry_month" placeholder="월" maxlength="2" />
            <input type="text" class="language_expiry_day" placeholder="일" maxlength="2" />
          </div>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
  };

  return templates[type] || "";
}

// 동적 섹션 추가 함수들
function addCareer() {
  addDynamicItem("career");
  attachRemoveListeners();
}

function addCertificate() {
  addDynamicItem("certificate");
  attachRemoveListeners();
}

function addActivity() {
  addDynamicItem("activity");
  attachRemoveListeners();
}

function addOverseas() {
  addDynamicItem("overseas");
  attachRemoveListeners();
}

function addLanguageScore() {
  addDynamicItem("language-score");
  attachRemoveListeners();
}

// 삭제 버튼 이벤트 리스너 추가
function attachRemoveListeners() {
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", function () {
      this.closest(
        ".career-item, .certificate-item, .activity-item, .overseas-item, .language-score-item"
      ).remove();
    });
  });
}

// 데이터 초기화 함수
async function clearData() {
  if (confirm("모든 데이터를 삭제하시겠습니까?")) {
    try {
      await chrome.storage.local.clear();

      // 폼 초기화
      document
        .querySelectorAll("input, textarea, select")
        .forEach((element) => {
          if (element.type === "file") {
            element.value = "";
          } else {
            element.value = "";
          }
        });

      // 동적 섹션 초기화 (첫 번째 항목만 남기고 삭제)
      [
        "career",
        "certificate",
        "activity",
        "overseas",
        "language-score",
      ].forEach((type) => {
        const container = document.getElementById(getContainerId(type));
        if (container) {
          const items = container.querySelectorAll(`.${type}-item`);
          for (let i = 1; i < items.length; i++) {
            items[i].remove();
          }
        }
      });

      showMessage("데이터가 초기화되었습니다!", "success");
    } catch (error) {
      console.error("초기화 오류:", error);
      showMessage("초기화 중 오류가 발생했습니다.", "error");
    }
  }
}

// 메시지 표시 함수
function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;

  setTimeout(() => {
    messageDiv.textContent = "";
    messageDiv.className = "message";
  }, 3000);
}

// 날짜 필드 설정 헬퍼 함수
function setDateFields(prefix, dateObj) {
  if (!dateObj) return;

  if (dateObj.year) {
    const yearEl = document.getElementById(`${prefix}_year`);
    if (yearEl) yearEl.value = dateObj.year;
  }
  if (dateObj.month) {
    const monthEl = document.getElementById(`${prefix}_month`);
    if (monthEl) monthEl.value = dateObj.month;
  }
  if (dateObj.day) {
    const dayEl = document.getElementById(`${prefix}_day`);
    if (dayEl) dayEl.value = dateObj.day;
  }
}

// 셀렉트 박스 값 가져오기 (직접입력 포함)
function getSelectValue(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const customInput = document.getElementById(customInputId);

  if (!select) return "";

  if (select.value === "직접입력" && customInput) {
    return customInput.value;
  }

  return select.value;
}

// 셀렉트 박스 값 설정 (직접입력 포함)
function setSelectValue(selectId, customInputId, value) {
  const select = document.getElementById(selectId);
  const customInput = document.getElementById(customInputId);

  if (!select || !value) return;

  // 옵션 목록에서 값 찾기
  const options = select.querySelectorAll("option");
  let found = false;

  for (let option of options) {
    if (option.value === value) {
      select.value = value;
      found = true;
      break;
    }
  }

  // 옵션에 없으면 직접입력으로 설정
  if (!found && customInput) {
    select.value = "직접입력";
    customInput.value = value;
    customInput.style.display = "block";
  }
}

// 이메일 도메인 선택 핸들러 설정
function setupEmailDomainHandler() {
  const domainSelect = document.getElementById("email_domain_select");
  const domainInput = document.getElementById("email_domain");

  if (domainSelect && domainInput) {
    domainSelect.addEventListener("change", function () {
      if (this.value) {
        domainInput.value = this.value;
      }
    });
  }
}

// 직접입력 기능 설정
function setupCustomInputHandlers() {
  // 고등학교 계열 직접입력
  const highschoolTypeSelect = document.getElementById("highschool_type");
  const highschoolTypeCustom = document.getElementById(
    "highschool_type_custom"
  );

  if (highschoolTypeSelect && highschoolTypeCustom) {
    highschoolTypeSelect.addEventListener("change", function () {
      if (this.value === "직접입력") {
        highschoolTypeCustom.style.display = "block";
        highschoolTypeCustom.focus();
      } else {
        highschoolTypeCustom.style.display = "none";
        highschoolTypeCustom.value = "";
      }
    });
  }

  // 대학교 계열 직접입력
  const universityTypeSelect = document.getElementById("university_type");
  const universityTypeCustom = document.getElementById(
    "university_type_custom"
  );

  if (universityTypeSelect && universityTypeCustom) {
    universityTypeSelect.addEventListener("change", function () {
      if (this.value === "직접입력") {
        universityTypeCustom.style.display = "block";
        universityTypeCustom.focus();
      } else {
        universityTypeCustom.style.display = "none";
        universityTypeCustom.value = "";
      }
    });
  }
}

// 파일을 Base64로 변환하는 함수
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// 사진 미리보기 설정
function setupPhotoPreview() {
  const photoInput = document.getElementById("photo");
  const photoPreviewDiv = document.getElementById("photo-preview");
  const photoPreviewImg = document.getElementById("photo-preview-img");
  const photoRemoveBtn = document.getElementById("photo-remove");

  if (photoInput) {
    photoInput.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          photoPreviewImg.src = base64;
          photoPreviewDiv.style.display = "block";
        } catch (error) {
          console.error("사진 미리보기 오류:", error);
        }
      }
    });
  }

  if (photoRemoveBtn) {
    photoRemoveBtn.addEventListener("click", function () {
      photoInput.value = "";
      photoPreviewDiv.style.display = "none";
      photoPreviewImg.src = "";
    });
  }
}

// 병역사항 선택 핸들러
function setupMilitaryServiceHandler() {
  const militaryServiceSelect = document.getElementById("military_service");
  const militaryDetails = document.getElementById("military_details");

  if (militaryServiceSelect && militaryDetails) {
    militaryServiceSelect.addEventListener("change", function () {
      if (this.value === "군필") {
        militaryDetails.style.display = "block";
      } else {
        militaryDetails.style.display = "none";
        // 상세 항목 초기화
        document.getElementById("military_branch").value = "";
        document.getElementById("military_rank").value = "";
        document.getElementById("military_enlistment_date").value = "";
        document.getElementById("military_discharge_date").value = "";
      }
    });
  }
}

// 페이지 로드 시 삭제 버튼 이벤트 리스너 추가
document.addEventListener("DOMContentLoaded", function () {
  attachRemoveListeners();
});
