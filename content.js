// 입사지원 자동완성 익스텐션 - content.js

// 저장된 데이터
let savedData = null;

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", function () {
  loadSavedData();
});

// 저장된 데이터 불러오기
async function loadSavedData() {
  try {
    const result = await chrome.storage.local.get(["jobApplicationData"]);
    if (result.jobApplicationData) {
      savedData = result.jobApplicationData;
      createAutoFillButton();
    }
  } catch (error) {
    console.error("데이터 불러오기 오류:", error);
  }
}

// 자동완성 버튼 생성
function createAutoFillButton() {
  // 기존 버튼이 있다면 제거
  const existingButton = document.getElementById("auto-fill-button");
  if (existingButton) {
    existingButton.remove();
  }

  // 버튼 생성
  const button = document.createElement("button");
  button.id = "auto-fill-button";
  button.innerHTML = "📝 자동완성";
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #3498db;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // 버튼 호버 효과
  button.addEventListener("mouseenter", function () {
    this.style.background = "#2980b9";
    this.style.transform = "translateY(-2px)";
    this.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
  });

  button.addEventListener("mouseleave", function () {
    this.style.background = "#3498db";
    this.style.transform = "translateY(0)";
    this.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  });

  // 클릭 이벤트
  button.addEventListener("click", function () {
    autoFillForm();
  });

  document.body.appendChild(button);
}

// 자동완성 실행
function autoFillForm() {
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다.", "error");
    return;
  }

  let filledCount = 0;

  // 개인정보 자동완성
  if (savedData.personalInfo) {
    filledCount += fillPersonalInfo(savedData.personalInfo);
  }

  // 학력 자동완성
  if (savedData.education) {
    filledCount += fillEducation(savedData.education);
  }

  // 경력 자동완성
  if (savedData.careers) {
    filledCount += fillCareers(savedData.careers);
  }

  // 외부활동 자동완성
  if (savedData.activities) {
    filledCount += fillActivities(savedData.activities);
  }

  // 해외 경험 자동완성
  if (savedData.overseas) {
    filledCount += fillOverseas(savedData.overseas);
  }

  // 어학점수 자동완성
  if (savedData.languageScores) {
    filledCount += fillLanguageScores(savedData.languageScores);
  }

  // 자격증 자동완성
  if (savedData.certificates) {
    filledCount += fillCertificates(savedData.certificates);
  }

  // 장애사항, 보훈여부 자동완성
  if (savedData.disabilityVeteran) {
    filledCount += fillDisabilityVeteran(savedData.disabilityVeteran);
  }

  showNotification(`${filledCount}개 필드가 자동완성되었습니다!`, "success");
}

// 개인정보 자동완성
function fillPersonalInfo(personalInfo) {
  const mappings = [
    { data: personalInfo.name, keywords: ["이름", "name", "성명", "한글명"] },
    {
      data: personalInfo.birthdate,
      keywords: ["생년월일", "birth", "생일", "출생"],
    },
    {
      data: personalInfo.phone,
      keywords: ["전화번호", "phone", "연락처", "휴대폰"],
    },
    { data: personalInfo.password, keywords: ["비밀번호", "password", "pw"] },
    { data: personalInfo.gender, keywords: ["성별", "gender", "남녀"] },
    {
      data: personalInfo.nationality,
      keywords: ["국적", "nationality", "국가"],
    },
    {
      data: personalInfo.nameEnglish,
      keywords: ["영문명", "english", "영어이름"],
    },
    {
      data: personalInfo.nameChinese,
      keywords: ["한자명", "chinese", "한자이름"],
    },
    { data: personalInfo.email, keywords: ["이메일", "email", "메일"] },
    { data: personalInfo.address, keywords: ["주소", "address", "거주지"] },
    {
      data: personalInfo.militaryService,
      keywords: ["병역", "military", "군필", "미필"],
    },
  ];

  return fillFieldsByKeywords(mappings);
}

// 학력 자동완성
function fillEducation(education) {
  let filledCount = 0;

  // 고등학교
  if (education.highschool) {
    const highschoolMappings = [
      {
        data: education.highschool.name,
        keywords: ["고등학교", "highschool", "고교"],
      },
      {
        data: education.highschool.start,
        keywords: ["고등학교입학", "고교입학"],
      },
      {
        data: education.highschool.graduation,
        keywords: ["고등학교졸업", "고교졸업"],
      },
      {
        data: education.highschool.type,
        keywords: ["고등학교계열", "고교계열"],
      },
    ];
    filledCount += fillFieldsByKeywords(highschoolMappings);
  }

  // 대학교
  if (education.university) {
    const universityMappings = [
      {
        data: education.university.name,
        keywords: ["대학교", "university", "대학"],
      },
      {
        data: education.university.start,
        keywords: ["대학교입학", "대학입학"],
      },
      {
        data: education.university.graduation,
        keywords: ["대학교졸업", "대학졸업"],
      },
      {
        data: education.university.type,
        keywords: ["전공계열", "대학교계열", "대학계열"],
      },
      { data: education.university.major, keywords: ["전공", "major", "학과"] },
      { data: education.university.degree, keywords: ["학위", "degree"] },
      { data: education.university.gpa, keywords: ["학점", "gpa", "성적"] },
      {
        data: education.university.maxGpa,
        keywords: ["기준학점", "만점", "max"],
      },
    ];
    filledCount += fillFieldsByKeywords(universityMappings);
  }

  return filledCount;
}

