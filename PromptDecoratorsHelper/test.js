// ==UserScript==
// @name         AI 채팅 자동 입력 도우미 (Grok, ChatGPT, Claude, Gemini 등)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  콘솔에 붙여넣기만 하면 텍스트 자동 입력
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 여기만 수정하세요! ↓↓↓
    const textToType = `당신이 작성하고 싶은 긴 프롬프트나 텍스트를 여기에 넣으세요.

예시:
안녕하세요! 오늘은 자바스크립트로 자동 입력 스크립트를 만들어 보려고 합니다.
여러 줄도 가능하고, 엔터도 들어갑니다.

원하는 만큼 길게 작성하세요!`;

    const typingSpeed = 1; // 밀리초 단위 (값이 작을수록 빠름, 10~50 추천)

    // ==========================================================
    // 아래는 건드리지 마세요 (대부분의 AI 채팅 사이트에서 동작)
    // ==========================================================

    const selectors = [
        // Grok (grok.x.ai, x.com/grok)
        '#prompt-textarea',
        'textarea[data-id="root"]',

        // ChatGPT (chat.openai.com → chatgpt.com)
        '#prompt-textarea',
        'textarea[data-id="root"] textarea',
        'div.ProseMirror', // Send a message... 플레이스홀더

        // Claude (claude.ai)
        '[contenteditable="true"][data-placeholder*="Claude"]',
        '[contenteditable="true"][placeholder*="Claude"]',

        // Gemini (gemini.google.com)
        'textarea[placeholder*="Gemini에게 질문"]',
        'textarea[aria-label*="메시지 입력"]',
        'rich-textarea div[contenteditable="true"]',

        // Perplexity
        'textarea[placeholder*="Ask anything"]',

        // 공통 fallback
        'textarea[placeholder*="메시지"], textarea[placeholder*="Message"]',
        '[contenteditable="true"][data-placeholder*="메시지"]',
        '[contenteditable="true"]'
    ];

    let target = null;

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && (el.offsetParent !== null || getComputedStyle(el).display !== 'none')) {
            target = el;
            break;
        }
    }

    if (!target) {
        console.error('텍스트 입력창을 찾을 수 없습니다. 현재 페이지에서 지원되는지 확인해주세요.');
        alert('입력창을 찾지 못했습니다. Grok, ChatGPT, Claude, Gemini 등에서만 동작합니다.');
        return;
    }

    console.log('대상 입력창 발견:', target);

    // contenteditable인 경우와 textarea/input 구분
    function setText(element, text) {
        if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
            element.innerHTML = ''; // 초기화
            element.focus();

            // 텍스트 하나씩 입력 (실제 타이핑처럼 보임)
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    const char = text[i];
                    if (char === '\n') {
                        // document.execCommand('insertHTML', false, '<br>');
                        const shiftEnterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            shiftKey: true, // Shift 키가 눌린 상태로 설정
                            bubbles: true,
                            cancelable: true
                        });
                        document.execCommand('insertText', false, '\n');
                        element.dispatchEvent(shiftEnterEvent);
                    } else {
                        document.execCommand('insertText', false, char);
                    }
                    i++;
                    // 스크롤 따라가기
                    element.scrollTop = element.scrollHeight;
                } else {
                    clearInterval(interval);
                    console.log('모든 텍스트 입력 완료!');
                }
            }, typingSpeed);
        } else {
            // 일반 textarea
            element.focus();
            element.value = ''; // 초기화

            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.value += text[i];
                    i++;

                    // 이벤트 발생시켜서 React 등이 감지하게 함
                    ['input', 'change', 'keyup'].forEach(eventType => {
                        element.dispatchEvent(new Event(eventType, { bubbles: true }));
                    });

                    element.scrollTop = element.scrollHeight;
                } else {
                    clearInterval(interval);
                    console.log('모든 텍스트 입력 완료!');
                }
            }, typingSpeed);
        }
    }

    // 실행
    setTimeout(() => {
        setText(target, textToType);
    }, 800); // 페이지 로딩 완료 대기

})();