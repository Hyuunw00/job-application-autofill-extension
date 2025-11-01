// 자동완성 메인 로직

// 저장된 데이터 (전역 변수)
let savedData = null;

// 자동완성 실행 (V2: async)
async function autoFillForm() {
  if (!savedData) {
    showNotification("저장된 데이터가 없습니다.", "error", []);
    return;
  }

  // 이전 자동완성의 테두리 제거
  document.querySelectorAll('input, textarea, select').forEach(field => {
    field.style.border = '';
  });

  // 사용된 필드 초기화
  clearUsedFields();
  clearFilledFieldsList();

  let filledCount = 0;
  let errorCount = 0;

  // 개인정보 자동완성
  if (savedData.personalInfo) {
    try {
      filledCount += await fillPersonalInfo(savedData.personalInfo);
    } catch (error) {
      console.error("개인정보 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 학력 자동완성
  if (savedData.education) {
    try {
      filledCount += await fillEducation(savedData.education);
    } catch (error) {
      console.error("학력 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 경력 자동완성
  if (savedData.careers) {
    try {
      filledCount += await fillCareers(savedData.careers);
    } catch (error) {
      console.error("경력 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 외부활동 자동완성
  if (savedData.activities) {
    try {
      filledCount += await fillActivities(savedData.activities);
    } catch (error) {
      console.error("외부활동 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 해외 경험 자동완성
  if (savedData.overseas) {
    try {
      filledCount += await fillOverseas(savedData.overseas);
    } catch (error) {
      console.error("해외 경험 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 어학점수 자동완성
  if (savedData.languageScores) {
    try {
      filledCount += await fillLanguageScores(savedData.languageScores);
    } catch (error) {
      console.error("어학점수 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 자격증 자동완성
  if (savedData.certificates) {
    try {
      filledCount += await fillCertificates(savedData.certificates);
    } catch (error) {
      console.error("자격증 자동완성 오류:", error);
      errorCount++;
    }
  }

  // 장애사항, 보훈여부 자동완성
  if (savedData.disabilityVeteran) {
    try {
      filledCount += await fillDisabilityVeteran(savedData.disabilityVeteran);
    } catch (error) {
      console.error("장애사항/보훈여부 자동완성 오류:", error);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    showNotification(
      `${filledCount}개 필드 자동완성 (${errorCount}개 섹션 오류)`,
      "success",
      getFilledFieldsList()
    );
  } else {
    showNotification(
      `${filledCount}개 필드가 자동완성되었습니다!`,
      "success",
      getFilledFieldsList()
    );
  }
}

// 개인정보 자동완성 (V2: async)
async function fillPersonalInfo(personalInfo) {
  const dateFormat = personalInfo.dateFormat || "hyphen";

  const mappings = [
    { data: personalInfo.name, keywords: ["이름", "name", "성명", "한글명"] },
    {
      data: formatDate(personalInfo.birthdate, dateFormat),
      keywords: ["생년월일", "birth", "생일", "출생"],
    },
    { data: personalInfo.gender, keywords: ["성별", "gender", "남녀"] },
    {
      data: personalInfo.nationality,
      keywords: ["국적", "nationality", "국가"],
    },
    {
      data: personalInfo.nameEnglish,
      keywords: ["영문명", "english", "영어이름"],
    },
    {
      data: personalInfo.nameChinese,
      keywords: ["한자명", "chinese", "한자이름"],
    },
    { data: personalInfo.address, keywords: ["주소", "address", "거주지"] },
    {
      data: personalInfo.militaryService,
      keywords: ["병역", "military", "군필", "미필"],
    },
  ];

  let filledCount = await fillFieldsByKeywords(mappings);

  // 생년월일 분리 필드 처리 (년/월/일)
  if (personalInfo.birthdate) {
    try {
      // 생년월일을 객체로 변환
      const birthdateObj = parseDateString(personalInfo.birthdate);
      if (birthdateObj) {
        const dateResult = await fillDateFields(
          birthdateObj,
          ["생년월일", "birth", "생일", "출생"],
          savedData
        );
        if (dateResult > 0) filledCount += dateResult;
      }
    } catch (error) {
      console.error("생년월일 분리 필드 입력 오류:", error);
    }
  }

  // 비밀번호 필드 처리 (2개까지 허용 - 비밀번호 + 비밀번호 확인)
  if (personalInfo.password) {
    try {
      const passwordKeywords = ["비밀번호", "password", "pw", "passwd"];

      // 첫 번째 비밀번호 필드
      const passwordField1 = findFieldByKeywords(passwordKeywords, 0);
      if (passwordField1) {
        await fillField(passwordField1, personalInfo.password);
        filledCount++;
      }

      // 두 번째 비밀번호 필드 (비밀번호 확인)
      const passwordField2 = findFieldByKeywords(passwordKeywords, 1);
      if (passwordField2) {
        await fillField(passwordField2, personalInfo.password);
        filledCount++;
      }
    } catch (error) {
      console.error("비밀번호 입력 오류:", error);
    }
  }

  // 전화번호 분리 필드 처리
  if (personalInfo.phone) {
    try {
      const phoneResult = await fillPhoneNumber(personalInfo.phone, ["phone", "휴대폰", "핸드폰", "연락처"]);
      if (phoneResult > 0) filledCount += phoneResult;
    } catch (error) {
      console.error("전화번호 입력 오류:", error);
    }
  }

  // 이메일 분리 필드 처리 (이메일 확인 필드 포함)
  if (personalInfo.email) {
    try {
      const emailResult = await fillEmailAddress(personalInfo.email, ["email", "이메일", "메일"], true);
      if (emailResult > 0) filledCount += emailResult;
    } catch (error) {
      console.error("이메일 입력 오류:", error);
    }
  }

  // 사진 파일 자동 첨부
  if (personalInfo.photo) {
    try {
      fillPhotoFields(personalInfo.photo);
      filledCount++;
    } catch (error) {
      console.error("사진 첨부 오류:", error);
    }
  }

  return filledCount;
}

// 학력 자동완성 (V2: async)
async function fillEducation(education) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  // 고등학교
  if (education.highschool) {
    const highschoolMappings = [
      {
        data: education.highschool.name,
        keywords: ["고등학교", "highschool", "고교"],
      },
      {
        data: formatDate(education.highschool.start, dateFormat),
        keywords: ["고등학교입학", "고교입학"],
      },
      {
        data: formatDate(education.highschool.graduation, dateFormat),
        keywords: ["고등학교졸업", "고교졸업"],
      },
      {
        data: education.highschool.type,
        keywords: ["고등학교계열", "고교계열"],
      },
    ];
    filledCount += await fillFieldsByKeywords(highschoolMappings);
  }

  // 대학교
  if (education.university) {
    const universityMappings = [
      {
        data: education.university.name,
        keywords: ["대학교", "university", "대학"],
      },
      {
        data: formatDate(education.university.start, dateFormat),
        keywords: ["대학교입학", "대학입학"],
      },
      {
        data: formatDate(education.university.graduation, dateFormat),
        keywords: ["대학교졸업", "대학졸업"],
      },
      {
        data: education.university.type,
        keywords: ["전공계열", "대학교계열", "대학계열"],
      },
      { data: education.university.major, keywords: ["전공", "major", "학과"] },
      { data: education.university.degree, keywords: ["학위", "degree"] },
      { data: education.university.gpa, keywords: ["학점", "gpa", "성적"] },
      {
        data: education.university.maxGpa,
        keywords: ["기준학점", "만점", "max"],
      },
    ];
    filledCount += await fillFieldsByKeywords(universityMappings);
  }

  return filledCount;
}

// 경력 자동완성 (V2: async)
async function fillCareers(careers) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  for (let index = 0; index < careers.length; index++) {
    const career = careers[index];
    const careerMappings = [
      {
        data: career.career_company,
        keywords: ["회사명", "company", "근무회사"],
      },
      {
        data: career.career_department,
        keywords: ["소속", "부서", "department"],
      },
      {
        data: career.career_position,
        keywords: ["직급", "직책", "position", "담당"],
      },
      {
        data: formatDate(career.career_start, dateFormat),
        keywords: ["재직시작", "입사", "start"],
      },
      {
        data: formatDate(career.career_end, dateFormat),
        keywords: ["재직종료", "퇴사", "end"],
      },
      {
        data: career.career_description,
        keywords: ["담당업무", "업무내용", "description"],
      },
    ];

    filledCount += await fillFieldsByKeywords(careerMappings, index);
  }

  return filledCount;
}

// 외부활동 자동완성 (V2: async)
async function fillActivities(activities) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  for (let index = 0; index < activities.length; index++) {
    const activity = activities[index];
    const activityMappings = [
      { data: activity.activity_type, keywords: ["활동분류", "분류", "type"] },
      {
        data: activity.activity_organization,
        keywords: ["기관", "장소", "organization"],
      },
      {
        data: formatDate(activity.activity_start, dateFormat),
        keywords: ["활동시작", "시작연월"],
      },
      {
        data: formatDate(activity.activity_end, dateFormat),
        keywords: ["활동종료", "종료연월"],
      },
      { data: activity.activity_name, keywords: ["활동명", "프로젝트명"] },
      {
        data: activity.activity_description,
        keywords: ["활동내용", "내용", "description"],
      },
    ];

    filledCount += await fillFieldsByKeywords(activityMappings, index);
  }

  return filledCount;
}

// 해외 경험 자동완성 (V2: async)
async function fillOverseas(overseas) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  for (let index = 0; index < overseas.length; index++) {
    const overseasItem = overseas[index];
    const overseasMappings = [
      { data: overseasItem.overseas_country, keywords: ["국가", "country"] },
      { data: overseasItem.overseas_purpose, keywords: ["목적", "purpose"] },
      {
        data: formatDate(overseasItem.overseas_start, dateFormat),
        keywords: ["해외시작", "시작기간"],
      },
      {
        data: formatDate(overseasItem.overseas_end, dateFormat),
        keywords: ["해외종료", "종료기간"],
      },
      {
        data: overseasItem.overseas_institution,
        keywords: ["기관", "학교명", "institution"],
      },
      {
        data: overseasItem.overseas_description,
        keywords: ["해외내용", "상세내용"],
      },
    ];

    filledCount += await fillFieldsByKeywords(overseasMappings, index);
  }

  return filledCount;
}

// 어학점수 자동완성 (V2: async)
async function fillLanguageScores(languageScores) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  for (let index = 0; index < languageScores.length; index++) {
    const score = languageScores[index];
    const scoreMappings = [
      {
        data: score.language_test_type,
        keywords: ["어학시험", "test", "종류"],
      },
      { data: score.language_score, keywords: ["점수", "score", "점"] },
      {
        data: formatDate(score.language_date, dateFormat),
        keywords: ["취득일", "date", "시험일"],
      },
      {
        data: formatDate(score.language_expiry, dateFormat),
        keywords: ["만료일", "expiry", "유효기간"],
      },
    ];

    filledCount += await fillFieldsByKeywords(scoreMappings, index);
  }

  return filledCount;
}

// 자격증 자동완성 (V2: async)
async function fillCertificates(certificates) {
  let filledCount = 0;
  const dateFormat = savedData.personalInfo.dateFormat || "hyphen";

  for (let index = 0; index < certificates.length; index++) {
    const certificate = certificates[index];
    const certificateMappings = [
      {
        data: certificate.certificate_name,
        keywords: ["자격증명", "certificate", "자격"],
      },
      {
        data: certificate.certificate_issuer,
        keywords: ["발급기관", "issuer", "기관"],
      },
      {
        data: certificate.certificate_registration_number,
        keywords: ["등록번호", "registration"],
      },
      {
        data: certificate.certificate_license_number,
        keywords: ["자격번호", "license"],
      },
      {
        data: formatDate(certificate.certificate_date, dateFormat),
        keywords: ["취득일", "date", "발급일"],
      },
    ];

    filledCount += await fillFieldsByKeywords(certificateMappings, index);
  }

  return filledCount;
}

// 장애사항, 보훈여부 자동완성 (V2: async)
async function fillDisabilityVeteran(disabilityVeteran) {
  const mappings = [
    {
      data: disabilityVeteran.disabilityStatus,
      keywords: ["장애사항", "disability"],
    },
    {
      data: disabilityVeteran.disabilityGrade,
      keywords: ["장애등급", "disability_grade"],
    },
    {
      data: disabilityVeteran.veteranStatus,
      keywords: ["보훈여부", "veteran"],
    },
    {
      data: disabilityVeteran.veteranGrade,
      keywords: ["보훈등급", "veteran_grade"],
    },
  ];

  return await fillFieldsByKeywords(mappings);
}
