// 입사지원 자동완성 익스텐션 - content.js (메인 진입점)

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
    bottom: 20px;
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
    showPreFillConfirmation();
  });

  document.body.appendChild(button);
}

// 데이터 변경 감지 (popup에서 데이터가 변경되면 자동으로 업데이트)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.jobApplicationData) {
    savedData = changes.jobApplicationData.newValue;
    createAutoFillButton();
  }
});
