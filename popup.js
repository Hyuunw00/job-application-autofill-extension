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
    photoData = await fileToBase64(photoFile);
  }

  const data = {
    // 개인정보
    personalInfo: {
      name: document.getElementById("name").value,
      birthdate: document.getElementById("birthdate").value,
      phone: document.getElementById("phone").value,
      password: document.getElementById("password").value,
      photo: photoData,
      dateFormat: document.getElementById("date_format").value,
      gender: document.getElementById("gender").value,
      nationality: document.getElementById("nationality").value,
      nameEnglish: document.getElementById("name_english").value,
      nameChinese: document.getElementById("name_chinese").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      militaryService: document.getElementById("military_service").value,
      militaryBranch: document.getElementById("military_branch")?.value || "",
      militaryRank: document.getElementById("military_rank")?.value || "",
      militaryEnlistmentDate:
        document.getElementById("military_enlistment_date")?.value || "",
      militaryDischargeDate:
        document.getElementById("military_discharge_date")?.value || "",
    },

    // 학력
    education: {
      highschool: {
        name: document.getElementById("highschool_name").value,
        start: document.getElementById("highschool_start").value,
        graduation: document.getElementById("highschool_graduation").value,
        type: getSelectValue("highschool_type", "highschool_type_custom"),
      },
      university: {
        name: document.getElementById("university_name").value,
        start: document.getElementById("university_start").value,
        graduation: document.getElementById("university_graduation").value,
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
    Object.keys(data.personalInfo).forEach((key) => {
      // 사진은 별도 처리
      if (key === "photo") {
        if (data.personalInfo[key]) {
          const previewImg = document.getElementById("photo-preview-img");
          const previewDiv = document.getElementById("photo-preview");
          if (previewImg && previewDiv) {
            previewImg.src = data.personalInfo[key];
            previewDiv.style.display = "block";
          }
        }
        return;
      }

      let elementId = key;
      if (key === "nameEnglish") elementId = "name_english";
      else if (key === "nameChinese") elementId = "name_chinese";
      else if (key === "dateFormat") elementId = "date_format";
      else if (key === "militaryService") elementId = "military_service";
      else if (key === "militaryBranch") elementId = "military_branch";
      else if (key === "militaryRank") elementId = "military_rank";
      else if (key === "militaryEnlistmentDate")
        elementId = "military_enlistment_date";
      else if (key === "militaryDischargeDate")
        elementId = "military_discharge_date";

      const element = document.getElementById(elementId);
      if (element) element.value = data.personalInfo[key];
    });

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
      Object.keys(data.education.highschool).forEach((key) => {
        if (key === "type") {
          setSelectValue(
            "highschool_type",
            "highschool_type_custom",
            data.education.highschool[key]
          );
        } else {
          const element = document.getElementById(`highschool_${key}`);
          if (element) element.value = data.education.highschool[key];
        }
      });
    }

    // 대학교
    if (data.education.university) {
      Object.keys(data.education.university).forEach((key) => {
        if (key === "type") {
          setSelectValue(
            "university_type",
            "university_type_custom",
            data.education.university[key]
          );
        } else {
          const element = document.getElementById(`university_${key}`);
          if (element) element.value = data.education.university[key];
        }
      });
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
          <input type="text" class="career_start" placeholder="2015-03" />
        </div>
        <div class="form-group">
          <label>재직기간 (종료)</label>
          <input type="text" class="career_end" placeholder="2020-12 (재직중인 경우 비워두기)" />
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
          <input type="text" class="certificate_date" placeholder="2014-08" />
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
          <label>시작연월</label>
          <input type="text" class="activity_start" placeholder="2020-01" />
        </div>
        <div class="form-group">
          <label>종료연월</label>
          <input type="text" class="activity_end" placeholder="2020-12" />
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
          <input type="text" class="overseas_start" placeholder="2018-03" />
        </div>
        <div class="form-group">
          <label>기간 (종료)</label>
          <input type="text" class="overseas_end" placeholder="2018-12" />
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
          <input type="text" class="language_date" placeholder="2020-06" />
        </div>
        <div class="form-group">
          <label>만료일 (해당시)</label>
          <input type="text" class="language_expiry" placeholder="2022-06" />
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
