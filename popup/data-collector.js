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
