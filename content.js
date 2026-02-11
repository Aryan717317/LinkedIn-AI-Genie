// ====================
// AI Comment Genie
// ====================

// Load apiKey from chrome storage
const _apiKey = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get("apiKey", (data) => {
      if (!data.apiKey) {
        alert("Please set your OpenRouter API key in the extension options.");
      }
      resolve(data.apiKey);
    });
  });
};

// Inject custom CSS
const genieStyle = document.createElement("style");
genieStyle.textContent = `
  .ai-genie-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
    border-radius: 50% !important;
    border: none !important;
    background: #0a66c2 !important;
    color: white !important;
    cursor: pointer !important;
    padding: 0 !important;
    margin: 2px 4px !important;
    transition: background 0.2s, transform 0.15s !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    z-index: 9999 !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
  }
  .ai-genie-btn:hover {
    background: #004182 !important;
    transform: scale(1.15) !important;
  }
  .ai-genie-btn:disabled {
    opacity: 0.5 !important;
    cursor: wait !important;
  }
  .ai-genie-btn svg {
    width: 14px !important;
    height: 14px !important;
    fill: white !important;
    pointer-events: none !important;
  }
`;
document.head.appendChild(genieStyle);

console.log("[AI Genie] Extension loaded");

// ---- DETECTION ----
const scanForEditors = () => {
  // Find ALL contenteditable elements and .ql-editor elements
  const editors = document.querySelectorAll(
    '[contenteditable="true"], .ql-editor'
  );

  editors.forEach((editor) => {
    // Already processed
    if (editor.dataset.aiGenieDone === "1") return;

    // Skip main post composer (modals, share-box, messaging)
    if (
      editor.closest('[role="dialog"]') ||
      editor.closest('[class*="share-box"]') ||
      editor.closest('[class*="share-creation"]') ||
      editor.closest('[class*="msg-"]') ||
      editor.closest('[class*="messaging"]')
    ) return;

    editor.dataset.aiGenieDone = "1";
    console.log("[AI Genie] Found comment editor, injecting button");
    createAndInjectButton(editor);
  });
};

// ---- BUTTON CREATION & INJECTION ----
const createAndInjectButton = (editor) => {
  const btn = document.createElement("button");
  btn.className = "ai-genie-btn";
  btn.type = "button";
  btn.title = "Generate AI Comment";
  btn.setAttribute("aria-label", "Generate AI Comment");
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5"/></svg>';

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.disabled = true;
    try {
      const prompt = buildPrompt(editor);
      const reply = await fetchSuggestion(prompt);
      if (reply) {
        editor.focus();
        editor.innerHTML = "<p>" + reply + "</p>";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        editor.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } catch (err) {
      console.error("[AI Genie] Error:", err);
    } finally {
      btn.disabled = false;
    }
  });

  // ---- FIND WHERE TO PUT THE BUTTON ----
  // Walk up from editor to find the emoji/image buttons row
  let injected = false;
  let ancestor = editor.parentElement;

  for (let depth = 0; depth < 6 && ancestor && !injected; depth++) {
    // Look for sibling/cousin buttons that have SVGs (emoji, image icons)
    const buttons = ancestor.querySelectorAll("button");
    for (const existing of buttons) {
      // Skip our own button and any button inside the editor
      if (existing.classList.contains("ai-genie-btn")) continue;
      if (editor.contains(existing)) continue;

      const hasSvg = existing.querySelector("svg") || existing.querySelector("li-icon");
      if (hasSvg) {
        existing.parentElement.insertBefore(btn, existing);
        injected = true;
        console.log("[AI Genie] Injected next to action button at depth", depth);
        break;
      }
    }
    ancestor = ancestor.parentElement;
  }

  // Fallback: float over the right side of the editor
  if (!injected) {
    const wrapper = editor.parentElement;
    if (wrapper) {
      wrapper.style.position = wrapper.style.position || "relative";
      btn.style.cssText += "position:absolute !important; right:6px !important; top:50% !important; transform:translateY(-50%) !important;";
      wrapper.appendChild(btn);
      console.log("[AI Genie] Injected as overlay (fallback)");
    }
  }
};

// ---- PROMPT BUILDING ----
const buildPrompt = (editor) => {
  // Walk up to find the post container
  let postEl = editor;
  for (let i = 0; i < 15 && postEl; i++) {
    postEl = postEl.parentElement;
    if (!postEl) break;
    // Check for common post wrapper patterns
    if (
      postEl.classList.toString().includes("feed-shared-update") ||
      postEl.classList.toString().includes("occludable-update") ||
      postEl.dataset.id
    ) break;
  }

  // Try to extract author and text from the post
  let author = "";
  let text = "";

  if (postEl) {
    // Author: look for visually-hidden spans inside actor name areas
    const authorEl = postEl.querySelector(
      '[class*="actor__name"] .visually-hidden, [class*="actor__title"] .visually-hidden'
    );
    author = authorEl ? authorEl.innerText.trim() : "";

    // Post text: look for the post body
    const textEl = postEl.querySelector(
      '[class*="feed-shared-inline-show-more-text"], [class*="feed-shared-text"], [class*="update-components-text"]'
    );
    text = textEl ? textEl.innerText.trim() : "";
  }

  // If we couldnt find structured content, grab nearby visible text
  if (!text && postEl) {
    text = postEl.innerText.substring(0, 500);
  }

  let prompt = author ? (author + ' wrote: ' + text) : ('Post: ' + text);

  // Check if this is a reply to a comment
  let commentEl = editor;
  for (let i = 0; i < 8 && commentEl; i++) {
    commentEl = commentEl.parentElement;
    if (!commentEl) break;
    if (commentEl.classList.toString().includes("comment-item")) break;
  }

  if (commentEl && commentEl.classList.toString().includes("comment-item")) {
    const cAuthor = commentEl.querySelector('[class*="meta__name"] .visually-hidden');
    const cText = commentEl.querySelector('[class*="main-content"]');
    if (cAuthor && cText) {
      prompt += "\n" + cAuthor.innerText.trim() + " replied: " + cText.innerText.trim();
    }
    prompt += "\nPlease write a reply to the reply with a maximum of 20 words.";
  } else {
    prompt += "\nPlease write a reply to this post with a maximum of 40 words.";
  }

  return prompt;
};

// ---- API CALL ----
const fetchSuggestion = async (prompt) => {
  const apiKey = await _apiKey();
  if (!apiKey) return "";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "openai/gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an assistant, that writes replies to LinkedIn posts to other persons. Use the same language as of the text of the post you are receiving in the user's prompt. Please sound like a human being. Don't use hashtags, use emojis occasionally, don't repeat too many of the exact words, but simply create a brief and positive reply. Maybe add something to the discussion. Be creative! You may mention the name of the author, if it's the name of a natural person. Don't mention the name if it's the name of a company or a LinkedIn group."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 0.7,
      frequency_penalty: 2,
      presence_penalty: 2
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      "HTTP-Referer": "https://www.linkedin.com",
      "X-Title": "AI Comment Genie"
    }
  });

  const data = await response.json();
  if (data.error) {
    console.error("[AI Genie] API Error:", data.error);
    alert("AI Genie API Error: " + (data.error.message || JSON.stringify(data.error)));
    return "";
  }
  return data.choices[0].message.content.trim();
};

// ---- OBSERVERS & TIMERS ----
const observer = new MutationObserver(scanForEditors);
observer.observe(document.body, { childList: true, subtree: true });
setInterval(scanForEditors, 2000);
setTimeout(scanForEditors, 500);
setTimeout(scanForEditors, 1500);
