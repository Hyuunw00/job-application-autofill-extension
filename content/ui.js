// UI 관련 함수들 (알림 모달)

// 알림 표시 (V2: 성공/실패 분리)
function showNotification(message, type, filledFields = []) {
  // 기존 알림 제거
  const existingNotification = document.getElementById(
    "auto-fill-notification"
  );
  if (existingNotification) {
    existingNotification.remove();
  }

  // 성공/실패 필드 분리
  const successFields = filledFields.filter(f => f.success);
  const failedFields = filledFields.filter(f => !f.success);

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

  // 성공 필드 목록
  if (successFields.length > 0) {
    const successSection = document.createElement("div");
    successSection.style.cssText = `
      font-size: 12px;
      font-weight: normal;
      opacity: 0.9;
      line-height: 1.6;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 12px;
      margin-bottom: ${failedFields.length > 0 ? "12px" : "0"};
    `;

    const successTitle = document.createElement("div");
    successTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 13px;
    `;
    successTitle.textContent = `✓ 성공 (${successFields.length}개)`;
    successSection.appendChild(successTitle);

    const successList = document.createElement("div");
    successList.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
    `;

    successFields.forEach((field, index) => {
      const item = document.createElement("div");
      item.style.cssText = `
        margin-bottom: 6px;
        padding: 4px 0;
        ${index < successFields.length - 1 ? "border-bottom: 1px solid rgba(255,255,255,0.1);" : ""}
      `;
      item.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
      successList.appendChild(item);
    });

    successSection.appendChild(successList);
    notification.appendChild(successSection);
  }

  // 실패 필드 목록
  if (failedFields.length > 0) {
    const failSection = document.createElement("div");
    failSection.style.cssText = `
      font-size: 12px;
      font-weight: normal;
      opacity: 0.9;
      line-height: 1.6;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 12px;
      background: rgba(0,0,0,0.1);
      margin: 0 -20px;
      padding: 12px 20px;
      border-radius: 0 0 8px 8px;
    `;

    const failTitle = document.createElement("div");
    failTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 13px;
    `;
    failTitle.textContent = `✗ 실패 (${failedFields.length}개)`;
    failSection.appendChild(failTitle);

    const failList = document.createElement("div");
    failList.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
    `;

    failedFields.forEach((field, index) => {
      const item = document.createElement("div");
      item.style.cssText = `
        margin-bottom: 6px;
        padding: 4px 0;
        ${index < failedFields.length - 1 ? "border-bottom: 1px solid rgba(255,255,255,0.1);" : ""}
      `;
      const reasonText = field.reason ? `<br><span style="font-size: 11px; opacity: 0.8;">${field.reason}</span>` : "";
      item.innerHTML = `<strong>${field.label}:</strong> ${field.value}${reasonText}`;
      failList.appendChild(item);
    });

    failSection.appendChild(failList);
    notification.appendChild(failSection);
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
