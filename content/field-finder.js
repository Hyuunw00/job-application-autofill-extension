// 필드 찾기 및 매칭 로직

// 전역 변수: 이미 사용된 필드 추적용
let usedFields = new Set();

// 통합 키워드 그룹 (한글/영문 변형 포함)
const keywordGroups = {
  name: ["이름", "성명", "name", "한글명", "이름입력", "fullname", "username"],
  email: ["이메일", "메일", "email", "mail", "e-mail", "e mail", "이메일주소"],
  phone: ["전화", "전화번호", "휴대폰", "핸드폰", "연락처", "phone", "tel", "mobile", "cellphone", "cell", "휴대전화"],
  password: ["비밀번호", "password", "pw", "passwd", "비번", "pass"],
  birthdate: ["생년월일", "생일", "birth", "출생", "출생일", "출생연월일", "birthday", "생년"],
  address: ["주소", "address", "거주지", "주소지", "addr"],
  gender: ["성별", "gender", "남녀", "성"],
  nationality: ["국적", "nationality", "국가", "나라"],
  nameEnglish: ["영문명", "영문이름", "english", "영어이름", "영문성명"],
  nameChinese: ["한자명", "한자이름", "chinese", "한자"],
  militaryService: ["병역", "military", "군필", "미필", "병역사항", "군대"],
  company: ["회사", "회사명", "company", "근무회사", "직장"],
  department: ["소속", "부서", "department", "팀"],
  position: ["직급", "직책", "position", "직위", "담당"],
  school: ["학교", "school", "대학", "대학교", "고등학교", "고교"],
  major: ["전공", "major", "학과", "전공학과"],
  degree: ["학위", "degree", "졸업"],
  gpa: ["학점", "gpa", "성적", "평점", "평균평점"],
  certificate: ["자격증", "certificate", "자격", "자격증명"],
  language: ["어학", "language", "토익", "toeic", "토플", "toefl", "어학시험"],
  score: ["점수", "score", "점"],
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
    const matchScore = calculateMatchScore(fieldInfo, keywords);

    // 최소 임계값 1 이상 (키워드가 최소 1번 이상 출현)
    if (matchScore >= 1) {
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

// 매치 점수 계산 (V2: 키워드 출현 횟수 카운트)
function calculateMatchScore(fieldInfo, keywords) {
  let count = 0;

  // 모든 필드 속성을 하나의 텍스트로 결합
  const allText = `
    ${fieldInfo.id || ''}
    ${fieldInfo.name || ''}
    ${fieldInfo.placeholder || ''}
    ${fieldInfo.labelText || ''}
    ${fieldInfo.className || ''}
    ${fieldInfo.ariaLabel || ''}
    ${fieldInfo.ariaLabelText || ''}
    ${fieldInfo.autocomplete || ''}
    ${fieldInfo.type || ''}
  `.toLowerCase();

  // 각 키워드가 출현하는 횟수 카운트
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    // includes로 부분 문자열 매칭
    if (allText.includes(lowerKeyword)) {
      // 정규식으로 출현 횟수 카운트
      const regex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = allText.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
  });

  // 페널티: 이미 값이 채워진 필드
  if (fieldInfo.value && fieldInfo.value.trim().length > 0) {
    count -= 100; // 큰 페널티
  }

  return count;
}

// 키워드 기반 필드 채우기 (V2: async)
async function fillFieldsByKeywords(mappings, index = 0) {
  let filledCount = 0;

  for (const mapping of mappings) {
    try {
      if (!mapping.data) continue;

      const field = findFieldByKeywords(mapping.keywords, index);
      if (field) {
        await fillField(field, mapping.data);
        filledCount++;
      }
    } catch (error) {
      console.error("필드 매칭 오류:", mapping.keywords, error);
    }
  }

  return filledCount;
}

// usedFields 초기화 함수
function clearUsedFields() {
  usedFields.clear();
}
