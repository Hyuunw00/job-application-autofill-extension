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
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = data[key];
        } else {
          input.value = data[key];
        }
      }
    });
  }

  container.appendChild(newItem);

  // 경력 항목에 재직중 체크박스 이벤트 추가
  if (type === 'career') {
    setupCareerCurrentCheckbox(newItem);
  }
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
          <label>고용형태</label>
          <input type="text" class="career_employment_type" placeholder="예: 정규직, 계약직, 파견직, 인턴" />
        </div>
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" class="career_is_current" />
            <span>재직중</span>
          </label>
        </div>
        <div class="form-group">
          <label>입사일</label>
          <input type="text" class="career_start_date" placeholder="2020-03-01" />
        </div>
        <div class="form-group career-end-date-group">
          <label>퇴사일</label>
          <input type="text" class="career_end_date" placeholder="2023-02-28" />
        </div>
        <div class="form-group">
          <label>담당업무</label>
          <textarea class="career_description" placeholder="주요 담당 업무를 입력하세요"></textarea>
        </div>
        <div class="form-group">
          <label>퇴직사유</label>
          <input type="text" class="career_resignation_reason" placeholder="예: 이직, 계약만료, 개인사정" />
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
          <input type="text" class="certificate_date" placeholder="2023-06-15" />
        </div>
        <div class="form-group">
          <label>만료일 (해당시)</label>
          <input type="text" class="certificate_expiry_date" placeholder="2026-06-15" />
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    project: `
      <div class="project-item">
        <h3>프로젝트 ${count}</h3>
        <div class="form-group">
          <label>프로젝트명</label>
          <input type="text" class="project_name" placeholder="○○프로젝트" />
        </div>
        <div class="form-group">
          <label>기관/장소</label>
          <input type="text" class="project_organization" placeholder="○○기관" />
        </div>
        <div class="form-group">
          <label>시작일</label>
          <input type="text" class="project_start_date" placeholder="2020-03-01" />
        </div>
        <div class="form-group">
          <label>종료일</label>
          <input type="text" class="project_end_date" placeholder="2020-12-31" />
        </div>
        <div class="form-group">
          <label>프로젝트 내용</label>
          <textarea class="project_description" placeholder="프로젝트 내용을 입력하세요"></textarea>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    award: `
      <div class="award-item">
        <h3>수상 ${count}</h3>
        <div class="form-group">
          <label>수상명</label>
          <input type="text" class="award_name" placeholder="○○상" />
        </div>
        <div class="form-group">
          <label>수여기관</label>
          <input type="text" class="award_organization" placeholder="○○기관" />
        </div>
        <div class="form-group">
          <label>수상일</label>
          <input type="text" class="award_date" placeholder="2020-06-15" />
        </div>
        <div class="form-group">
          <label>수상 내용</label>
          <textarea class="award_description" placeholder="수상 내용을 입력하세요"></textarea>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    activity: `
      <div class="activity-item">
        <h3>활동 ${count}</h3>
        <div class="form-group">
          <label>활동명</label>
          <input type="text" class="activity_name" placeholder="○○활동" />
        </div>
        <div class="form-group">
          <label>기관/장소</label>
          <input type="text" class="activity_organization" placeholder="○○기관" />
        </div>
        <div class="form-group">
          <label>시작일</label>
          <input type="text" class="activity_start_date" placeholder="2020-03-01" />
        </div>
        <div class="form-group">
          <label>종료일</label>
          <input type="text" class="activity_end_date" placeholder="2020-12-31" />
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
          <input type="text" class="overseas_purpose" placeholder="예: 유학, 어학연수, 교환학생, 인턴십" />
        </div>
        <div class="form-group">
          <label>시작일</label>
          <input type="text" class="overseas_start_date" placeholder="2020-01-01" />
        </div>
        <div class="form-group">
          <label>종료일</label>
          <input type="text" class="overseas_end_date" placeholder="2020-12-31" />
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
          <input type="text" class="language_test_type" placeholder="예: TOEIC, TOEFL, IELTS, OPIc" />
        </div>
        <div class="form-group">
          <label>점수</label>
          <input type="text" class="language_score" placeholder="850" />
        </div>
        <div class="form-group">
          <label>회화수준</label>
          <input type="text" class="language_speaking_level" placeholder="예: 상, 중, 하" />
        </div>
        <div class="form-group">
          <label>취득일</label>
          <input type="text" class="language_date" placeholder="2023-01-15" />
        </div>
        <div class="form-group">
          <label>만료일 (해당시)</label>
          <input type="text" class="language_expiry_date" placeholder="2025-01-15" />
        </div>
        <div class="form-group">
          <label>등록번호</label>
          <input type="text" class="language_registration_number" placeholder="등록번호" />
        </div>
        <div class="form-group">
          <label>자격번호</label>
          <input type="text" class="language_license_number" placeholder="자격번호" />
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    education: `
      <div class="education-item">
        <h3>교육 ${count}</h3>
        <div class="form-group">
          <label>교육명</label>
          <input type="text" class="education_name" placeholder="예: AI 실무과정" />
        </div>
        <div class="form-group">
          <label>교육기관</label>
          <input type="text" class="education_organization" placeholder="예: 한국산업인력공단" />
        </div>
        <div class="form-group">
          <label>교육시작일</label>
          <input type="text" class="education_start_date" placeholder="2023-01-01" />
        </div>
        <div class="form-group">
          <label>교육종료일</label>
          <input type="text" class="education_end_date" placeholder="2023-06-30" />
        </div>
        <div class="form-group">
          <label>교육시간</label>
          <input type="text" class="education_hours" placeholder="예: 120시간" />
        </div>
        <div class="form-group">
          <label>활동내용</label>
          <textarea class="education_description" placeholder="교육 활동 내용을 입력하세요"></textarea>
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    "computer-skill": `
      <div class="computer-skill-item">
        <h3>컴퓨터활용능력 ${count}</h3>
        <div class="form-group">
          <label>활용능력</label>
          <input type="text" class="computer_skill_type" placeholder="예: QA, 언어, 그래픽, 공학용, 기타" />
        </div>
        <div class="form-group">
          <label>프로그램명</label>
          <input type="text" class="computer_skill_program" placeholder="예: Python, Photoshop, AutoCAD" />
        </div>
        <div class="form-group">
          <label>활용수준</label>
          <input type="text" class="computer_skill_level" placeholder="예: 특급, 고급, 중급, 초급, 입문" />
        </div>
        <div class="form-group">
          <label>사용기간</label>
          <input type="text" class="computer_skill_duration" placeholder="예: 3년, 6개월" />
        </div>
        <button type="button" class="btn-danger remove-item" style="margin-top: 10px;">삭제</button>
      </div>
    `,
    "language-skill": `
      <div class="language-skill-item">
        <h3>외국어활용능력 ${count}</h3>
        <div class="form-group">
          <label>외국어</label>
          <input type="text" class="language_skill_language" placeholder="예: 영어, 중국어, 일본어" />
        </div>
        <div class="form-group">
          <label>회화수준</label>
          <input type="text" class="language_skill_speaking" placeholder="예: Lv1, Lv2, Lv3, Lv4, Lv5" />
        </div>
        <div class="form-group">
          <label>작문수준</label>
          <input type="text" class="language_skill_writing" placeholder="예: Lv1, Lv2, Lv3, Lv4, Lv5" />
        </div>
        <div class="form-group">
          <label>독해수준</label>
          <input type="text" class="language_skill_reading" placeholder="예: Lv1, Lv2, Lv3, Lv4, Lv5" />
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

function addProject() {
  addDynamicItem("project");
  attachRemoveListeners();
}

function addAward() {
  addDynamicItem("award");
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

function addCertificate() {
  addDynamicItem("certificate");
  attachRemoveListeners();
}

function addEducation() {
  addDynamicItem("education");
  attachRemoveListeners();
}

function addComputerSkill() {
  addDynamicItem("computer-skill");
  attachRemoveListeners();
}

function addLanguageSkill() {
  addDynamicItem("language-skill");
  attachRemoveListeners();
}

// 삭제 버튼 이벤트 리스너 추가
function attachRemoveListeners() {
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", function () {
      this.closest(
        ".career-item, .project-item, .award-item, .activity-item, .overseas-item, .language-score-item, .certificate-item, .education-item, .computer-skill-item, .language-skill-item"
      ).remove();
    });
  });
}

// 경력 재직중 체크박스 설정
function setupCareerCurrentCheckbox(careerItem) {
  const checkbox = careerItem.querySelector('.career_is_current');
  const endDateGroup = careerItem.querySelector('.career-end-date-group');
  const endDateInput = careerItem.querySelector('.career_end_date');

  if (checkbox && endDateGroup && endDateInput) {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        // 재직중이면 퇴사일 비활성화
        endDateInput.disabled = true;
        endDateInput.value = '';
        endDateGroup.classList.add('disabled');
        endDateGroup.style.opacity = '0.5';
      } else {
        // 재직중 아니면 퇴사일 활성화
        endDateInput.disabled = false;
        endDateGroup.classList.remove('disabled');
        endDateGroup.style.opacity = '1';
      }
    });

    // 초기 상태 설정
    if (checkbox.checked) {
      endDateInput.disabled = true;
      endDateGroup.classList.add('disabled');
      endDateGroup.style.opacity = '0.5';
    }
  }
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
        "project",
        "award",
        "activity",
        "overseas",
        "language-score",
        "certificate",
        "education",
        "computer-skill",
        "language-skill",
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
