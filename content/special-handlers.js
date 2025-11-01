// 특수 필드 처리 함수들 (전화번호, 이메일, 날짜 분리 필드)

// 전화번호 분리 필드 처리 (V2: async)
async function fillPhoneNumber(phoneNumber, keywords) {
  if (!phoneNumber) return 0;

  // 전화번호 파싱 (010-1234-5678 또는 01012345678)
  const cleaned = phoneNumber.replace(/[^0-9]/g, "");
  let parts = [];

  if (phoneNumber.includes("-")) {
    parts = phoneNumber.split("-");
  } else if (cleaned.length === 10) {
    // 0212345678 -> 02, 1234, 5678
    parts = [cleaned.slice(0, 2), cleaned.slice(2, 6), cleaned.slice(6)];
  } else if (cleaned.length === 11) {
    // 01012345678 -> 010, 1234, 5678
    parts = [cleaned.slice(0, 3), cleaned.slice(3, 7), cleaned.slice(7)];
  } else {
    parts = [cleaned];
  }

  // 페이지에서 전화번호 관련 필드들 찾기
  const allInputs = Array.from(document.querySelectorAll("input, select"));
  const phoneFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;

    const fieldInfo = getFieldInfo(input);
    const text = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.className}`.toLowerCase();

    // 전화번호 관련 키워드 매칭
    const isPhoneField = keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    if (isPhoneField) {
      // phone1, phone2, phone3 같은 패턴 감지
      const order = fieldInfo.name.match(/\d+$/) || fieldInfo.id.match(/\d+$/);
      phoneFields.push({
        element: input,
        order: order ? parseInt(order[0]) : 0,
        info: fieldInfo,
      });
    }
  });

  // 순서대로 정렬
  phoneFields.sort((a, b) => a.order - b.order);

  let filledCount = 0;

  // 분리된 필드가 2개 이상이면 분할해서 입력
  if (phoneFields.length >= 2 && parts.length >= 2) {
    for (let index = 0; index < phoneFields.length; index++) {
      if (index < parts.length && parts[index]) {
        await fillField(phoneFields[index].element, parts[index]);
        filledCount++;
      }
    }
  } else if (phoneFields.length === 1) {
    // 필드가 하나만 있으면 전체 입력
    await fillField(phoneFields[0].element, phoneNumber);
    filledCount++;
  }

  return filledCount;
}

// 이메일 분리 필드 처리 (V2: async, 이메일 확인 필드 지원)
async function fillEmailAddress(email, keywords, fillConfirmation = false) {
  if (!email) return 0;

  let emailId = "";
  let emailDomain = "";

  // 이메일 파싱
  if (typeof email === "object") {
    // 새로운 형식 (분리된 이메일)
    emailId = email.id || "";
    emailDomain = email.domain || "";
  } else {
    // 이전 형식 (통합 이메일) - 자동 분리
    const parts = email.split("@");
    if (parts.length === 2) {
      emailId = parts[0];
      emailDomain = parts[1];
    } else {
      emailId = email;
    }
  }

  const fullEmail = emailId && emailDomain ? `${emailId}@${emailDomain}` : email;

  // 페이지에서 이메일 관련 필드들 찾기
  const allInputs = Array.from(document.querySelectorAll("input, select"));
  const emailFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;
    if (usedFields.has(input)) return;

    const fieldInfo = getFieldInfo(input);
    const text = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.className}`.toLowerCase();

    // 이메일 관련 키워드 매칭
    const isEmailField = keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    if (isEmailField) {
      // 확인 필드인지 감지
      const isConfirmField = /confirm|확인|check|재입력|다시/.test(text);

      // email_id, email_domain, email1, email2 같은 패턴 감지
      let type = "unknown";
      if (/id|user|account|prefix|1/.test(text)) type = "id";
      else if (/domain|suffix|etc|custom|2/.test(text)) type = "domain";

      // select 박스는 제외하고 실제 입력 필드만 (etc, custom 우선)
      const isDirectInput = /etc|custom|direct/.test(text);
      const isSelect = input.tagName === "SELECT";

      const order = fieldInfo.name.match(/\d+$/) || fieldInfo.id.match(/\d+$/);
      emailFields.push({
        element: input,
        type: type,
        order: order ? parseInt(order[0]) : 0,
        isDirectInput: isDirectInput,
        isSelect: isSelect,
        isConfirmField: isConfirmField,
        info: fieldInfo,
      });
    }
  });

  // 순서대로 정렬
  emailFields.sort((a, b) => a.order - b.order);

  let filledCount = 0;

  // ID/도메인 분리 필드 찾기
  const idFields = emailFields.filter((f) => f.type === "id" && !f.isSelect);
  const domainFields = emailFields.filter((f) => f.type === "domain" && !f.isSelect);

  if (idFields.length > 0 && domainFields.length > 0) {
    // ID와 도메인 분리된 경우
    console.log("[이메일] ID/도메인 분리 필드 감지");

    // ID 필드들 채우기 (일반 + 확인)
    for (const idField of idFields) {
      if (emailId) {
        await fillField(idField.element, emailId);
        usedFields.add(idField.element);
        filledCount++;
      }
    }

    // 도메인 필드들 채우기 (일반 + 확인, 직접입력 우선)
    const sortedDomainFields = domainFields.sort((a, b) => {
      if (a.isDirectInput && !b.isDirectInput) return -1;
      if (!a.isDirectInput && b.isDirectInput) return 1;
      return 0;
    });

    for (const domainField of sortedDomainFields) {
      if (emailDomain) {
        await fillField(domainField.element, emailDomain);
        usedFields.add(domainField.element);
        filledCount++;
      }
    }
  } else {
    // 통합 이메일 필드 처리
    const regularFields = emailFields.filter(f => !f.isConfirmField && !f.isSelect);
    const confirmFields = emailFields.filter(f => f.isConfirmField && !f.isSelect);

    // 일반 필드 먼저 채우기
    if (regularFields.length > 0) {
      console.log("[이메일] 통합 필드 감지:", regularFields.length + "개");
      for (const field of regularFields) {
        await fillField(field.element, fullEmail);
        usedFields.add(field.element);
        filledCount++;
      }
    }

    // 확인 필드도 채우기 (fillConfirmation이 true일 때)
    if (fillConfirmation && confirmFields.length > 0) {
      console.log("[이메일] 확인 필드 감지:", confirmFields.length + "개");
      for (const field of confirmFields) {
        await fillField(field.element, fullEmail);
        usedFields.add(field.element);
        filledCount++;
      }
    }

    if (filledCount === 0) {
      console.log("[이메일] 매칭된 필드 없음. 검색된 필드:", emailFields);
    }
  }

  return filledCount;
}

