// 동적 섹션 관리 함수들 (경력, 자격증, 활동, 해외경험, 어학점수)

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
