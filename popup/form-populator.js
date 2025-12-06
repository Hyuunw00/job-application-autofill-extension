// 폼 데이터 채우기 관련 함수들

// 폼에 데이터 채우기 함수
function populateForm(data) {
  // AI 설정
  if (data.aiSettings) {
    // 모드 선택
    const mode = data.aiSettings.mode || 'free';
    const modeRadio = document.getElementById(`ai_mode_${mode}`);
    if (modeRadio) {
      modeRadio.checked = true;
      // API 모드일 경우 설정 표시
      const apiSettings = document.getElementById("api_mode_settings");
      if (mode === 'api' && apiSettings) {
        apiSettings.style.display = "block";
      }
    }

    // API 키
    if (data.aiSettings.apiKey) {
      const apiKeyInput = document.getElementById("openai_api_key");
      if (apiKeyInput) {
        apiKeyInput.value = data.aiSettings.apiKey;
      }
    }

    // 모델
    if (data.aiSettings.model) {
      const modelSelect = document.getElementById("openai_model");
      if (modelSelect) {
        modelSelect.value = data.aiSettings.model;
      }
    }
  }

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

    // 일반 필드 처리 (모든 값은 string)
    const simpleFields = {
      name: "name",
      birthdate: "birthdate",
      phone: "phone",
      emergencyContact: "emergency_contact",
      availableDate: "available_date",
      password: "password",
      gender: "gender",
      nationality: "nationality",
      nameEnglish: "name_english",
      nameChinese: "name_chinese",
      email: "email",
      address: "address",
      addressDetail: "address_detail",
      applicationPath: "application_path",
      desiredSalary: "desired_salary",
      previousSalary: "previous_salary",
      militaryService: "military_service",
      militaryBranch: "military_branch",
      militaryRank: "military_rank",
      militarySpecialty: "military_specialty",
      militaryDischargeType: "military_discharge_type",
      militaryEnlistmentDate: "military_enlistment_date",
      militaryDischargeDate: "military_discharge_date",
    };

    Object.keys(simpleFields).forEach((key) => {
      const elementId = simpleFields[key];
      const element = document.getElementById(elementId);
      if (element && data.personalInfo[key]) {
        // 이전 형식(객체) 호환 처리
        const value = data.personalInfo[key];
        if (typeof value === "object") {
          // 이메일 객체인 경우
          if (value.id && value.domain) {
            element.value = `${value.id}@${value.domain}`;
          }
          // 날짜 객체인 경우
          else if (value.year) {
            const y = value.year;
            const m = String(value.month || 1).padStart(2, '0');
            const d = String(value.day || 1).padStart(2, '0');
            element.value = `${y}-${m}-${d}`;
          }
        } else {
          element.value = value;
        }
      }
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
      const hs = data.education.highschool;
      if (hs.name) document.getElementById("highschool_name").value = hs.name;
      if (hs.admissionStatus) document.getElementById("highschool_admission_status").value = hs.admissionStatus;
      if (hs.graduationStatus) document.getElementById("highschool_graduation_status").value = hs.graduationStatus;
      if (hs.type) document.getElementById("highschool_type").value = hs.type;
      if (hs.start) setStringOrDateField("highschool_start", hs.start);
      if (hs.graduation) setStringOrDateField("highschool_graduation", hs.graduation);
    }

    // 대학교
    if (data.education.university) {
      const uni = data.education.university;
      if (uni.name) document.getElementById("university_name").value = uni.name;
      if (uni.campusType) document.getElementById("university_campus_type").value = uni.campusType;
      if (uni.admissionStatus) document.getElementById("university_admission_status").value = uni.admissionStatus;
      if (uni.graduationStatus) document.getElementById("university_graduation_status").value = uni.graduationStatus;
      if (uni.dayNight) document.getElementById("university_day_night").value = uni.dayNight;
      if (uni.type) document.getElementById("university_type").value = uni.type;
      if (uni.departmentCategory) document.getElementById("university_department_category").value = uni.departmentCategory;
      if (uni.major) document.getElementById("university_major").value = uni.major;
      if (uni.majorType) document.getElementById("university_major_type").value = uni.majorType;
      if (uni.degree) document.getElementById("university_degree").value = uni.degree;
      if (uni.gpa) document.getElementById("university_gpa").value = uni.gpa;
      if (uni.gpaMax) document.getElementById("university_gpa_max").value = uni.gpaMax;
      if (uni.maxGpa) document.getElementById("university_max_gpa").value = uni.maxGpa;
      if (uni.start) setStringOrDateField("university_start", uni.start);
      if (uni.graduation) setStringOrDateField("university_graduation", uni.graduation);
    }
  }

  // 동적 섹션들
  populateDynamicData("career", data.careers);
  populateDynamicData("project", data.projects);
  populateDynamicData("award", data.awards);
  populateDynamicData("activity", data.activities);
  populateDynamicData("overseas", data.overseas);
  populateDynamicData("language-score", data.languageScores);
  populateDynamicData("certificate", data.certificates);
  populateDynamicData("education", data.educations);
  populateDynamicData("computer-skill", data.computerSkills);
  populateDynamicData("language-skill", data.languageSkills);

  // 장애사항, 보훈여부
  if (data.disabilityVeteran) {
    if (data.disabilityVeteran.disabilityStatus) {
      document.getElementById("disability_status").value = data.disabilityVeteran.disabilityStatus;
    }
    if (data.disabilityVeteran.disabilityGrade) {
      document.getElementById("disability_grade").value = data.disabilityVeteran.disabilityGrade;
    }
    if (data.disabilityVeteran.veteranStatus) {
      document.getElementById("veteran_status").value = data.disabilityVeteran.veteranStatus;
    }
    if (data.disabilityVeteran.veteranGrade) {
      document.getElementById("veteran_grade").value = data.disabilityVeteran.veteranGrade;
    }
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
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = items[0][key];
          } else {
            input.value = items[0][key];
          }
        }
      });

      // 경력 항목이면 재직중 체크박스 이벤트 트리거
      if (type === 'career') {
        const checkbox = firstItem.querySelector('.career_is_current');
        if (checkbox) {
          checkbox.dispatchEvent(new Event('change'));
        }
      }
    }
  }

  // 추가 항목들 생성
  for (let i = 1; i < items.length; i++) {
    addDynamicItem(type, items[i]);
  }
}

// 날짜 필드 설정 헬퍼 함수 (string 또는 객체 모두 처리)
function setStringOrDateField(elementId, value) {
  if (!value) return;

  const element = document.getElementById(elementId);
  if (!element) return;

  if (typeof value === "object" && value.year) {
    // 이전 형식 (객체) → string으로 변환
    const y = value.year;
    const m = String(value.month || 1).padStart(2, '0');
    const d = String(value.day || 1).padStart(2, '0');
    element.value = `${y}-${m}-${d}`;
  } else {
    // 새 형식 (string)
    element.value = value;
  }
}

// 셀렉트 박스 값 설정 (더 이상 필요 없음 - text input으로 변경됨)
function setSelectValue() {
  // 모두 text input으로 변경되어 이 함수는 사용되지 않음
  // 하위 호환성을 위해 남겨둠
}
