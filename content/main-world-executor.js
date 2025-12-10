// Main World에서 실행되는 코드 (CSP 제약 없음)

// ===== 헬퍼 함수 정의 (AI 코드에서 사용 가능) =====

/**
 * Input 값 설정 (React/Vue 호환)
 */
window.__setInputValue = function(el, value) {
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

/**
 * Textarea 값 설정 (React/Vue 호환)
 */
window.__setTextareaValue = function(el, value) {
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  )?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

/**
 * Select 값 설정
 */
window.__setSelectValue = function(el, value) {
  if (!el) return false;
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

/**
 * Checkbox/Radio 체크
 */
window.__setChecked = function(el, checked = true) {
  if (!el) return false;
  el.checked = checked;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

/**
 * 요소 클릭
 */
window.__clickElement = function(el) {
  if (!el) return false;
  el.click();
  return true;
};

/**
 * ID로 요소 찾기 (특수문자 안전, name fallback)
 */
window.__getById = function(id) {
  // 1. 먼저 getElementById 시도
  let el = document.getElementById(id);

  // 2. 실패하면 getElementsByName으로 fallback
  if (!el) {
    const byName = document.getElementsByName(id);
    if (byName.length > 0) el = byName[0];
  }

  // 3. 그래도 실패하면 CSS selector 시도 (특수문자 이스케이프)
  if (!el) {
    try {
      const escaped = CSS.escape(id);
      el = document.querySelector(`#${escaped}`) ||
           document.querySelector(`[name="${escaped}"]`);
    } catch (e) {
      // CSS.escape 실패 시 무시
    }
  }

  return el;
};

/**
 * Name으로 요소 찾기 (특수문자 안전, ID fallback)
 */
window.__getByName = function(name) {
  // 1. 먼저 getElementsByName 시도
  const elements = document.getElementsByName(name);
  if (elements.length > 0) return elements[0];

  // 2. 실패하면 getElementById로 fallback
  let el = document.getElementById(name);
  if (el) return el;

  // 3. 그래도 실패하면 CSS selector 시도 (특수문자 이스케이프)
  try {
    const escaped = CSS.escape(name);
    el = document.querySelector(`[name="${escaped}"]`) ||
         document.querySelector(`#${escaped}`);
  } catch (e) {
    // CSS.escape 실패 시 무시
  }

  return el || null;
};

// Content Script로부터 코드 실행 요청 받기
window.addEventListener('message', async (event) => {
  // 보안: 같은 origin에서 온 메시지만 처리
  if (event.source !== window) return;

  if (event.data.type === 'AUTOFILL_EXECUTE_CODE') {
    const { code, executionId } = event.data;

    try {
      console.log('[Main World] 코드 실행 시작');

      // AI 생성 코드를 eval로 실행 (Main World에서는 가능)
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const executor = new AsyncFunction(code);
      await executor();

      console.log('[Main World] 코드 실행 완료');

      // 성공 응답
      window.postMessage({
        type: 'AUTOFILL_EXECUTION_RESULT',
        executionId: executionId,
        success: true
      }, '*');

    } catch (error) {
      console.warn('[Main World] 실행 중 오류 발생 (일부 성공 가능):', error.message);

      // 에러가 발생해도 부분적으로 성공했을 수 있으므로 성공으로 처리
      // (예: 10개 필드 중 8개 성공, 2개 null 오류 → 8개는 채워짐)
      window.postMessage({
        type: 'AUTOFILL_EXECUTION_RESULT',
        executionId: executionId,
        success: true,
        warning: error.message
      }, '*');
    }
  }
});

console.log('[Main World] Executor 준비 완료');
