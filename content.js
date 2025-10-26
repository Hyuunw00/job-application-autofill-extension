// 입사지원 자동완성 익스텐션 - content.js

// 저장된 데이터
let savedData = null;

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", function () {
  loadSavedData();
});

// 페이지 로드 완료 후에도 버튼 생성 (DOMContentLoaded 이후에 로드된 경우)
if (document.readyState === "complete" || document.readyState === "interactive") {
  loadSavedData();
}

// 저장된 데이터 불러오기
async function loadSavedData() {
  try {
    const result = await chrome.storage.local.get(["jobApplicationData"]);
    if (result.jobApplicationData) {
      savedData = result.jobApplicationData;
    }
    // 데이터 유무와 관계없이 항상 버튼 표시
    createAutoFillButton();
  } catch (error) {
    console.error("데이터 불러오기 오류:", error);
    // 에러가 발생해도 버튼은 표시
    createAutoFillButton();
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

// 이미 사용된 필드 추적용 전역 Set
let usedFields = new Set();
// 채워진 필드 목록 추적
let filledFieldsList = [];

// 자동완성 실행
function autoFillForm() {
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다.", "error", []);
    return;
  }

  // 사용된 필드 초기화
  usedFields.clear();
  filledFieldsList = [];

  let filledCount = 0;
  let errorCount = 0;

  // 개인정보 자동완성
  if (savedData.personalInfo) {
    try {
      filledCount += fillPersonalInfo(savedData.personalInfo);
    } catch (error) {
      console.error("개인정보 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 학력 자동완성
  if (savedData.education) {
    try {
      filledCount += fillEducation(savedData.education);
    } catch (error) {
      console.error("학력 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 경력 자동완성
  if (savedData.careers) {
    try {
      filledCount += fillCareers(savedData.careers);
    } catch (error) {
      console.error("경력 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 외부활동 자동완성
  if (savedData.activities) {
    try {
      filledCount += fillActivities(savedData.activities);
    } catch (error) {
      console.error("외부활동 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 해외 경험 자동완성
  if (savedData.overseas) {
    try {
      filledCount += fillOverseas(savedData.overseas);
    } catch (error) {
      console.error("해외 경험 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 어학점수 자동완성
  if (savedData.languageScores) {
    try {
      filledCount += fillLanguageScores(savedData.languageScores);
    } catch (error) {
      console.error("어학점수 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 자격증 자동완성
  if (savedData.certificates) {
    try {
      filledCount += fillCertificates(savedData.certificates);
    } catch (error) {
      console.error("자격증 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 장애사항, 보훈여부 자동완성
  if (savedData.disabilityVeteran) {
    try {
      filledCount += fillDisabilityVeteran(savedData.disabilityVeteran);
    } catch (error) {
      console.error("장애사항/보훈여부 자동완성 오류:", error);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    showNotification(
      `${filledCount}개 필드 자동완성 (${errorCount}개 섹션 오류)`,
      "success",
      filledFieldsList
    );
  } else {
    showNotification(
      `${filledCount}개 필드가 자동완성되었습니다!`,
      "success",
      filledFieldsList
    );
  }
}

// 날짜 형식 변환 함수
function formatDate(dateObj, format) {
  if (!dateObj) return "";

  // 문자열로 저장된 이전 데이터 호환성 처리
  if (typeof dateObj === "string") {
    return dateObj; // 이전 형식 그대로 반환
  }

  // dateObj가 객체가 아니면 빈 문자열 반환
  if (typeof dateObj !== "object") return "";

  const { year, month, day } = dateObj;

  // 년도가 없으면 빈 문자열
  if (!year) return "";

  // 월을 2자리로 패딩
  const paddedMonth = month ? String(month).padStart(2, "0") : "";

  // 일을 2자리로 패딩
  const paddedDay = day ? String(day).padStart(2, "0") : "";

  // 날짜 구분자 결정
  let separator = "";
  if (format === "hyphen") {
    separator = "-";
  } else if (format === "dot") {
    separator = ".";
  }

  // 년월일 조합
  if (day && paddedDay) {
    // YYYY-MM-DD 형식
    if (separator) {
      return `${year}${separator}${paddedMonth}${separator}${paddedDay}`;
    } else {
      return `${year}${paddedMonth}${paddedDay}`;
    }
  } else if (month && paddedMonth) {
    // YYYY-MM 형식
    if (separator) {
      return `${year}${separator}${paddedMonth}`;
    } else {
      return `${year}${paddedMonth}`;
    }
  } else {
    // YYYY만
    return year;
  }
}

// 개인정보 자동완성
function fillPersonalInfo(personalInfo) {
  const dateFormat = personalInfo.dateFormat || "hyphen";

  const mappings = [
    { data: personalInfo.name, keywords: ["이름", "name", "성명", "한글명"] },
    {
      data: formatDate(personalInfo.birthdate, dateFormat),
      keywords: ["생년월일", "birth", "생일", "출생"],
    },
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
    { data: personalInfo.address, keywords: ["주소", "address", "거주지"] },
    {
      data: personalInfo.militaryService,
      keywords: ["병역", "military", "군필", "미필"],
    },
  ];

  let filledCount = fillFieldsByKeywords(mappings);

  // 비밀번호 필드 처리 (2개까지 허용 - 비밀번호 + 비밀번호 확인)
  if (personalInfo.password) {
    try {
      const passwordKeywords = ["비밀번호", "password", "pw", "passwd"];

      // 첫 번째 비밀번호 필드
      const passwordField1 = findFieldByKeywords(passwordKeywords, 0);
      if (passwordField1) {
        fillField(passwordField1, personalInfo.password);
        filledCount++;
      }

      // 두 번째 비밀번호 필드 (비밀번호 확인)
      const passwordField2 = findFieldByKeywords(passwordKeywords, 1);
      if (passwordField2) {
        fillField(passwordField2, personalInfo.password);
        filledCount++;
      }
    } catch (error) {
      console.error("비밀번호 입력 오류:", error);
    }
  }

  // 전화번호 분리 필드 처리
  if (personalInfo.phone) {
    try {
      const phoneResult = fillPhoneNumber(personalInfo.phone, ["phone", "휴대폰", "핸드폰", "연락처"]);
      if (phoneResult > 0) filledCount += phoneResult;
    } catch (error) {
      console.error("전화번호 입력 오류:", error);
    }
  }

  // 이메일 분리 필드 처리
  if (personalInfo.email) {
    try {
      const emailResult = fillEmailAddress(personalInfo.email, ["email", "이메일", "메일"]);
      if (emailResult > 0) filledCount += emailResult;
    } catch (error) {
      console.error("이메일 입력 오류:", error);
    }
  }

  // 사진 파일 자동 첨부
  if (personalInfo.photo) {
    try {
      fillPhotoFields(personalInfo.photo);
      filledCount++;
    } catch (error) {
      console.error("사진 첨부 오류:", error);
    }
  }

  return filledCount;
}

// 학력 자동완성
function fillEducation(education) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  // 고등학교
  if (education.highschool) {
    const highschoolMappings = [
      {
        data: education.highschool.name,
        keywords: ["고등학교", "highschool", "고교"],
      },
      {
        data: formatDate(education.highschool.start, dateFormat),
        keywords: ["고등학교입학", "고교입학"],
      },
      {
        data: formatDate(education.highschool.graduation, dateFormat),
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
        data: formatDate(education.university.start, dateFormat),
        keywords: ["대학교입학", "대학입학"],
      },
      {
        data: formatDate(education.university.graduation, dateFormat),
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
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

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
      {
        data: formatDate(career.career_start, dateFormat),
        keywords: ["재직시작", "입사", "start"],
      },
      {
        data: formatDate(career.career_end, dateFormat),
        keywords: ["재직종료", "퇴사", "end"],
      },
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
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  activities.forEach((activity, index) => {
    const activityMappings = [
      { data: activity.activity_type, keywords: ["활동분류", "분류", "type"] },
      {
        data: activity.activity_organization,
        keywords: ["기관", "장소", "organization"],
      },
      {
        data: formatDate(activity.activity_start, dateFormat),
        keywords: ["활동시작", "시작연월"],
      },
      {
        data: formatDate(activity.activity_end, dateFormat),
        keywords: ["활동종료", "종료연월"],
      },
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
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  overseas.forEach((overseasItem, index) => {
    const overseasMappings = [
      { data: overseasItem.overseas_country, keywords: ["국가", "country"] },
      { data: overseasItem.overseas_purpose, keywords: ["목적", "purpose"] },
      {
        data: formatDate(overseasItem.overseas_start, dateFormat),
        keywords: ["해외시작", "시작기간"],
      },
      {
        data: formatDate(overseasItem.overseas_end, dateFormat),
        keywords: ["해외종료", "종료기간"],
      },
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
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  languageScores.forEach((score, index) => {
    const scoreMappings = [
      {
        data: score.language_test_type,
        keywords: ["어학시험", "test", "종류"],
      },
      { data: score.language_score, keywords: ["점수", "score", "점"] },
      {
        data: formatDate(score.language_date, dateFormat),
        keywords: ["취득일", "date", "시험일"],
      },
      {
        data: formatDate(score.language_expiry, dateFormat),
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
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

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
        data: formatDate(certificate.certificate_date, dateFormat),
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
    try {
      if (!mapping.data) return;

      const field = findFieldByKeywords(mapping.keywords, index);
      if (field) {
        fillField(field, mapping.data);
        filledCount++;
      }
    } catch (error) {
      console.error("필드 매칭 오류:", mapping.keywords, error);
    }
  });

  return filledCount;
}

// 키워드로 필드 찾기
function findFieldByKeywords(keywords, index = 0) {
  const allInputs = document.querySelectorAll("input, textarea, select");
  let foundFields = [];

  allInputs.forEach((input) => {
    // hidden과 disabled만 제외 (readonly는 fillField에서 처리)
    if (input.type === "hidden" || input.disabled) return;

    // 이미 사용된 필드는 건너뛰기
    if (usedFields.has(input)) return;

    const fieldInfo = getFieldInfo(input);
    const matchScore = calculateMatchScore(fieldInfo, keywords, input);

    // 최소 임계값 15점 이상만 후보로 추가 (정확도 향상)
    if (matchScore >= 15) {
      foundFields.push({ element: input, score: matchScore });
    }
  });

  // 점수순으로 정렬하고 인덱스에 맞는 필드 반환
  foundFields.sort((a, b) => {
    // 점수가 같으면 DOM 순서 우선 (먼저 나온 필드)
    if (b.score === a.score) {
      return 0;
    }
    return b.score - a.score;
  });

  const selectedField = foundFields[index] ? foundFields[index].element : null;

  // 선택된 필드를 사용된 필드 목록에 추가
  if (selectedField) {
    usedFields.add(selectedField);
  }

  return selectedField;
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
    autocomplete: input.autocomplete || "",
    ariaLabel: input.getAttribute("aria-label") || "",
    ariaLabelledBy: input.getAttribute("aria-labelledby") || "",
  };

  // aria-labelledby로 참조되는 요소 텍스트 가져오기
  if (info.ariaLabelledBy) {
    const labelElement = document.getElementById(info.ariaLabelledBy);
    if (labelElement) {
      info.ariaLabelText = labelElement.textContent || "";
    }
  }

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

// autocomplete 속성 매핑
const autocompleteMapping = {
  name: ["이름", "name", "성명", "한글명"],
  email: ["이메일", "email", "메일"],
  tel: ["전화번호", "phone", "연락처", "휴대폰"],
  "current-password": ["비밀번호", "password", "pw"],
  "new-password": ["비밀번호", "password", "pw"],
  password: ["비밀번호", "password", "pw"],
  "bday-year": ["생년월일", "birth", "생일", "출생"],
  "bday-month": ["생년월일", "birth", "생일", "출생"],
  "bday-day": ["생년월일", "birth", "생일", "출생"],
  bday: ["생년월일", "birth", "생일", "출생"],
  "address-line1": ["주소", "address", "거주지"],
  country: ["국적", "nationality", "국가"],
};

// 매치 점수 계산
function calculateMatchScore(fieldInfo, keywords, inputElement) {
  let score = 0;

  // 1. HTML5 autocomplete 속성 매칭 (최우선, 30점)
  if (fieldInfo.autocomplete && fieldInfo.autocomplete !== "off") {
    const autocompleteLower = fieldInfo.autocomplete.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();

      // autocomplete 매핑 확인
      for (const [autoKey, autoKeywords] of Object.entries(autocompleteMapping)) {
        if (autocompleteLower.includes(autoKey)) {
          if (autoKeywords.some(ak => lowerKeyword.includes(ak.toLowerCase()) || ak.toLowerCase().includes(lowerKeyword))) {
            score += 30;
            return;
          }
        }
      }

      // 직접 매칭
      if (autocompleteLower.includes(lowerKeyword) || lowerKeyword.includes(autocompleteLower)) {
        score += 30;
      }
    });
  }

  // 2. input type 매칭 (25점)
  const typeMapping = {
    email: ["이메일", "email", "메일"],
    tel: ["전화번호", "phone", "연락처", "휴대폰"],
    password: ["비밀번호", "password", "pw", "passwd"],
    date: ["날짜", "date", "일자"],
    url: ["웹사이트", "url", "링크"],
    number: ["점수", "score", "학점", "gpa"],
  };

  if (fieldInfo.type && typeMapping[fieldInfo.type]) {
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (typeMapping[fieldInfo.type].some(t => lowerKeyword.includes(t) || t.includes(lowerKeyword))) {
        score += 25;
      }
    });
  }

  // 3. ARIA 속성 매칭 (20점)
  const ariaText = `${fieldInfo.ariaLabel} ${fieldInfo.ariaLabelText || ""}`.toLowerCase();
  if (ariaText.trim()) {
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (ariaText.includes(lowerKeyword)) {
        score += 20;
      }
    });
  }

  // 4. label 텍스트 정확한 매칭 (15점)
  if (fieldInfo.labelText) {
    const labelLower = fieldInfo.labelText.toLowerCase().trim();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (labelLower === lowerKeyword || labelLower.includes(lowerKeyword)) {
        score += 15;
      }
    });
  }

  // 5. name, id 속성 매칭 (12점)
  const nameId = `${fieldInfo.id} ${fieldInfo.name}`.toLowerCase();
  keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    if (nameId.includes(lowerKeyword)) {
      score += 12;
    }
  });

  // 6. placeholder 매칭 (10점)
  if (fieldInfo.placeholder) {
    const placeholderLower = fieldInfo.placeholder.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (placeholderLower.includes(lowerKeyword)) {
        score += 10;
      }
    });
  }

  // 7. className 매칭 (8점)
  if (fieldInfo.className) {
    const classLower = fieldInfo.className.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (classLower.includes(lowerKeyword)) {
        score += 8;
      }
    });
  }

  // 8. 부모 텍스트 매칭 (1점으로 낮춤)
  if (fieldInfo.parentText) {
    const parentLower = fieldInfo.parentText.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (parentLower.includes(lowerKeyword)) {
        score += 1;
      }
    });
  }

  // 9. 이미 값이 채워진 필드는 점수 대폭 감점 (-50점)
  if (fieldInfo.value && fieldInfo.value.trim().length > 0) {
    score -= 50;
  }

  // 10. form 내부 필드에 가산점 (3점)
  if (inputElement.closest("form")) {
    score += 3;
  }

  return score;
}

// 날짜 분리 필드 처리 (년/월/일 또는 년-월-일 select/input)
function fillDateFields(dateObj, keywords) {
  if (!dateObj || typeof dateObj !== "object") return 0;

  const { year, month, day } = dateObj;
  if (!year) return 0;

  // 페이지에서 날짜 관련 필드들 찾기
  const allInputs = Array.from(document.querySelectorAll("input, select"));
  const dateFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;

    const fieldInfo = getFieldInfo(input);
    const text = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.className}`.toLowerCase();

    // 날짜 관련 키워드 매칭
    const isDateField = keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    if (isDateField) {
      // year/month/day 패턴 감지
      let type = "unknown";
      if (/year|년|yyyy/.test(text)) type = "year";
      else if (/month|월|mm/.test(text)) type = "month";
      else if (/day|일|dd/.test(text)) type = "day";

      dateFields.push({
        element: input,
        type: type,
        info: fieldInfo,
      });
    }
  });

  let filledCount = 0;

  // 년/월/일 분리 필드 찾기
  const yearField = dateFields.find((f) => f.type === "year");
  const monthField = dateFields.find((f) => f.type === "month");
  const dayField = dateFields.find((f) => f.type === "day");

  if (yearField || monthField || dayField) {
    // 분리된 필드에 입력
    if (yearField && year) {
      fillField(yearField.element, year);
      filledCount++;
    }
    if (monthField && month) {
      fillField(monthField.element, month);
      filledCount++;
    }
    if (dayField && day) {
      fillField(dayField.element, day);
      filledCount++;
    }
  } else if (dateFields.length === 1) {
    // 필드가 하나만 있으면 전체 날짜 입력
    const dateFormat = savedData?.personalInfo?.dateFormat || "hyphen";
    const formattedDate = formatDate(dateObj, dateFormat);
    fillField(dateFields[0].element, formattedDate);
    filledCount++;
  }

  return filledCount;
}

// 이메일 분리 필드 처리
function fillEmailAddress(email, keywords) {
  if (!email) return 0;

  let emailId = "";
  let emailDomain = "";

  // 이메일 파싱
  if (typeof email === "object") {
    // 새로운 형식 (분리된 이메일)
    emailId = email.id || "";
    emailDomain = email.domain || "";
  } else {
    // 이전 형식 (통합 이메일) - 자동 분리
    const parts = email.split("@");
    if (parts.length === 2) {
      emailId = parts[0];
      emailDomain = parts[1];
    } else {
      emailId = email;
    }
  }

  const fullEmail = emailId && emailDomain ? `${emailId}@${emailDomain}` : email;

  // 페이지에서 이메일 관련 필드들 찾기
  const allInputs = Array.from(document.querySelectorAll("input, select"));
  const emailFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;
    if (usedFields.has(input)) return;

    const fieldInfo = getFieldInfo(input);
    const text = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.className}`.toLowerCase();

    // 이메일 관련 키워드 매칭
    const isEmailField = keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    if (isEmailField) {
      // email_id, email_domain, email1, email2 같은 패턴 감지
      let type = "unknown";
      if (/id|user|account|prefix|1/.test(text)) type = "id";
      else if (/domain|suffix|etc|custom|2/.test(text)) type = "domain";

      // select 박스는 제외하고 실제 입력 필드만 (etc, custom 우선)
      const isDirectInput = /etc|custom|direct/.test(text);
      const isSelect = input.tagName === "SELECT";

      const order = fieldInfo.name.match(/\d+$/) || fieldInfo.id.match(/\d+$/);
      emailFields.push({
        element: input,
        type: type,
        order: order ? parseInt(order[0]) : 0,
        isDirectInput: isDirectInput,
        isSelect: isSelect,
        info: fieldInfo,
      });
    }
  });

  // 순서대로 정렬
  emailFields.sort((a, b) => a.order - b.order);

  let filledCount = 0;

  // ID/도메인 분리 필드 찾기
  const idField = emailFields.find((f) => f.type === "id" && !f.isSelect);
  // 도메인은 직접입력 필드 우선
  const domainField = emailFields.find((f) => f.type === "domain" && f.isDirectInput) ||
                      emailFields.find((f) => f.type === "domain" && !f.isSelect) ||
                      emailFields.find((f) => f.type === "domain");

  if (idField && domainField) {
    // ID와 도메인 분리된 경우
    console.log("[이메일] ID/도메인 분리 필드 감지:", idField.element, domainField.element);
    if (emailId) {
      fillField(idField.element, emailId);
      usedFields.add(idField.element);
      filledCount++;
    }
    if (emailDomain) {
      fillField(domainField.element, emailDomain);
      usedFields.add(domainField.element);
      filledCount++;
    }
  } else if (emailFields.length >= 2) {
    // 순서대로 2개 필드가 있으면 (email1, email2)
    console.log("[이메일] 2개 필드 감지:", emailFields[0].element, emailFields[1].element);
    if (emailId) {
      fillField(emailFields[0].element, emailId);
      usedFields.add(emailFields[0].element);
      filledCount++;
    }
    if (emailDomain) {
      fillField(emailFields[1].element, emailDomain);
      usedFields.add(emailFields[1].element);
      filledCount++;
    }
  } else if (emailFields.length === 1) {
    // 필드가 하나만 있으면 전체 이메일 입력
    console.log("[이메일] 통합 필드 감지:", emailFields[0].element);
    fillField(emailFields[0].element, fullEmail);
    usedFields.add(emailFields[0].element);
    filledCount++;
  } else {
    console.log("[이메일] 매칭된 필드 없음. 검색된 필드:", emailFields);
  }

  return filledCount;
}

// 전화번호 분리 필드 처리
function fillPhoneNumber(phoneNumber, keywords) {
  if (!phoneNumber) return 0;

  // 전화번호 파싱 (010-1234-5678 또는 01012345678)
  const cleaned = phoneNumber.replace(/[^0-9]/g, "");
  let parts = [];

  if (phoneNumber.includes("-")) {
    parts = phoneNumber.split("-");
  } else if (cleaned.length === 10) {
    // 0212345678 -> 02, 1234, 5678
    parts = [cleaned.slice(0, 2), cleaned.slice(2, 6), cleaned.slice(6)];
  } else if (cleaned.length === 11) {
    // 01012345678 -> 010, 1234, 5678
    parts = [cleaned.slice(0, 3), cleaned.slice(3, 7), cleaned.slice(7)];
  } else {
    parts = [cleaned];
  }

  // 페이지에서 전화번호 관련 필드들 찾기
  const allInputs = Array.from(document.querySelectorAll("input, select"));
  const phoneFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;

    const fieldInfo = getFieldInfo(input);
    const text = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.className}`.toLowerCase();

    // 전화번호 관련 키워드 매칭
    const isPhoneField = keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    if (isPhoneField) {
      // phone1, phone2, phone3 같은 패턴 감지
      const order = fieldInfo.name.match(/\d+$/) || fieldInfo.id.match(/\d+$/);
      phoneFields.push({
        element: input,
        order: order ? parseInt(order[0]) : 0,
        info: fieldInfo,
      });
    }
  });

  // 순서대로 정렬
  phoneFields.sort((a, b) => a.order - b.order);

  let filledCount = 0;

  // 분리된 필드가 2개 이상이면 분할해서 입력
  if (phoneFields.length >= 2 && parts.length >= 2) {
    phoneFields.forEach((field, index) => {
      if (index < parts.length && parts[index]) {
        fillField(field.element, parts[index]);
        filledCount++;
      }
    });
  } else if (phoneFields.length === 1) {
    // 필드가 하나만 있으면 전체 입력
    fillField(phoneFields[0].element, phoneNumber);
    filledCount++;
  }

  return filledCount;
}

// 패턴 기반 필드 유형 감지
function detectFieldTypeByPattern(fieldInfo) {
  const allText = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText}`.toLowerCase();

  // 전화번호 패턴
  if (
    /phone|tel|mobile|휴대폰|전화|연락처/.test(allText) ||
    fieldInfo.type === "tel"
  ) {
    return "phone";
  }

  // 이메일 패턴
  if (/email|이메일|메일/.test(allText) || fieldInfo.type === "email") {
    return "email";
  }

  // 날짜 패턴
  if (
    /date|birth|생년월일|생일|입학|졸업|취득일|시작|종료/.test(allText) ||
    fieldInfo.type === "date"
  ) {
    return "date";
  }

  // 주소 패턴
  if (/address|addr|주소|거주지/.test(allText)) {
    return "address";
  }

  // 이름 패턴
  if (/name|이름|성명/.test(allText)) {
    return "name";
  }

  // GPA/학점 패턴
  if (/gpa|학점|성적|평점/.test(allText)) {
    return "gpa";
  }

  return "text";
}

// 필드 채우기
function fillField(field, value) {
  if (!value) return;

  try {
    // 필드 레이블 찾기
    const label = findLabel(field);
    const labelText = label ? label.textContent.trim() : (field.placeholder || field.name || field.id || "알 수 없음");

    // readonly 임시 해제
    const wasReadOnly = field.readOnly;
    if (wasReadOnly) {
      field.readOnly = false;
    }

    if (field.tagName === "SELECT") {
      // 셀렉트 박스
      const options = field.querySelectorAll("option");
      let matched = false;
      for (let option of options) {
        if (option.value === value || option.textContent.trim() === value || option.textContent.includes(value)) {
          field.value = option.value;
          matched = true;
          break;
        }
      }

      // 매칭되지 않으면 "직접입력" 옵션 찾아서 선택
      if (!matched) {
        for (let option of options) {
          if (option.value === "직접입력" || option.textContent.includes("직접입력") || option.value === "") {
            field.value = option.value;
            console.log(`[SELECT] 직접입력 선택됨: ${field.name || field.id}`);
            break;
          }
        }
      }
    } else if (field.type === "checkbox" || field.type === "radio") {
      // 체크박스/라디오 버튼
      if (field.value === value || field.value.includes(value)) {
        field.checked = true;
      }
    } else {
      // 텍스트 입력 필드 - React/Vue 호환성 향상

      // 1. Native setter 사용 (React가 추적하는 value 속성 우회)
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;

      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;

      if (field.tagName === "TEXTAREA" && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(field, value);
      } else if (nativeInputValueSetter) {
        nativeInputValueSetter.call(field, value);
      } else {
        // Fallback
        field.value = value;
      }
    }

    // 2. 다양한 이벤트 트리거 (프레임워크 호환성)

    // input 이벤트 (가장 중요)
    field.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));

    // change 이벤트
    field.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));

    // blur 이벤트 (일부 validation 트리거)
    field.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

    // InputEvent (React 17+)
    field.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType: "insertText",
    }));

    // AngularJS 이벤트
    field.dispatchEvent(new Event("keydown", { bubbles: true }));
    field.dispatchEvent(new Event("keyup", { bubbles: true }));

    // jQuery 이벤트가 있다면 트리거
    if (window.jQuery) {
      try {
        window.jQuery(field).trigger("input").trigger("change");
      } catch (e) {
        // jQuery 없거나 에러 무시
      }
    }

    // readonly 복원
    if (wasReadOnly) {
      field.readOnly = true;
    }

    // 채워진 필드 목록에 추가
    filledFieldsList.push({
      label: labelText,
      value: String(value).length > 30 ? String(value).substring(0, 30) + "..." : value
    });
  } catch (error) {
    console.error("필드 채우기 오류:", error);
  }
}

// 사진 파일 자동 첨부
function fillPhotoFields(base64Data) {
  if (!base64Data || !base64Data.startsWith("data:image")) {
    console.log("유효한 사진 데이터가 없습니다.");
    return;
  }

  // 모든 파일 input 찾기
  const fileInputs = document.querySelectorAll('input[type="file"]');

  fileInputs.forEach((fileInput) => {
    // 이미지만 받는 파일 input 찾기
    const accept = fileInput.accept || "";
    if (accept.includes("image") || accept === "") {
      try {
        // Base64를 Blob으로 변환
        const arr = base64Data.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });

        // Blob을 File 객체로 변환
        const file = new File([blob], "photo.jpg", {
          type: mime,
          lastModified: new Date().getTime(),
        });

        // DataTransfer 사용하여 파일 첨부
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // change 이벤트 트리거
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        fileInput.dispatchEvent(new Event("input", { bubbles: true }));

        console.log("사진 파일 자동 첨부 성공:", fileInput);
      } catch (error) {
        console.error("사진 파일 첨부 실패:", error);
      }
    }
  });
}

// 알림 표시
function showNotification(message, type, filledFields = []) {
  // 기존 알림 제거
  const existingNotification = document.getElementById(
    "auto-fill-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.id = "auto-fill-notification";
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10001;
    background: ${type === "success" ? "#27ae60" : "#e74c3c"};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease;
    max-width: 400px;
    max-height: 500px;
    overflow-y: auto;
  `;

  // 제목과 닫기 버튼
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${filledFields.length > 0 ? "12px" : "0"};
    font-weight: bold;
  `;

  const title = document.createElement("span");
  title.textContent = message;
  header.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    margin-left: 16px;
    line-height: 1;
    opacity: 0.8;
  `;
  closeBtn.onmouseover = () => closeBtn.style.opacity = "1";
  closeBtn.onmouseout = () => closeBtn.style.opacity = "0.8";
  closeBtn.onclick = () => notification.remove();
  header.appendChild(closeBtn);

  notification.appendChild(header);

  // 채워진 필드 목록
  if (filledFields.length > 0) {
    const list = document.createElement("div");
    list.style.cssText = `
      font-size: 12px;
      font-weight: normal;
      opacity: 0.9;
      line-height: 1.6;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 12px;
      max-height: 300px;
      overflow-y: auto;
    `;

    filledFields.forEach((field, index) => {
      const item = document.createElement("div");
      item.style.cssText = `
        margin-bottom: 6px;
        padding: 4px 0;
        ${index < filledFields.length - 1 ? "border-bottom: 1px solid rgba(255,255,255,0.1);" : ""}
      `;
      item.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
      list.appendChild(item);
    });

    notification.appendChild(list);
  }

  // 애니메이션 CSS 추가
  if (!document.getElementById("auto-fill-styles")) {
    const style = document.createElement("style");
    style.id = "auto-fill-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      #auto-fill-notification::-webkit-scrollbar {
        width: 6px;
      }
      #auto-fill-notification::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
      }
      #auto-fill-notification::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.3);
        border-radius: 3px;
      }
      #auto-fill-notification::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.5);
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // X 버튼으로만 닫을 수 있음 (자동 사라짐 제거)
}

// 데이터 변경 감지 (popup에서 데이터가 변경되면 자동으로 업데이트)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.jobApplicationData) {
    savedData = changes.jobApplicationData.newValue;
    createAutoFillButton();
  }
});