// 경력 자동완성
function fillCareers(careers) {
  let filledCount = 0;

  careers.forEach((career, index) => {
    const careerMappings = [
      {
        data: career.career_company,
        keywords: ["회사명", "company", "근무회사"],
      },
      {
        data: career.career_department,
        keywords: ["소속", "부서", "department"],
      },
      {
        data: career.career_position,
        keywords: ["직급", "직책", "position", "담당"],
      },
      { data: career.career_start, keywords: ["재직시작", "입사", "start"] },
      { data: career.career_end, keywords: ["재직종료", "퇴사", "end"] },
      {
        data: career.career_description,
        keywords: ["담당업무", "업무내용", "description"],
      },
    ];

    filledCount += fillFieldsByKeywords(careerMappings, index);
  });

  return filledCount;
}

// 외부활동 자동완성
function fillActivities(activities) {
  let filledCount = 0;

  activities.forEach((activity, index) => {
    const activityMappings = [
      { data: activity.activity_type, keywords: ["활동분류", "분류", "type"] },
      {
        data: activity.activity_organization,
        keywords: ["기관", "장소", "organization"],
      },
      { data: activity.activity_start, keywords: ["활동시작", "시작연월"] },
      { data: activity.activity_end, keywords: ["활동종료", "종료연월"] },
      { data: activity.activity_name, keywords: ["활동명", "프로젝트명"] },
      {
        data: activity.activity_description,
        keywords: ["활동내용", "내용", "description"],
      },
    ];

    filledCount += fillFieldsByKeywords(activityMappings, index);
  });

  return filledCount;
}

// 해외 경험 자동완성
function fillOverseas(overseas) {
  let filledCount = 0;

  overseas.forEach((overseasItem, index) => {
    const overseasMappings = [
      { data: overseasItem.overseas_country, keywords: ["국가", "country"] },
      { data: overseasItem.overseas_purpose, keywords: ["목적", "purpose"] },
      { data: overseasItem.overseas_start, keywords: ["해외시작", "시작기간"] },
      { data: overseasItem.overseas_end, keywords: ["해외종료", "종료기간"] },
      {
        data: overseasItem.overseas_institution,
        keywords: ["기관", "학교명", "institution"],
      },
      {
        data: overseasItem.overseas_description,
        keywords: ["해외내용", "상세내용"],
      },
    ];

    filledCount += fillFieldsByKeywords(overseasMappings, index);
  });

  return filledCount;
}

// 어학점수 자동완성
function fillLanguageScores(languageScores) {
  let filledCount = 0;

  languageScores.forEach((score, index) => {
    const scoreMappings = [
      {
        data: score.language_test_type,
        keywords: ["어학시험", "test", "종류"],
      },
      { data: score.language_score, keywords: ["점수", "score", "점"] },
      { data: score.language_date, keywords: ["취득일", "date", "시험일"] },
      {
        data: score.language_expiry,
        keywords: ["만료일", "expiry", "유효기간"],
      },
    ];

    filledCount += fillFieldsByKeywords(scoreMappings, index);
  });

  return filledCount;
}

// 자격증 자동완성
function fillCertificates(certificates) {
  let filledCount = 0;

  certificates.forEach((certificate, index) => {
    const certificateMappings = [
      {
        data: certificate.certificate_name,
        keywords: ["자격증명", "certificate", "자격"],
      },
      {
        data: certificate.certificate_issuer,
        keywords: ["발급기관", "issuer", "기관"],
      },
      {
        data: certificate.certificate_registration_number,
        keywords: ["등록번호", "registration"],
      },
      {
        data: certificate.certificate_license_number,
        keywords: ["자격번호", "license"],
      },
      {
        data: certificate.certificate_date,
        keywords: ["취득일", "date", "발급일"],
      },
    ];

    filledCount += fillFieldsByKeywords(certificateMappings, index);
  });

  return filledCount;
}

