/* ==========================================================================
   FILE: wwwroot/assets/js/chat-message.js
   DESCRIPTION: Optimized client-side JavaScript for Chat message area interactions.
   AUTHOR: Antigravity (Solution Architect & Senior Front-end Developer)
   ========================================================================== */

(function () {
    "use strict";

    // --- Helpers ---
    function scrollToBottom(element) {
        if (!element) return;
        element.scrollTo({
            top: element.scrollHeight,
            behavior: "smooth"
        });
    }

    function initAutoScrollObserver(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Perform instant initial scroll on load
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 150);

        // Listen for new messages dynamically appended
        const observer = new MutationObserver(function (mutationsList) {
            let shouldScroll = false;
            for (const mutation of mutationsList) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    shouldScroll = true;
                    // Add micro fade-in animation trigger to new elements
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            node.classList.add("optimistic-enter");
                        }
                    });
                }
            }
            if (shouldScroll) {
                scrollToBottom(container);
            }
        });

        observer.observe(container, { childList: true, subtree: true });
        return observer;
    }

    function fixInputPlaceholders() {
        const inputIds = ["chatInputField", "roomInputField", "aiInputField"];
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.placeholder = "Đặt câu hỏi...";
                // Adjust textarea rows dynamically based on focus and content
                input.addEventListener("input", function() {
                    this.style.height = "auto";
                    this.style.height = (this.scrollHeight > 32 ? Math.min(this.scrollHeight, 100) : 32) + "px";
                });
            }
        });
    }

    // --- Core Setup on DOM Content Loaded ---
    function initChatMessageHelper() {
        // 1. Observe Staff Chat and AI Chat message areas
        initAutoScrollObserver("chatMessagesContainer");
        initAutoScrollObserver("chatAiMessagesContainer");

        // 2. Adjust placeholder and behavior on textareas
        fixInputPlaceholders();

        // 3. Fallback: Listen to click events on Quick Action buttons to trigger scroll on tab switch
        const triggerButtons = [
            "btnGoChatAi", "btnGoConversations", "btnBackToWelcome", "btnBackToConversations", "chatLauncher"
        ];
        triggerButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener("click", function () {
                    setTimeout(() => {
                        const containers = ["chatMessagesContainer", "chatAiMessagesContainer"];
                        containers.forEach(id => {
                            const c = document.getElementById(id);
                            if (c && c.style.display !== "none") {
                                c.scrollTop = c.scrollHeight;
                            }
                        });
                    }, 350); // wait for screen slider transition animation
                });
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initChatMessageHelper);
    } else {
        initChatMessageHelper();
    }
})();
