// 입사지원 자동완성 익스텐션 - popup.js (메인 진입점)

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

  // 이메일 도메인 선택 이벤트 리스너 추가
  setupEmailDomainHandler();

  // 삭제 버튼 이벤트 리스너 추가
  attachRemoveListeners();
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
