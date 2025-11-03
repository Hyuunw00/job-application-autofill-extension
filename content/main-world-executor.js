// Main World에서 실행되는 코드 (CSP 제약 없음)

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
