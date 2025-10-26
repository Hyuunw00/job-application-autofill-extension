// 필드 찾기 및 매칭 로직

// 전역 변수: 이미 사용된 필드 추적용
let usedFields = new Set();

// autocomplete 속성 매핑
const autocompleteMapping = {
  name: ["이름", "name", "성명", "한글명"],
  email: ["이메일", "email", "메일"],
  tel: ["전화번호", "phone", "연락처", "휴대폰"],
  "current-password": ["비밀번호", "password", "pw"],
  "new-password": ["비밀번호", "password", "pw"],
  password: ["비밀번호", "password", "pw"],
  "bday-year": ["생년월일", "birth", "생일", "출생"],
  "bday-month": ["생년월일", "birth", "생일", "출생"],
  "bday-day": ["생년월일", "birth", "생일", "출생"],
  bday: ["생년월일", "birth", "생일", "출생"],
  "address-line1": ["주소", "address", "거주지"],
  country: ["국적", "nationality", "국가"],
};

// type 속성 매핑
const typeMapping = {
  email: ["이메일", "email", "메일"],
  tel: ["전화번호", "phone", "연락처", "휴대폰"],
  password: ["비밀번호", "password", "pw", "passwd"],
  date: ["날짜", "date", "일자"],
  url: ["웹사이트", "url", "링크"],
  number: ["점수", "score", "학점", "gpa"],
};

// 키워드로 필드 찾기
function findFieldByKeywords(keywords, index = 0) {
  const allInputs = document.querySelectorAll("input, textarea, select");
  let foundFields = [];

  allInputs.forEach((input) => {
    // hidden과 disabled만 제외 (readonly는 fillField에서 처리)
    if (input.type === "hidden" || input.disabled) return;

    // 이미 사용된 필드는 건너뛰기
    if (usedFields.has(input)) return;

    const fieldInfo = getFieldInfo(input);
    const matchScore = calculateMatchScore(fieldInfo, keywords, input);

    // 최소 임계값 15점 이상만 후보로 추가 (정확도 향상)
    if (matchScore >= 15) {
      foundFields.push({ element: input, score: matchScore });
    }
  });

  // 점수순으로 정렬하고 인덱스에 맞는 필드 반환
  foundFields.sort((a, b) => {
    // 점수가 같으면 DOM 순서 우선 (먼저 나온 필드)
    if (b.score === a.score) {
      return 0;
    }
    return b.score - a.score;
  });

  const selectedField = foundFields[index] ? foundFields[index].element : null;

  // 선택된 필드를 사용된 필드 목록에 추가
  if (selectedField) {
    usedFields.add(selectedField);
  }

  return selectedField;
}

// 매치 점수 계산
function calculateMatchScore(fieldInfo, keywords, inputElement) {
  let score = 0;

  // 1. HTML5 autocomplete 속성 매칭 (최우선, 30점)
  if (fieldInfo.autocomplete && fieldInfo.autocomplete !== "off") {
    const autocompleteLower = fieldInfo.autocomplete.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();

      // autocomplete 매핑 확인
      for (const [autoKey, autoKeywords] of Object.entries(autocompleteMapping)) {
        if (autocompleteLower.includes(autoKey)) {
          if (autoKeywords.some(ak => lowerKeyword.includes(ak.toLowerCase()) || ak.toLowerCase().includes(lowerKeyword))) {
            score += 30;
            return;
          }
        }
      }

      // 직접 매칭
      if (autocompleteLower.includes(lowerKeyword) || lowerKeyword.includes(autocompleteLower)) {
        score += 30;
      }
    });
  }

  // 2. input type 매칭 (25점)
  if (fieldInfo.type && typeMapping[fieldInfo.type]) {
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (typeMapping[fieldInfo.type].some(t => lowerKeyword.includes(t) || t.includes(lowerKeyword))) {
        score += 25;
      }
    });
  }

  // 3. ARIA 속성 매칭 (20점)
  const ariaText = `${fieldInfo.ariaLabel} ${fieldInfo.ariaLabelText || ""}`.toLowerCase();
  if (ariaText.trim()) {
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (ariaText.includes(lowerKeyword)) {
        score += 20;
      }
    });
  }

  // 4. label 텍스트 정확한 매칭 (15점)
  if (fieldInfo.labelText) {
    const labelLower = fieldInfo.labelText.toLowerCase().trim();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (labelLower === lowerKeyword || labelLower.includes(lowerKeyword)) {
        score += 15;
      }
    });
  }

  // 5. name, id 속성 매칭 (12점)
  const nameId = `${fieldInfo.id} ${fieldInfo.name}`.toLowerCase();
  keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    if (nameId.includes(lowerKeyword)) {
      score += 12;
    }
  });

  // 6. placeholder 매칭 (10점)
  if (fieldInfo.placeholder) {
    const placeholderLower = fieldInfo.placeholder.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (placeholderLower.includes(lowerKeyword)) {
        score += 10;
      }
    });
  }

  // 7. className 매칭 (8점)
  if (fieldInfo.className) {
    const classLower = fieldInfo.className.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (classLower.includes(lowerKeyword)) {
        score += 8;
      }
    });
  }

  // 8. 부모 텍스트 매칭 (1점으로 낮춤)
  if (fieldInfo.parentText) {
    const parentLower = fieldInfo.parentText.toLowerCase();
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (parentLower.includes(lowerKeyword)) {
        score += 1;
      }
    });
  }

  // 9. 이미 값이 채워진 필드는 점수 대폭 감점 (-50점)
  if (fieldInfo.value && fieldInfo.value.trim().length > 0) {
    score -= 50;
  }

  // 10. form 내부 필드에 가산점 (3점)
  if (inputElement.closest("form")) {
    score += 3;
  }

  return score;
}

// 키워드 기반 필드 채우기
function fillFieldsByKeywords(mappings, index = 0) {
  let filledCount = 0;

  mappings.forEach((mapping) => {
    try {
      if (!mapping.data) return;

      const field = findFieldByKeywords(mapping.keywords, index);
      if (field) {
        fillField(field, mapping.data);
        filledCount++;
      }
    } catch (error) {
      console.error("필드 매칭 오류:", mapping.keywords, error);
    }
  });

  return filledCount;
}

// usedFields 초기화 함수
function clearUsedFields() {
  usedFields.clear();
}
