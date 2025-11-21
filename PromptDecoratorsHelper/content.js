/**
 * ============================================================================
 * Prompt Decorators Helper (Green Theme & Icon Image Ver.)
 * ============================================================================
 *
 * [주요 변경 사항]
 * 1. 테마 색상 변경: Red -> Green (#2e7d32)
 * 2. 아이콘 변경: 텍스트 -> 이미지 (icon.png)
 * 3. 버튼 배경: 투명화 (이미지 자체만 보이게 설정)
 * 4. 상세 주석 추가: 코드 유지보수를 위한 설명 강화
 *
 * @version 19.0
 */

(() => {
  // ============================================================================
  // 1. 초기화 및 중복 실행 방지
  // ============================================================================

  // iframe 내부에서는 실행하지 않고 최상위 프레임(window.top)에서만 실행합니다.
  if (window !== window.top) return;

  // 이미 스크립트가 로드되었다면 중복 실행을 막습니다.
  if (window.PDH_SHADOW_LOADED) return;
  window.PDH_SHADOW_LOADED = true;

  // ============================================================================
  // 2. 설정 변수 및 데이터 정의
  // ============================================================================

  // 데코레이터 목록을 가져올 GitHub 원본 파일 주소
  const RAW_URL = 'https://raw.githubusercontent.com/TaewonyNet/prompt-decorators-kor/refs/heads/main/prompt-decorators-kor.txt';

  // 타이핑 시뮬레이션 속도 (ms 단위, 낮을수록 빠름)
  const TYPING_SPEED = 1;

  // 호스트(도메인)별로 설정을 저장하기 위한 로컬 스토리지 키
  const STORAGE_KEY = `PDH_CONFIG_${window.location.hostname}`;

  // 아이콘 이미지 경로 (manifest.json에 등록된 리소스 URL 가져오기)
  const ICON_URL = chrome.runtime.getURL('icon.png');

  // LLM(AI 채팅) 사이트 목록 정의 (자동 감지용)
  const LLM_DOMAINS = [
    'chatgpt.com', 'openai.com', 'claude.ai', 'perplexity.ai',
    'gemini.google.com', 'copilot.microsoft.com', 'grok', 'x.com',
    'aistudio.google.com', 'poe.com'
  ];

  // 현재 접속한 사이트가 LLM 사이트인지 확인
  const isLLMSite = LLM_DOMAINS.some(domain => window.location.hostname.includes(domain));

  // 기본 설정 객체 (좌표 -1은 초기화 전 상태를 의미)
  let config = {
    x: -1,
    y: -1,
    visible: isLLMSite // LLM 사이트면 기본 보임, 아니면 숨김
  };

  // 저장된 사용자 설정이 있다면 불러와서 병합
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) config = { ...config, ...JSON.parse(saved) };
  } catch (e) {
    console.error('설정 로드 실패:', e);
  }

  // 오프라인이거나 Fetch 실패 시 사용할 기본 데이터
  const FALLBACK_DATA = `#### \`++기본\`\n기본 데코레이터입니다.\n-------------------\n#### \`++요약\`\n위 내용을 요약해줘.`;

  let rawFileContent = ''; // 원본 텍스트 저장용
  let decorators = [];     // 파싱된 데코레이터 리스트

  // ============================================================================
  // 3. Shadow DOM 스타일 정의 (초록색 테마 적용)
  // ============================================================================

  const STYLES = `
    /* 모든 요소의 스타일 초기화 (웹사이트 CSS 충돌 방지) */
    :host { all: initial; font-family: system-ui, sans-serif; }
    * { box-sizing: border-box; }

    /* [메인 버튼] 이미지 아이콘 스타일 */
    #pdh-btn {
      position: fixed; 
      width: 32px; height: 32px; /* 아이콘 크기 */
      background: transparent; /* 배경색 제거 */
      border-radius: 50%;
      cursor: grab; 
      z-index: 2147483647; /* 최상위 레이어 */
      /* 그림자만 살짝 주어 가독성 확보 */
      filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));
      user-select: none; 
      transition: transform 0.1s;
      /* 이미지를 중앙에 꽉 차게 표시 */
      background-image: url('${ICON_URL}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    #pdh-btn:hover { transform: scale(1.1); } /* 호버 시 확대 효과 */
    #pdh-btn:active { cursor: grabbing; }

    /* [닫기 버튼] 아이콘 우상단 작은 X 버튼 */
    #pdh-btn-close {
      position: absolute; top: -2px; right: -2px; 
      width: 14px; height: 14px;
      background: #333; color: #fff; border-radius: 50%;
      font-size: 10px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: 0; transition: opacity 0.2s; 
      border: 1px solid #fff;
    }
    #pdh-btn:hover #pdh-btn-close { opacity: 1; } /* 마우스 올렸을 때만 표시 */

    /* [모달 창] 데코레이터 목록 컨테이너 */
    #pdh-modal {
      position: fixed; width: 300px; max-height: 70vh;
      background: #fff; 
      border-radius: 12px; 
      box-shadow: 0 15px 50px rgba(0,0,0,.4);
      z-index: 2147483647; 
      border: 2px solid #2e7d32; /* 테두리: 초록색 */
      display: none; 
      overflow: hidden; 
      flex-direction: column;
    }

    /* [모달 헤더] */
    #pdh-header {
      padding: 8px 12px; 
      background: #2e7d32; /* 헤더 배경: 초록색 */
      color: #fff;
      font-weight: 800; font-size: 12px; 
      display: flex; justify-content: space-between; align-items: center; 
      flex-shrink: 0;
    }
    #pdh-close { cursor: pointer; font-size: 18px; }

    /* [모달 본문] */
    #pdh-body { 
      padding: 10px; 
      overflow-y: auto; 
      font-size: 12px; line-height: 1.5; color: #333; 
    }

    /* [리스트 아이템] 각 데코레이터 버튼 */
    .pdh-item {
      position: relative; 
      margin: 6px 0; padding: 8px 10px; 
      background: #e8f5e9; /* 배경: 연한 초록색 */
      border: 1px solid #c8e6c9; /* 테두리: 조금 진한 연두색 */
      border-radius: 8px; 
      cursor: pointer; transition: .1s;
    }
    .pdh-item:hover { 
      background: #c8e6c9; /* 호버 시 배경 */
      border-color: #43a047; /* 호버 시 테두리 */
      z-index: 10; 
    }
    .pdh-item strong { 
      font-size: 12px; 
      color: #1b5e20; /* 텍스트: 짙은 초록색 */
      display: block; 
    }

    /* [툴팁] 마우스 호버 시 나오는 설명창 */
    .pdh-tooltip {
      display: none; 
      position: absolute; left: 10px; top: 100%; 
      width: 260px;
      background: rgba(27, 94, 32, 0.95); /* 배경: 짙은 초록 투명도 */
      color: #fff;
      padding: 8px 10px; border-radius: 6px; 
      font-size: 11px; line-height: 1.4;
      white-space: pre-wrap; 
      z-index: 999; 
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      pointer-events: none; 
      margin-top: 5px;
    }
    .pdh-item:hover .pdh-tooltip { display: block; }

    /* [초기화 버튼] */
    .pdh-init { 
      background: #2e7d32 !important; /* 배경: 초록색 */
      color: #fff !important; 
      font-weight: 900; text-align: center; 
    }
    
    /* [토스트 알림] 하단 메시지 */
    #pdh-toast {
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); /* 검정 반투명 */
      color: #fff; padding: 8px 16px; border-radius: 20px;
      font-size: 12px; z-index: 2147483647; 
      opacity: 0; visibility: hidden; transition: all .3s; pointer-events: none;
    }
    #pdh-toast.show { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(-10px); }
  `;

  // ============================================================================
  // 4. Shadow DOM 생성 및 UI 구조 조립
  // ============================================================================

  // 호스트 엘리먼트 생성 (Shadow DOM의 뿌리)
  const host = document.createElement('div');
  host.id = 'pdh-host';
  document.body.appendChild(host);

  // Shadow DOM 오픈 (웹사이트 스타일 격리)
  const shadow = host.attachShadow({ mode: 'open' });

  // 스타일 태그 주입
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  shadow.appendChild(styleEl);

  // UI HTML 구조 생성
  const uiWrapper = document.createElement('div');
  uiWrapper.innerHTML = `
    <div id="pdh-btn">
      <div id="pdh-btn-close" title="숨기기">×</div>
    </div>
    
    <div id="pdh-modal">
      <div id="pdh-header">Prompt Helper <span id="pdh-close">×</span></div>
      <div id="pdh-body">로딩 중...</div>
    </div>
    
    <div id="pdh-toast"></div>
  `;
  shadow.appendChild(uiWrapper);

  // 내부 요소 참조 변수 할당
  const btn = shadow.querySelector('#pdh-btn');
  const btnClose = shadow.querySelector('#pdh-btn-close');
  const modal = shadow.querySelector('#pdh-modal');
  const closeBtn = shadow.querySelector('#pdh-close');
  const body = shadow.querySelector('#pdh-body');
  const toast = shadow.querySelector('#pdh-toast');

  // ============================================================================
  // 5. 위치 및 가시성 관리 (설정 저장/로드)
  // ============================================================================

  // 현재 설정을 로컬 스토리지에 저장
  const saveConfig = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  // 설정값에 따라 버튼 및 모달 표시 여부 적용
  const applyVisibility = () => {
    btn.style.display = config.visible ? 'flex' : 'none';
    // 버튼이 숨겨지면 모달도 같이 숨김
    if (!config.visible) modal.style.display = 'none';
  };

  // 초기 위치 설정 (스크롤바 영역 고려)
  const initPosition = () => {
    if (config.x === -1 || config.y === -1) {
      // 초기 위치: 우측 상단
      const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
      const safeRight = scrollBarW + 20;
      btn.style.left = (window.innerWidth - 42 - safeRight) + 'px';
      btn.style.top = '80px';
    } else {
      // 저장된 위치 복구
      btn.style.left = config.x + 'px';
      btn.style.top = config.y + 'px';
    }
    applyVisibility();
  };

  // ============================================================================
  // 6. 드래그 앤 드롭 & 도킹 시스템 (UI 인터랙션)
  // ============================================================================

  let isDragging = false;
  let dragStartTime = 0;
  let startX, startY, initialLeft, initialTop;

  // 드래그 시작 이벤트
  btn.addEventListener('mousedown', (e) => {
    if (e.target === btnClose) return; // 닫기 버튼 클릭 시 드래그 방지
    isDragging = false;
    dragStartTime = Date.now();

    startX = e.clientX;
    startY = e.clientY;
    const rect = btn.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    e.preventDefault(); // 텍스트 선택 등 기본 동작 방지

    // 전역 이벤트 리스너 추가 (마우스가 버튼 밖으로 나가도 추적)
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // 드래그 중 이동 처리
  const onMouseMove = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 약간의 움직임(3px)은 클릭으로 간주하기 위해 드래그로 치지 않음
    if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) isDragging = true;

    if (isDragging) {
      btn.style.left = `${initialLeft + dx}px`;
      btn.style.top = `${initialTop + dy}px`;
    }
  };

  // 드래그 종료 처리
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (isDragging) {
      dockToEdge(); // 드래그가 끝났으면 벽으로 붙이기
    } else if (Date.now() - dragStartTime < 200) {
      toggleModal(); // 짧은 클릭이면 모달 열기/닫기
    }
  };

  // 화면 가장자리로 아이콘을 붙이는 함수 (스마트 도킹)
  const dockToEdge = () => {
    const rect = btn.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
    const margin = 10;

    let tx = rect.left, ty = rect.top;

    // 좌우 도킹 결정 (화면 중앙 기준)
    if (rect.left + rect.width / 2 < winW / 2) {
      tx = margin; // 왼쪽으로
    } else {
      tx = winW - rect.width - margin - scrollBarW; // 오른쪽으로 (스크롤바 회피)
    }

    // 상하 안전지대 (화면 밖으로 나가는 것 방지)
    if (ty < margin) ty = margin;
    if (ty > winH - rect.height - margin) ty = winH - rect.height - margin;

    // 애니메이션 효과와 함께 이동
    btn.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    btn.style.left = tx + 'px';
    btn.style.top = ty + 'px';

    // 위치 저장
    config.x = tx;
    config.y = ty;
    saveConfig();

    // 애니메이션 종료 후 transition 제거 (드래그 반응성 확보)
    setTimeout(() => { btn.style.transition = ''; }, 300);
  };

  // 윈도우 크기 변경 시 위치 재조정
  window.addEventListener('resize', dockToEdge);

  // ============================================================================
  // 7. 모달 위치 스마트 계산 로직
  // ============================================================================

  const toggleModal = () => {
    if (getComputedStyle(modal).display === 'none') {
      modal.style.display = 'flex';

      const btnRect = btn.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const gap = 12;

      // 아이콘이 화면 오른쪽에 있으면 모달을 왼쪽에 표시
      if (btnRect.left > winW / 2) {
        modal.style.left = (btnRect.left - modalRect.width - gap) + 'px';
      } else {
        // 아이콘이 왼쪽에 있으면 모달을 오른쪽에 표시
        modal.style.left = (btnRect.right + gap) + 'px';
      }

      // 상하 위치 조정 (화면 위아래 뚫고 나가지 않도록)
      let topPos = btnRect.top;
      if (topPos + modalRect.height > winH - 20) topPos = winH - modalRect.height - 20;
      if (topPos < 20) topPos = 20;

      modal.style.top = topPos + 'px';
    } else {
      modal.style.display = 'none';
    }
  };

  // ============================================================================
  // 8. 이벤트 핸들러 (메시지 수신, 닫기 등)
  // ============================================================================

  // 확장 프로그램 아이콘 클릭 시 메시지 수신 (복구 기능)
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'TOGGLE_PDH') {
      config.visible = !config.visible;
      // 다시 켰는데 위치가 숨겨져 있는 경우(display:none) 위치 초기화 수행
      if (config.visible && btn.style.display === 'none') initPosition();

      saveConfig();
      applyVisibility();
      showToast(config.visible ? '아이콘 활성화' : '아이콘 숨김');
    }
  });

  // 아이콘의 X 버튼 클릭 시 숨김 처리
  btnClose.addEventListener('click', (e) => {
    e.stopPropagation();
    config.visible = false;
    saveConfig();
    applyVisibility();
  });

  // 모달의 X 버튼 클릭 시 모달만 닫기
  closeBtn.onclick = () => (modal.style.display = 'none');

  // 모달 외부 클릭 시 닫기 기능
  document.addEventListener('click', (e) => {
    if (modal.style.display !== 'none' && !host.contains(e.target)) {
      modal.style.display = 'none';
    }
  });

  // ============================================================================
  // 9. 텍스트 입력 및 데코레이터 로직
  // ============================================================================

  /**
   * 현재 페이지에서 유효한 입력창 요소를 찾습니다.
   * 다양한 AI 사이트의 선택자를 순회하며 확인합니다.
   */
  const getInputElement = () => {
    const selectors = [
      '#prompt-textarea',          // ChatGPT
      'div.ProseMirror',           // Perplexity
      '[contenteditable="true"]',  // Claude, General
      'textarea'                   // Fallback
    ];
    for (const s of selectors) {
      const els = document.querySelectorAll(s);
      for (const el of els) {
        // 화면에 보이고 높이가 있는 요소만 반환
        if (el.offsetParent !== null && el.getBoundingClientRect().height > 0) return el;
      }
    }
    return document.activeElement; // 최후의 수단
  };

  // React 등의 상태 동기화를 위해 강제 이벤트 발생
  const triggerEvents = (el) => {
    ['input', 'change', 'keyup'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
  };

  /**
   * [초기화용] 붙여넣기 방식 입력
   * 대량의 텍스트를 한 번에 빠르게 입력합니다.
   */
  const pasteTextFast = (el, text) => {
    el.focus();
    // 기존 내용 삭제
    if (el.isContentEditable) el.innerText = ''; else el.value = '';

    // execCommand 사용 시도 (가장 호환성 좋음)
    if (!document.execCommand('insertText', false, text)) {
      // 실패 시 직접 주입 (Fallback)
      if (el.isContentEditable) el.innerText = text; else el.value = text;
    }
    triggerEvents(el);
  };

  /**
   * [데코레이터용] 타이핑 시뮬레이션 입력
   * 한 글자씩 입력하여 Rich Text Editor와의 호환성을 높입니다.
   */
  let typingInterval;
  const typeTextSimulated = (el, text) => {
    if (typingInterval) clearInterval(typingInterval);
    el.focus();

    // 기존 내용이 있고 개행으로 끝나지 않았다면 줄바꿈 추가
    let cur = el.isContentEditable ? el.innerText : el.value;
    if (cur && cur.trim().length > 0 && !cur.endsWith('\n')) text = '\n' + text;

    // 커서를 맨 끝으로 이동
    if (el.isContentEditable) {
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } else {
      el.selectionStart = el.selectionEnd = el.value.length;
    }

    // 타이핑 루프 시작
    let i = 0;
    typingInterval = setInterval(() => {
      if (i < text.length) {
        const char = text[i];
        // Perplexity 등에서 줄바꿈이 무시되는 문제 해결 (Shift+Enter 이벤트)
        if (char === '\n' && el.isContentEditable) {
           el.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', keyCode:13, shiftKey:true, bubbles:true }));
           document.execCommand('insertText', false, '\n');
        } else {
           document.execCommand('insertText', false, char);
        }
        i++;
        el.scrollTop = el.scrollHeight; // 스크롤 따라가기
      } else {
        clearInterval(typingInterval);
        triggerEvents(el);
      }
    }, TYPING_SPEED);
  };

  // 데코레이터 추가 함수
  const addDecorator = (cmd) => {
    const input = getInputElement();
    if (!input) return showToast('입력창을 찾을 수 없습니다.');

    const currentText = input.isContentEditable ? input.innerText : input.value;
    if (currentText.includes(cmd)) return showToast('이미 추가된 내용입니다.');

    typeTextSimulated(input, cmd);
  };

  // 토스트 메시지 표시 함수
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  };

  // 데코레이터 목록 렌더링 함수
  const renderDecorators = (text) => {
    rawFileContent = text;
    body.innerHTML = ''; // 기존 목록 초기화

    // 초기화 버튼 생성
    const initBtn = document.createElement('div');
    initBtn.className = 'pdh-item pdh-init';
    initBtn.textContent = '초기화 (전체 입력)';
    initBtn.onclick = () => {
      const i = getInputElement();
      if(i) { pasteTextFast(i, rawFileContent.trim()); showToast('전체 입력 완료'); }
    };
    body.appendChild(initBtn);

    // 구분선(---)으로 텍스트 분리 후 버튼 생성
    text.split(/---+/).forEach(b => {
      const m = b.match(/####\s*`(\++[^`]+)`/); // 명령어 추출 정규식
      if (m) {
        const el = document.createElement('div');
        el.className = 'pdh-item';
        // 명령어와 설명(툴팁) 설정
        el.innerHTML = `<strong>${m[1].trim()}</strong><div class="pdh-tooltip">${b.slice(b.indexOf(m[0])+m[0].length).trim()}</div>`;
        el.onclick = () => addDecorator(m[1].trim());
        body.appendChild(el);
      }
    });
  };

  // ============================================================================
  // 10. 실행 진입점
  // ============================================================================

  initPosition(); // 위치 초기화

  // GitHub 데이터 가져오기
  fetch(RAW_URL, { cache: 'no-store' })
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(renderDecorators)
    .catch(() => {
      // 네트워크 오류 시 기본 데이터 사용
      renderDecorators(FALLBACK_DATA);
    });
})();