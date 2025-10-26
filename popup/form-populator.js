// 폼 데이터 채우기 관련 함수들

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
