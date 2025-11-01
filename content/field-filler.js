// 필드 채우기 로직

// 채워진 필드 목록 추적
let filledFieldsList = [];

// 필드 채우기 (V2: async + 검증)
async function fillField(field, value) {
  if (!value) return { success: false, reason: "No value" };

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

    // 3. 100ms 대기 후 검증
    await new Promise(resolve => setTimeout(resolve, 100));

    // 값이 실제로 입력되었는지 확인
    let actualValue;
    if (field.type === "checkbox" || field.type === "radio") {
      actualValue = field.checked ? "checked" : "unchecked";
      var success = field.checked;
    } else {
      actualValue = field.value;
      var success = actualValue === String(value);
    }

    // 4. 시각적 피드백 (테두리)
    if (success) {
      field.style.border = "2px solid #27ae60 !important";
    } else {
      field.style.border = "2px solid #e74c3c !important";
    }

    // 결과 기록
    const result = {
      label: labelText,
      value: String(value).length > 30 ? String(value).substring(0, 30) + "..." : value,
      success: success,
      fieldElement: field,
      reason: success ? null : `Expected: ${value}, Got: ${actualValue}`
    };

    filledFieldsList.push(result);
    return result;

  } catch (error) {
    console.error("필드 채우기 오류:", error);
    const result = {
      label: "오류",
      value: String(value),
      success: false,
      fieldElement: field,
      reason: error.message
    };
    filledFieldsList.push(result);
    return result;
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

// filledFieldsList 초기화 함수
function clearFilledFieldsList() {
  filledFieldsList = [];
}

// filledFieldsList 가져오기 함수
function getFilledFieldsList() {
  return filledFieldsList;
}
