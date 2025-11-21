/**
 * ============================================================================
 * Prompt Decorators Helper - Background Service Worker
 * ============================================================================
 * * 역할:
 * - 크롬 브라우저 우측 상단의 확장 프로그램 아이콘 클릭 이벤트 감지
 * - 클릭 시 현재 활성화된 탭으로 '아이콘 표시/숨김 토글' 메시지 전송
 */

chrome.action.onClicked.addListener((tab) => {
  // 탭 ID가 없거나 시스템 페이지인 경우 무시
  if (!tab.id) return;

  // 현재 탭의 content.js로 메시지 전송
  chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PDH' })
    .catch((err) => {
      // content.js가 로드되지 않은 페이지(예: 크롬 설정창)에서는 에러가 발생할 수 있음
      console.log('메시지 전송 실패 (확장 프로그램이 실행되지 않는 페이지일 수 있음):', err);
    });
});
