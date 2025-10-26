// 유틸리티 함수들

// 날짜 형식 변환 함수
function formatDate(dateObj, format) {
  if (!dateObj) return "";

  // 문자열로 저장된 이전 데이터 호환성 처리
  if (typeof dateObj === "string") {
    return dateObj; // 이전 형식 그대로 반환
  }

  // dateObj가 객체가 아니면 빈 문자열 반환
  if (typeof dateObj !== "object") return "";

  const { year, month, day } = dateObj;

  // 년도가 없으면 빈 문자열
  if (!year) return "";

  // 월을 2자리로 패딩
  const paddedMonth = month ? String(month).padStart(2, "0") : "";

  // 일을 2자리로 패딩
  const paddedDay = day ? String(day).padStart(2, "0") : "";

  // 날짜 구분자 결정
  let separator = "";
  if (format === "hyphen") {
    separator = "-";
  } else if (format === "dot") {
    separator = ".";
  }

  // 년월일 조합
  if (day && paddedDay) {
    // YYYY-MM-DD 형식
    if (separator) {
      return `${year}${separator}${paddedMonth}${separator}${paddedDay}`;
    } else {
      return `${year}${paddedMonth}${paddedDay}`;
    }
  } else if (month && paddedMonth) {
    // YYYY-MM 형식
    if (separator) {
      return `${year}${separator}${paddedMonth}`;
    } else {
      return `${year}${paddedMonth}`;
    }
  } else {
    // YYYY만
    return year;
  }
}

// 필드 정보 수집
function getFieldInfo(input) {
  const info = {
    id: input.id || "",
    name: input.name || "",
    placeholder: input.placeholder || "",
    className: input.className || "",
    type: input.type || "",
    value: input.value || "",
    autocomplete: input.autocomplete || "",
    ariaLabel: input.getAttribute("aria-label") || "",
    ariaLabelledBy: input.getAttribute("aria-labelledby") || "",
  };

  // aria-labelledby로 참조되는 요소 텍스트 가져오기
  if (info.ariaLabelledBy) {
    const labelElement = document.getElementById(info.ariaLabelledBy);
    if (labelElement) {
      info.ariaLabelText = labelElement.textContent || "";
    }
  }

  // 라벨 찾기
  const label = findLabel(input);
  if (label) {
    info.labelText = label.textContent || "";
  }

  // 부모 요소의 텍스트도 포함
  const parentText = input.closest("div, td, li")?.textContent || "";
  info.parentText = parentText;

  return info;
}

// 라벨 찾기
function findLabel(input) {
  // for 속성으로 연결된 라벨
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label;
  }

  // 부모 요소 내의 라벨
  const parent = input.closest("div, td, li");
  if (parent) {
    const label = parent.querySelector("label");
    if (label) return label;
  }

  // 이전 형제 요소가 라벨인 경우
  let prevSibling = input.previousElementSibling;
  while (prevSibling) {
    if (prevSibling.tagName === "LABEL") {
      return prevSibling;
    }
    prevSibling = prevSibling.previousElementSibling;
  }

  return null;
}

// 패턴 기반 필드 유형 감지
function detectFieldTypeByPattern(fieldInfo) {
  const allText = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText}`.toLowerCase();

  // 전화번호 패턴
  if (
    /phone|tel|mobile|휴대폰|전화|연락처/.test(allText) ||
    fieldInfo.type === "tel"
  ) {
    return "phone";
  }

  // 이메일 패턴
  if (/email|이메일|메일/.test(allText) || fieldInfo.type === "email") {
    return "email";
  }

  // 날짜 패턴
  if (
    /date|birth|생년월일|생일|입학|졸업|취득일|시작|종료/.test(allText) ||
    fieldInfo.type === "date"
  ) {
    return "date";
  }

  // 주소 패턴
  if (/address|addr|주소|거주지/.test(allText)) {
    return "address";
  }

  // 이름 패턴
  if (/name|이름|성명/.test(allText)) {
    return "name";
  }

  // GPA/학점 패턴
  if (/gpa|학점|성적|평점/.test(allText)) {
    return "gpa";
  }

  return "text";
}
