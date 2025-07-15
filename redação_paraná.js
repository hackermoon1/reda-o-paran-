(function() {
    if (window.redacaoProTool) {
        window.redacaoProTool.toggleMenu();
        return;
    }

    const redacaoProTool = {
        SCRIPT_NAME: "Redação PRO",
        CREDITS_AUTHOR: "hackermoon1",
        CREDITS_SUITE: "MoonScripts © 2025",
        CREDITS_DISCORD: "discord.gg/kmeuwvXTNH",
        CREDITS_GITHUB: "github.com/hackermoon1",
        DEFAULT_API_KEY: "AIzaSyDwql-z5sYEJKr3fE5wPFJuM7nJtYKmyZk",
        MODEL_NAME: 'gemini-2.0-flash',
        state: {
            isMenuVisible: false, isRunning: false, isTyping: false, isPageVerified: false,
            abortController: null, pageData: {}, generatedTitle: "", generatedText: "",
            currentStatus: { text: "Verificando...", type: "info" }
        },
        ui: {},

        init: function() {
            try {
                this.injectStyles();
                this.createUI();
                this.addEventListeners();
                this.verifyPage();
            } catch (error) {
                console.error(`[${this.SCRIPT_NAME}] Erro:`, error);
                alert(`Erro ao iniciar ${this.SCRIPT_NAME}: ${error.message}`);
            }
        },

        injectStyles: function() {
            const styles = `
                :root {
                    --rpro-cyan: #00e5ff; --rpro-cyan-glow: #34ffff; --rpro-bg-start: #0f2027; --rpro-bg-end: #2c5364;
                    --rpro-text-primary: #f0f0f0; --rpro-text-secondary: #a0a0a0; --rpro-danger: #ff453a;
                    --rpro-warning: #ff9f0a; --rpro-success: #32d74b; --rpro-info: #5ac8fa;
                    --rpro-shadow: 0 0 20px rgba(0, 229, 255, 0.15); --rpro-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    --rpro-ease-out: cubic-bezier(0.16, 1, 0.3, 1); --rpro-border-radius: 14px;
                }
                #rpro-toggle-button {
                    position: fixed; bottom: 20px; right: 20px; background: linear-gradient(145deg, var(--rpro-cyan), #00a3b6);
                    color: black; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 15px var(--rpro-cyan); z-index: 10000; transition: all 0.3s var(--rpro-ease-out); user-select: none; border: none;
                }
                #rpro-toggle-button:hover { transform: scale(1.1); box-shadow: 0 0 25px var(--rpro-cyan-glow); }
                #rpro-toggle-button svg { width: 22px; height: 22px; }
                #rpro-panel {
                    position: fixed; bottom: 80px; right: 20px; width: 300px; border-radius: var(--rpro-border-radius); box-shadow: var(--rpro-shadow);
                    padding: 16px; z-index: 9999; font-family: var(--rpro-font-stack); display: none; flex-direction: column; border: 1px solid var(--rpro-cyan);
                    opacity: 0; transform: translateY(20px) scale(0.95); transition: opacity 0.4s var(--rpro-ease-out), transform 0.4s var(--rpro-ease-out);
                    background: linear-gradient(145deg, var(--rpro-bg-start), var(--rpro-bg-end)); color: var(--rpro-text-primary); gap: 14px;
                }
                #rpro-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
                #rpro-status-display {
                    background-color: rgba(0,0,0,0.3); border: 1px solid; border-radius: 10px; padding: 10px;
                    display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; transition: all 0.3s ease;
                }
                #rpro-status-display.info { border-color: var(--rpro-info); color: var(--rpro-info); }
                #rpro-status-display.success { border-color: var(--rpro-success); color: var(--rpro-success); }
                #rpro-status-display.error { border-color: var(--rpro-danger); color: var(--rpro-danger); }
                #rpro-status-display.typing { border-color: var(--rpro-warning); color: var(--rpro-warning); }
                #rpro-status-display svg { width: 16px; height: 16px; flex-shrink: 0; }
                .rpro-button {
                    background-color: rgba(0, 0, 0, 0.3); color: var(--rpro-text-primary); border: 1px solid rgba(0, 229, 255, 0.3);
                    padding: 12px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; text-align: center;
                    transition: all 0.2s ease-out; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .rpro-button:hover:not(:disabled) { background-color: rgba(0, 229, 255, 0.1); border-color: var(--rpro-cyan-glow); color: var(--rpro-cyan-glow); box-shadow: 0 0 10px rgba(0, 229, 255, 0.2); }
                .rpro-button:disabled { color: #555 !important; cursor: not-allowed; opacity: 0.5; background-color: rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.1) !important; box-shadow: none; }
                .rpro-button svg { width: 18px; height: 18px; }
                #rpro-typing-controls .stop { border-color: var(--rpro-warning); color: var(--rpro-warning); }
                #rpro-typing-controls .stop:hover:not(:disabled) { background-color: rgba(255, 159, 10, 0.2); }
                input[type="range"] { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; }
                input[type="range"]::-webkit-slider-runnable-track { background: rgba(0,0,0,0.4); height: 4px; border-radius: 2px; }
                input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; margin-top: -6px; background-color: var(--rpro-cyan); height: 16px; width: 16px; border-radius: 50%; border: 2px solid var(--rpro-bg-end); }
                .rpro-footer { border-top: 1px solid rgba(0, 229, 255, 0.3); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--rpro-text-secondary); }
                #rpro-btn-sobre { background: none; border: none; padding: 5px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s; }
                #rpro-btn-sobre:hover { opacity: 1; }
                #rpro-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: none; align-items: center; justify-content: center; z-index: 10001; opacity: 0; transition: opacity 0.3s ease; }
                #rpro-modal-overlay.visible { display: flex; opacity: 1; }
                #rpro-modal-content { background: var(--rpro-bg-mid); border: 1px solid var(--rpro-cyan); padding: 25px; border-radius: var(--rpro-border-radius); text-align: center; color: var(--rpro-text-primary); display: flex; flex-direction: column; gap: 15px; width: 90%; max-width: 350px; }
                #rpro-modal-content h4 { margin: 0; font-size: 20px; color: var(--rpro-cyan); }
                #rpro-modal-content .modal-links { display: flex; flex-direction: column; gap: 10px; }
                #rpro-modal-content a { color: var(--rpro-text-secondary); text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; border-radius: 8px; transition: background-color 0.2s, color 0.2s; }
                #rpro-modal-content a:hover { color: var(--rpro-cyan-glow); background-color: rgba(0,0,0,0.2); }
                #rpro-modal-content a svg { width: 22px; height: 22px; }
            `;
            document.head.appendChild(document.createElement("style")).textContent = styles;
        },

        createUI: function() {
            const icons = {
                toggle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg>',
                generate: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8H16V6H14V8H12V10H14V12H16V10H18V8M13.5 18H10V16H7.5V13H5V10.5H2V8.5H5V6H7.5V3H10V6H12V8H9.5V10.5H12V13H14.5V16H17V13H19V10H21V13H19V18H13.5M7,18H5V21H7V18Z" /></svg>',
                type: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20,5H4C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5M20,17H4V7H20V17M13,9H15V11H13V9M13,13H15V15H13V13M9,9H11V11H9V9M9,13H11V15H9V13M5,9H7V11H5V9M5,13H7V15H5V13M17,13H19V15H17V13M17,9H19V11H17V9" /></svg>',
                stop: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18,18H6V6H18V18Z" /></svg>',
                clear: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>',
                info: '<svg fill="currentColor" width="18" height="18" viewBox="0 0 24 24"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>',
                github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.83,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" /></svg>',
                discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3,3.5C18.8,2.8 17.2,2.2 15.5,2L15.2,2.4C16.8,2.9 18.2,3.6 19.5,4.4C18.2,5.2 16.8,5.9 15.2,6.4L15.1,6.7C15.8,6.5 16.5,6.2 17.1,5.9C17.2,6 17.3,6 17.3,6.1C16.1,6.9 14.7,7.6 13.2,8.1L13,8.5C13.7,8.3 14.4,8.1 15.1,7.8C15,7.9 14.9,8 14.9,8C11.3,10.1 8.2,10.8 4.7,10.3C4.6,10.3 4.5,10.2 4.4,10.1C4.3,10.1 4.2,10 4.1,9.9C4,9.8 4,9.7 4,9.6C4.1,8.4 4.6,7.2 5.6,6.2C6.6,5.2 7.8,4.6 9,4.4C9.1,4.4 9.2,4.4 9.3,4.4C13,4.1 16.2,4.8 18.8,6.5C18.8,6.5 18.9,6.5 18.9,6.4C19.6,6 20.3,5.5 21,4.9C21,4.9 20.6,4.1 20.3,3.5M11.2,12.7C10.5,12.7 10,13.2 10,13.8C10,14.5 10.5,15 11.2,15C11.8,15 12.3,14.5 12.3,13.8C12.3,13.2 11.8,12.7 11.2,12.7M14.7,12.7C14,12.7 13.5,13.2 13.5,13.8C13.5,14.5 14,15 14.7,15C15.3,15 15.8,14.5 15.8,13.8C15.8,13.2 15.3,12.7 14.7,12.7Z" /></svg>'
            };
            this.icons = icons;

            const toggleButton = document.createElement('div');
            toggleButton.id = 'rpro-toggle-button';
            toggleButton.innerHTML = icons.toggle;
            document.body.appendChild(toggleButton);
            this.ui.toggleButton = toggleButton;

            const panel = document.createElement('div');
            panel.id = 'rpro-panel';
            panel.innerHTML = `
                <div id="rpro-status-display"></div>
                <button id="rpro-btn-analisar-gerar" class="rpro-button">${icons.generate} Analisar & Gerar</button>
                <div id="rpro-typing-controls">
                    <button id="rpro-btn-digitar" class="rpro-button">${icons.type} Começar Digitação</button>
                    <button id="rpro-btn-parar" class="rpro-button stop" style="display:none;">${icons.stop} Parar Digitação</button>
                </div>
                <button id="rpro-btn-limpar" class="rpro-button">${icons.clear} Limpar Redação</button>
                <input id="rpro-velocidade" type="range" min="1" max="7" value="3" step="2" title="Velocidade de Digitação">
                <div class="rpro-footer">
                    <span>by <strong>${this.CREDITS_AUTHOR}</strong> | ${this.CREDITS_SUITE}</span>
                    <button id="rpro-btn-sobre" title="Sobre">${icons.info}</button>
                </div>
            `;
            document.body.appendChild(panel);

            const modal = document.createElement('div');
            modal.id = 'rpro-modal-overlay';
            modal.innerHTML = `
                <div id="rpro-modal-content">
                    <h4>${this.SCRIPT_NAME}</h4>
                    <p>by <strong>${this.CREDITS_AUTHOR}</strong></p>
                    <div class="modal-links">
                        <a href="https://${this.CREDITS_GITHUB}" target="_blank">${icons.github} GitHub</a>
                        <a href="https://${this.CREDITS_DISCORD}" target="_blank">${icons.discord} Discord</a>
                    </div>
                    <button id="rpro-modal-close" class="rpro-button">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);

            Object.assign(this.ui, {
                panel, modalOverlay: modal, typingControls: document.getElementById('rpro-typing-controls'),
                statusDisplay: document.getElementById('rpro-status-display'),
                btnAnalisarGerar: document.getElementById('rpro-btn-analisar-gerar'),
                btnDigitar: document.getElementById('rpro-btn-digitar'), btnParar: document.getElementById('rpro-btn-parar'),
                btnLimpar: document.getElementById('rpro-btn-limpar'), btnSobre: document.getElementById('rpro-btn-sobre'),
                velocidadeSlider: document.getElementById('rpro-velocidade'),
                modalCloseBtn: document.getElementById('rpro-modal-close')
            });
        },

        addEventListeners: function() {
            this.ui.toggleButton.onclick = () => this.toggleMenu();
            this.ui.btnAnalisarGerar.onclick = () => this.runProcess(this.analisarEGerar);
            this.ui.btnDigitar.onclick = () => this.runProcess(this.digitarTexto, true);
            this.ui.btnParar.onclick = () => this.pararProcesso();
            this.ui.btnLimpar.onclick = () => this.limparTudo();
            this.ui.btnSobre.onclick = () => this.toggleModal(true);
            this.ui.modalOverlay.onclick = (e) => { if (e.target === this.ui.modalOverlay) this.toggleModal(false); };
            this.ui.modalCloseBtn.onclick = () => this.toggleModal(false);
        },

        runProcess: async function(processFunction, isTypingProcess = false) {
            if (this.state.isRunning) return;
            this.state.isRunning = true; this.state.isTyping = isTypingProcess;
            this.state.abortController = new AbortController(); this.updateUIState();
            try { await processFunction.call(this); } catch (error) {
                if (error.name !== 'AbortError') { console.error(`[${this.SCRIPT_NAME}] Erro:`, error); this.updateStatus({ text: error.message, type: "error" }); }
            } finally {
                this.state.isRunning = false; this.state.isTyping = false; this.state.abortController = null;
                if (this.state.isPageVerified && !this.state.currentStatus.text.includes("Parada")) this.updateStatus({ text: "Pronto", type: "success" });
                this.updateUIState();
            }
        },

        updateUIState: function() {
            const { isRunning, isTyping, isPageVerified, generatedText } = this.state;
            this.ui.btnAnalisarGerar.disabled = isRunning || !isPageVerified;
            this.ui.btnDigitar.style.display = isTyping ? 'none' : 'flex';
            this.ui.btnParar.style.display = isTyping ? 'flex' : 'none';
            this.ui.btnDigitar.disabled = isRunning || !generatedText;
            this.ui.btnLimpar.disabled = isRunning || !generatedText;
            this.ui.velocidadeSlider.disabled = isRunning;
        },

        updateStatus: function(status) {
            this.state.currentStatus = status;
            const icons = {
                info: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z M13,17H11V11H13V17M13,9H11V7H13V9Z"/></svg>',
                success: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z" /></svg>',
                error: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M17,17L13.41,13.41L17,9.82L15.59,8.41L12,12L8.41,8.41L7,9.82L10.59,13.41L7,17L8.41,18.41L12,14.83L15.59,18.41L17,17Z" /></svg>',
                typing: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20,5H4C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5M20,17H4V7H20V17M13,9H15V11H13V9M13,13H15V15H13V13M9,9H11V11H9V9M9,13H11V15H9V13M5,9H7V11H5V9M5,13H7V15H5V13M17,13H19V15H17V13M17,9H19V11H17V9" /></svg>'
            };
            this.ui.statusDisplay.className = `status-${status.type}`;
            this.ui.statusDisplay.innerHTML = `${icons[status.type]} <span>${status.text}</span>`;
        },
        
        verifyPage: function() {
            const isCorrectPage = document.querySelector('textarea[placeholder="Comece a escrever sua redação aqui..."]');
            this.state.isPageVerified = !!isCorrectPage;
            if (this.state.isPageVerified) { this.updateStatus({ text: "Pronto", type: "success" }); } 
            else { this.updateStatus({ text: "Página Incorreta", type: "error" }); }
            this.updateUIState();
        },
        
        analisarEGerar: async function() {
            this.updateStatus({ text: "Analisando...", type: "info" });
            const p = Array.from(document.querySelectorAll("p.MuiTypography-root"));
            const g = p.find(e => /artigo de opinião|conto|relato|dissertativo/i.test(e.textContent));
            if(!g) throw new Error("Gênero textual não encontrado.");
            const temaLabel = p.find(p => p.textContent.trim().startsWith("Tema:"));
            if(!temaLabel) throw new Error("Rótulo 'Tema:' não encontrado.");
            const t = temaLabel.nextElementSibling;
            if(!t) throw new Error("Texto do tema não encontrado.");
            const w = p.find(e => /de\s+\d+\s+até\s+\d+\s+palavras/i.test(e.textContent));
            if(!w) throw new Error("Contagem de palavras não encontrada.");
            const m = w.textContent.match(/(\d+)/g);
            this.state.pageData = { genero: g.textContent.trim(), tema: t.textContent.trim(), minPalavras: m[0], maxPalavras: m[1] };
            this.updateStatus({ text: "Gerando com IA...", type: "info" });
            const prompt = `Gênero:${this.state.pageData.genero}. Tema:"${this.state.pageData.tema}". Tamanho:${this.state.pageData.minPalavras} a ${this.state.pageData.maxPalavras} palavras. Crie um texto formal como um bom aluno, sem mencionar ser IA. Responda APENAS em JSON: {"titulo":"Seu Título","texto":"Seu texto com \\n\\n para parágrafos."}`;
            const u = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent?key=${this.DEFAULT_API_KEY}`;
            const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), signal: this.state.abortController.signal });
            if (!r.ok) throw new Error(`API Error ${r.status}`);
            const d = await r.json(); const c = d?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!c) throw new Error("Resposta da IA vazia.");
            const j = JSON.parse(c);
            this.state.generatedTitle = j.titulo || ""; this.state.generatedText = j.texto || "";
            this.updateStatus({ text: "Pronto para digitar", type: "success" });
        },

        digitarTexto: async function() {
            const { generatedTitle: t, generatedText: s } = this.state;
            if (!s) { this.updateStatus({ text: "Gere uma redação primeiro", type: "error" }); return; }
            this.updateStatus({ text: "Digitando...", type: "typing" });
            const e = this.findPageElements(); const v = parseInt(this.ui.velocidadeSlider.value);
            let cd, sd;
            switch (v) { case 1: cd = 80; sd = 250; break; case 5: cd = 15; sd = 60; break; case 7: cd = 0; sd = 0; break; default: cd = 30; sd = 120; break; }
            const type = async (el, txt, c, d) => {
                if (!el) return; el.focus();
                const vs = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
                for (const char of txt) {
                    if (this.state.abortController.signal.aborted) throw new Error("AbortError");
                    let st = el.selectionStart, en = el.selectionEnd, nt = el.value.substring(0, st) + char + el.value.substring(en), np = st + 1;
                    vs.call(el, nt); el.selectionStart = np; el.selectionEnd = np;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    await new Promise(r => setTimeout(r, (char === ' ' || char === '\n') ? d : c));
                }
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
            if (e.tituloInput && t) await type(e.tituloInput, t, cd, sd);
            await type(e.redacaoTextarea, s, cd, sd);
        },

        limparTudo: function() {
            this.state.generatedTitle = ""; this.state.generatedText = "";
            const e = this.findPageElements();
            if (e.tituloInput) { e.tituloInput.value = ""; e.tituloInput.dispatchEvent(new Event('input', { bubbles: true })); }
            e.redacaoTextarea.value = ""; e.redacaoTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            this.updateStatus({ text: "Campos limpos", type: "success" }); this.updateUIState();
        },
        
        pararProcesso: function() { if (this.state.isRunning && this.state.abortController) { this.state.abortController.abort(); this.updateStatus({ text: "Digitação Parada", type: "error" }); } },
        toggleMenu: function() { this.state.isMenuVisible = !this.state.isMenuVisible; this.ui.panel.classList.toggle('visible', this.state.isMenuVisible); },
        toggleModal: function(show) { this.ui.modalOverlay.classList.toggle('visible', show); },
        findPageElements: function() { const t = document.querySelector('input[name="titulo"]'), s = document.querySelector('textarea[placeholder="Comece a escrever sua redação aqui..."]'); if (!s) throw new Error("Campo de texto da redação não encontrado."); return { tituloInput: t, redacaoTextarea: s }; },
    };
    
    window.redacaoProTool = redacaoProTool;
    window.redacaoProTool.init();

})();
