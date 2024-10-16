(function () {
    const vscode = acquireVsCodeApi();
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const loader = document.getElementById('loader');

    // Initialize marked with highlight.js
    marked.use(
        markedHighlight.markedHighlight({
            langPrefix: 'hljs language-',
            highlight(code, lang) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            },
        }),
    );

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            vscode.postMessage({ type: 'sendMessage', value: message });
            messageInput.value = '';
            showLoader();
            // Remove this line: addMessage('user', message);
        }
    }

    function addMessage(sender, content, snippet) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        let messageContent = '';
        if (content && content.length) {
            messageContent += marked.parse(content);
        }

        if (snippet) {
            messageContent += `<pre><code>${hljs.highlightAuto(snippet).value}</code></pre>`;
        }
        messageElement.innerHTML = `
            <div class="message-content">
                ${messageContent}
            </div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showLoader() {
        loader.style.display = 'block';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function clearMessages() {
        chatMessages.innerHTML = '';
    }

    function loadMessages(messages) {
        clearMessages();
        messages.forEach((message) => {
            addMessage(
                message.type === 'userMessage' ? 'user' : 'assistant',
                message.value,
                message.snippet,
            );
        });
    }

    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.type) {
            case 'userMessage':
                addMessage('user', message.value, null);
                addMessage('user', '', message.snippet);
                break;
            case 'assistantMessage':
                hideLoader();
                addMessage('assistant', message.value);
                break;
            case 'error':
                hideLoader();
                addMessage('error', message.value);
                break;
            case 'clearMessages':
                clearMessages();
                break;
            case 'loadMessages':
                loadMessages(message.messages);
                break;
        }
    });
    vscode.postMessage({ type: 'getMessages' });
})();