// 장애사항, 보훈여부 자동완성
function fillDisabilityVeteran(disabilityVeteran) {
  const mappings = [
    {
      data: disabilityVeteran.disabilityStatus,
      keywords: ["장애사항", "disability"],
    },
    {
      data: disabilityVeteran.disabilityGrade,
      keywords: ["장애등급", "disability_grade"],
    },
    {
      data: disabilityVeteran.veteranStatus,
      keywords: ["보훈여부", "veteran"],
    },
    {
      data: disabilityVeteran.veteranGrade,
      keywords: ["보훈등급", "veteran_grade"],
    },
  ];

  return fillFieldsByKeywords(mappings);
}

// 키워드 기반 필드 채우기
function fillFieldsByKeywords(mappings, index = 0) {
  let filledCount = 0;

  mappings.forEach((mapping) => {
    if (!mapping.data) return;

    const field = findFieldByKeywords(mapping.keywords, index);
    if (field) {
      fillField(field, mapping.data);
      filledCount++;
    }
  });

  return filledCount;
}

// 키워드로 필드 찾기
function findFieldByKeywords(keywords, index = 0) {
  const allInputs = document.querySelectorAll("input, textarea, select");
  let foundFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;

    const fieldInfo = getFieldInfo(input);
    const matchScore = calculateMatchScore(fieldInfo, keywords);

    if (matchScore > 0) {
      foundFields.push({ element: input, score: matchScore });
    }
  });

  // 점수순으로 정렬하고 인덱스에 맞는 필드 반환
  foundFields.sort((a, b) => b.score - a.score);
  return foundFields[index] ? foundFields[index].element : null;
}

// 필드 정보 수집
function getFieldInfo(input) {
  const info = {
    id: input.id || "",
    name: input.name || "",
    placeholder: input.placeholder || "",
    className: input.className || "",
    type: input.type || "",
    value: input.value || "",
  };

  // 라벨 찾기
  const label = findLabel(input);
  if (label) {
    info.labelText = label.textContent || "";
  }

  // 부모 요소의 텍스트도 포함
  const parentText = input.closest("div, td, li")?.textContent || "";
  info.parentText = parentText;

  return info;
}

// 라벨 찾기
function findLabel(input) {
  // for 속성으로 연결된 라벨
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label;
  }

  // 부모 요소 내의 라벨
  const parent = input.closest("div, td, li");
  if (parent) {
    const label = parent.querySelector("label");
    if (label) return label;
  }

  // 이전 형제 요소가 라벨인 경우
  let prevSibling = input.previousElementSibling;
  while (prevSibling) {
    if (prevSibling.tagName === "LABEL") {
      return prevSibling;
    }
    prevSibling = prevSibling.previousElementSibling;
  }

  return null;
}

// 매치 점수 계산
function calculateMatchScore(fieldInfo, keywords) {
  let score = 0;
  const text =
    `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.parentText}`.toLowerCase();

  keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();

    // 정확한 매치
    if (text.includes(lowerKeyword)) {
      score += 10;
    }

    // 부분 매치
    if (lowerKeyword.includes(text) || text.includes(lowerKeyword)) {
      score += 5;
    }

    // 단어 단위 매치
    const words = text.split(/\s+/);
    words.forEach((word) => {
      if (word.includes(lowerKeyword) || lowerKeyword.includes(word)) {
        score += 2;
      }
    });
  });

  return score;
}

// 필드 채우기
function fillField(field, value) {
  if (!value) return;

  try {
    if (field.tagName === "SELECT") {
      // 셀렉트 박스
      const options = field.querySelectorAll("option");
      for (let option of options) {
        if (option.value === value || option.textContent.includes(value)) {
          field.value = option.value;
          break;
        }
      }
    } else if (field.type === "checkbox" || field.type === "radio") {
      // 체크박스/라디오 버튼
      if (field.value === value || field.value.includes(value)) {
        field.checked = true;
      }
    } else {
      // 텍스트 입력 필드
      field.value = value;
    }

    // 이벤트 트리거
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (error) {
    console.error("필드 채우기 오류:", error);
  }
}

// 알림 표시
function showNotification(message, type) {
  // 기존 알림 제거
  const existingNotification = document.getElementById(
    "auto-fill-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.id = "auto-fill-notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10001;
    background: ${type === "success" ? "#27ae60" : "#e74c3c"};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease;
  `;

  // 애니메이션 CSS 추가
  if (!document.getElementById("auto-fill-styles")) {
    const style = document.createElement("style");
    style.id = "auto-fill-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // 3초 후 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// 데이터 변경 감지 (popup에서 데이터가 변경되면 자동으로 업데이트)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.jobApplicationData) {
    savedData = changes.jobApplicationData.newValue;
    createAutoFillButton();
  }
});
