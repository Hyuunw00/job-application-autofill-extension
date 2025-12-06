// 데이터 수집 관련 함수들

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
    // AI 설정
    aiSettings: {
      mode: document.querySelector('input[name="ai_mode"]:checked')?.value || 'free',
      apiKey: document.getElementById("openai_api_key")?.value || '',
      model: document.getElementById("openai_model")?.value || 'gpt-4o-mini',
    },

    // 개인정보 (모든 값은 string)
    personalInfo: {
      name: document.getElementById("name").value,
      birthdate: document.getElementById("birthdate").value,
      phone: document.getElementById("phone").value,
      emergencyContact: document.getElementById("emergency_contact").value,
      availableDate: document.getElementById("available_date").value,
      password: document.getElementById("password").value,
      photo: photoData,
      gender: document.getElementById("gender").value,
      nationality: document.getElementById("nationality").value,
      nameEnglish: document.getElementById("name_english").value,
      nameChinese: document.getElementById("name_chinese").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      addressDetail: document.getElementById("address_detail").value,
      applicationPath: document.getElementById("application_path").value,
      desiredSalary: document.getElementById("desired_salary").value,
      previousSalary: document.getElementById("previous_salary").value,
      militaryService: document.getElementById("military_service").value,
      militaryBranch: document.getElementById("military_branch")?.value || "",
      militaryRank: document.getElementById("military_rank")?.value || "",
      militarySpecialty: document.getElementById("military_specialty")?.value || "",
      militaryDischargeType: document.getElementById("military_discharge_type")?.value || "",
      militaryEnlistmentDate: document.getElementById("military_enlistment_date")?.value || "",
      militaryDischargeDate: document.getElementById("military_discharge_date")?.value || "",
    },

    // 학력 (모든 값은 string)
    education: {
      highschool: {
        name: document.getElementById("highschool_name").value,
        admissionStatus: document.getElementById("highschool_admission_status").value,
        graduationStatus: document.getElementById("highschool_graduation_status").value,
        start: document.getElementById("highschool_start").value,
        graduation: document.getElementById("highschool_graduation").value,
        type: document.getElementById("highschool_type").value,
      },
      university: {
        name: document.getElementById("university_name").value,
        campusType: document.getElementById("university_campus_type").value,
        admissionStatus: document.getElementById("university_admission_status").value,
        graduationStatus: document.getElementById("university_graduation_status").value,
        dayNight: document.getElementById("university_day_night").value,
        start: document.getElementById("university_start").value,
        graduation: document.getElementById("university_graduation").value,
        type: document.getElementById("university_type").value,
        departmentCategory: document.getElementById("university_department_category").value,
        major: document.getElementById("university_major").value,
        majorType: document.getElementById("university_major_type").value,
        degree: document.getElementById("university_degree").value,
        gpa: document.getElementById("university_gpa").value,
        gpaMax: document.getElementById("university_gpa_max").value,
        maxGpa: document.getElementById("university_max_gpa").value,
      },
    },

    // 경력
    careers: collectDynamicData("career"),

    // 프로젝트
    projects: collectDynamicData("project"),

    // 수상경력
    awards: collectDynamicData("award"),

    // 외부활동(기타)
    activities: collectDynamicData("activity"),

    // 해외 경험
    overseas: collectDynamicData("overseas"),

    // 어학점수
    languageScores: collectDynamicData("language-score"),

    // 자격증
    certificates: collectDynamicData("certificate"),

    // 교육이수사항
    educations: collectDynamicData("education"),

    // 컴퓨터활용능력
    computerSkills: collectDynamicData("computer-skill"),

    // 외국어활용능력
    languageSkills: collectDynamicData("language-skill"),

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
        if (input.type === 'checkbox') {
          item[className] = input.checked;
        } else {
          item[className] = input.value;
        }
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
    project: "projects-container",
    award: "awards-container",
    activity: "activities-container",
    overseas: "overseas-container",
    "language-score": "language-scores-container",
    certificate: "certificates-container",
    education: "education-container",
    "computer-skill": "computer-skills-container",
    "language-skill": "language-skills-container",
  };

  return containerMap[type] || "";
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

// 파일을 Base64로 변환하는 함수
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
