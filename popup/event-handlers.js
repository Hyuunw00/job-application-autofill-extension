// 이벤트 핸들러 설정 함수들

// AI 모드 전환 핸들러 설정
function setupAiModeHandler() {
  // CSS :has() 선택자로 자동 처리되므로 별도 로직 불필요
  // 하지만 카드 클릭 시 라디오 버튼도 체크되도록 추가
  const cards = document.querySelectorAll('.ai-mode-card');

  cards.forEach(card => {
    card.addEventListener('click', function(e) {
      // 이미 input이나 button을 클릭한 경우 중복 처리 방지
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        return;
      }

      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
      }
    });
  });
}

// API 키 테스트 핸들러 설정
function setupApiKeyTestHandler() {
  const testButton = document.getElementById("test_api_key");
  const apiKeyInput = document.getElementById("openai_api_key");
  const statusDiv = document.getElementById("api_key_status");

  if (testButton && apiKeyInput && statusDiv) {
    testButton.addEventListener("click", async function () {
      const apiKey = apiKeyInput.value.trim();

      if (!apiKey) {
        statusDiv.innerHTML = '<span style="color: #e74c3c;">❌ API 키를 입력하세요</span>';
        return;
      }

      statusDiv.innerHTML = '<span style="color: #3498db;">🔄 테스트 중...</span>';
      testButton.disabled = true;

      try {
        // 간단한 chat completion 요청으로 테스트 (Model capabilities 권한만 필요)
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "test" }],
            max_tokens: 1,
          }),
        });

        if (response.ok) {
          statusDiv.innerHTML = '<span style="color: #27ae60;">✅ API 키가 유효합니다!</span>';
        } else if (response.status === 401) {
          statusDiv.innerHTML = '<span style="color: #e74c3c;">❌ 유효하지 않은 API 키입니다</span>';
        } else if (response.status === 403) {
          statusDiv.innerHTML = '<span style="color: #e74c3c;">❌ API 키 권한이 부족합니다. Model capabilities: Write 권한을 확인하세요</span>';
        } else if (response.status === 429) {
          statusDiv.innerHTML = '<span style="color: #e67e22;">⚠️ 크레딧이 부족합니다. billing 설정을 확인하세요</span>';
        } else {
          statusDiv.innerHTML = `<span style="color: #e74c3c;">❌ 오류 (${response.status})</span>`;
        }
      } catch (error) {
        statusDiv.innerHTML = '<span style="color: #e74c3c;">❌ 네트워크 오류</span>';
      } finally {
        testButton.disabled = false;
      }
    });
  }
}

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

// 직접입력 기능 설정 (더 이상 필요 없음 - 모두 text input으로 변경됨)
function setupCustomInputHandlers() {
  // Select가 모두 text input으로 변경되어 이 함수는 더 이상 필요하지 않음
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

// 병역사항 입력 핸들러 (text input으로 변경됨)
function setupMilitaryServiceHandler() {
  const militaryServiceInput = document.getElementById("military_service");
  const militaryDetails = document.getElementById("military_details");

  if (militaryServiceInput && militaryDetails) {
    militaryServiceInput.addEventListener("input", function () {
      // "군필"이라는 키워드가 포함되면 상세 항목 표시
      if (this.value.includes("군필")) {
        militaryDetails.style.display = "block";
      } else {
        militaryDetails.style.display = "none";
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
