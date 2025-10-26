// 이벤트 핸들러 설정 함수들

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
        document.getElementById("military_enlistment_year").value = "";
        document.getElementById("military_enlistment_month").value = "";
        document.getElementById("military_enlistment_day").value = "";
        document.getElementById("military_discharge_year").value = "";
        document.getElementById("military_discharge_month").value = "";
        document.getElementById("military_discharge_day").value = "";
      }
    });
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
