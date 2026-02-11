# AI Comment Genie

Enhance your LinkedIn networking with AI-powered comment suggestions.

## 🛑 The Problem (Why)

In the professional world, consistent engagement on LinkedIn is crucial for networking and visibility. However, many users face:
- **Writer's Block:** Staring at the comment box knowing you should say something, but not knowing what.
- **Time Constraints:** Reading long posts and formulating thoughtful, personalized responses takes significant time.
- **Generic Fatigue:** Falling back on "Great post!" or "Thanks for sharing," which adds little value to the conversation.

## 🎯 The Objective (Goal)

The goal of AI Comment Genie is to reduce the friction of networking by making high-quality engagement effortless. We aim to:
- Provide instant, context-aware comment suggestions.
- Ensure replies sound human, positive, and professional.
- Help users start meaningful conversations rather than just dropping generic acknowledgments.

## 🧠 The Approach

To solve this, we built a browser extension that sits directly within the LinkedIn interface:
1.  **Context Extraction:** The extension scans the DOM to identify the post author, the post content, and (if replying to a comment) the context of the thread.
2.  **Smart Prompting:** We construct a carefully engineered prompt that instructs the AI to match the language of the post, be concise (max 40 words for posts, 20 for replies), avoid excessive hashtags, and maintain a friendly, human tone.
3.  **Flexible AI Backend:** By using the **OpenRouter API**, the extension leverages powerful models (like GPT-4) to understand nuances in professional posts that simpler models might miss.
4.  **Native Integration:** A non-intrusive lightbulb icon is injected directly into the LinkedIn comment toolbar, making the tool available exactly when needed.

## 💡 The Solution

**AI Comment Genie** is a Chrome Extension that acts as your personal engagement assistant.

- **One-Click Generation:** Click the lightbulb icon in any comment box to generate a draft.
- **Context-Aware:** It reads the post you're looking at to ensure the comment is relevant.
- **Replie-to-Replies:** It works for both main post comments and replying to other users' comments.
- **Secure:** Your API key is stored locally in your browser's sync storage.
- **Customizable:** Uses OpenRouter, allowing you to switch models or track usage easily.

## 🚀 How to Use

1.  **Install:** Load the extension in Chrome (Developer Mode).
2.  **Setup:** Click the extension icon and enter your **OpenRouter API Key**.
3.  **Engage:** Go to LinkedIn, click the lightbulb icon in any comment box, and watch the magic happen!