// 날짜 분리 필드 처리 (년/월/일 또는 년-월-일 select/input) (V2: async)
async function fillDateFields(dateObj, keywords, savedData) {
  if (!dateObj || typeof dateObj !== "object") return 0;

  const { year, month, day } = dateObj;
  if (!year) return 0;

  // 페이지에서 날짜 관련 필드들 찾기
  const allInputs = Array.from(document.querySelectorAll("input, select"));
  const dateFields = [];

  allInputs.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;
    if (usedFields.has(input)) return;

    const fieldInfo = getFieldInfo(input);
    const text = `${fieldInfo.id} ${fieldInfo.name} ${fieldInfo.placeholder} ${fieldInfo.labelText} ${fieldInfo.className}`.toLowerCase();

    // year/month/day 패턴 감지
    let type = "unknown";
    if (/year|년|yyyy|yy/.test(text)) type = "year";
    else if (/month|월|mm/.test(text)) type = "month";
    else if (/day|일|dd/.test(text)) type = "day";

    // 날짜 관련 키워드 매칭 OR year/month/day 패턴이 있으면 날짜 필드로 인식
    const isDateField = keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    ) || type !== "unknown";

    if (isDateField && type !== "unknown") {
      dateFields.push({
        element: input,
        type: type,
        info: fieldInfo,
      });
    }
  });

  let filledCount = 0;

  // 년/월/일 분리 필드 찾기
  const yearField = dateFields.find((f) => f.type === "year");
  const monthField = dateFields.find((f) => f.type === "month");
  const dayField = dateFields.find((f) => f.type === "day");

  if (yearField || monthField || dayField) {
    // ��리된 필드에 입력
    console.log("[날짜] 분리 필드 감지:", { year, month, day });
    if (yearField && year) {
      await fillField(yearField.element, year);
      filledCount++;
    }
    if (monthField && month) {
      await fillField(monthField.element, month);
      filledCount++;
    }
    if (dayField && day) {
      await fillField(dayField.element, day);
      filledCount++;
    }
  } else if (dateFields.length === 1) {
    // 필드가 하나만 있으면 전체 날짜 입력
    const dateFormat = savedData?.personalInfo?.dateFormat || "hyphen";
    const formattedDate = formatDate(dateObj, dateFormat);
    await fillField(dateFields[0].element, formattedDate);
    filledCount++;
  }

  return filledCount;
}
