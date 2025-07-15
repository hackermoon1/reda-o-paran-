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
        DEFAULT_API_KEY: "AIzaSyBdDsGQed0NSTC8tGrOJygFWNsoOln3uQ0",
        MODEL_NAME: 'gemini-1.5-pro-latest',
        state: {
            isMenuVisible: false,
            isRunning: false,
            isStopping: false,
            apiKey: "",
            pageData: {},
            abortController: null,
            saveTimeout: null
        },
        ui: {},

        init: function() {
            try {
                this.injectStyles();
                this.createUI();
                this.addEventListeners();
                this.loadApiKey();
                this.updateUIState();
                this.showToast(`${this.SCRIPT_NAME} carregado!`, "success");
            } catch (error) {
                console.error(`[${this.SCRIPT_NAME}] Erro na inicialização:`, error);
                alert(`Erro ao iniciar ${this.SCRIPT_NAME}: ${error.message}`);
            }
        },

        injectStyles: function() {
            const styles = `
                :root {
                    --rpro-cyan: #00e5ff; --rpro-bg-start: #0f2027; --rpro-bg-end: #2c5364; --rpro-bg-mid: #203a43;
                    --rpro-text-primary: #e0e0e0; --rpro-text-secondary: #a0a0a0; --rpro-danger: #ff453a;
                    --rpro-warning: #ff9f0a; --rpro-success: #32d74b; --rpro-border-color: rgba(0, 229, 255, 0.2);
                    --rpro-shadow: 0 12px 35px rgba(0, 0, 0, 0.4); --rpro-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    --rpro-ease-out: cubic-bezier(0.16, 1, 0.3, 1); --rpro-border-radius: 14px;
                }
                #rpro-toggle-button {
                    position: fixed; bottom: 20px; right: 20px; background: linear-gradient(145deg, var(--rpro-cyan), #00a3b6);
                    color: black; width: 54px; height: 54px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 20px var(--rpro-cyan); z-index: 10000; transition: all 0.3s var(--rpro-ease-out); user-select: none; border: none;
                }
                #rpro-toggle-button:hover { transform: scale(1.1); box-shadow: 0 0 30px var(--rpro-cyan); }
                #rpro-toggle-button svg { width: 24px; height: 24px; }
                #rpro-panel {
                    position: fixed; bottom: 90px; right: 20px; width: 340px; border-radius: var(--rpro-border-radius); box-shadow: var(--rpro-shadow);
                    padding: 18px; z-index: 9999; font-family: var(--rpro-font-stack); display: none; flex-direction: column; border: 1px solid var(--rpro-border-color);
                    opacity: 0; transform: translateY(20px) scale(0.95); transition: opacity 0.4s var(--rpro-ease-out), transform 0.4s var(--rpro-ease-out);
                    background: linear-gradient(145deg, var(--rpro-bg-start), var(--rpro-bg-mid), var(--rpro-bg-end));
                    backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); color: var(--rpro-text-primary); gap: 14px;
                }
                #rpro-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
                .rpro-title-bar h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--rpro-cyan); text-shadow: 0 0 5px var(--rpro-cyan);}
                .rpro-button-group { display: grid; gap: 10px; }
                .rpro-button-group.grid-2 { grid-template-columns: 1fr 1fr; }
                .rpro-button {
                    background-color: rgba(0, 0, 0, 0.2); color: var(--rpro-text-primary); border: 1px solid var(--rpro-border-color);
                    padding: 11px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; text-align: center;
                    transition: all 0.2s ease-out; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
                }
                .rpro-button:hover:not(:disabled) { background-color: rgba(0, 229, 255, 0.15); border-color: var(--rpro-cyan); color: var(--rpro-cyan); }
                .rpro-button:disabled { background-color: rgba(0,0,0,0.2) !important; border-color: rgba(255,255,255,0.1) !important; color: #666 !important; cursor: not-allowed; opacity: 0.5; }
                .rpro-button.stop-button { border-color: var(--rpro-warning); color: var(--rpro-warning); }
                .rpro-button.stop-button:hover:not(:disabled) { background-color: rgba(255, 159, 10, 0.2); }
                .rpro-input, .rpro-textarea { width: 100%; box-sizing: border-box; background-color: rgba(0,0,0,0.3); border: 1px solid var(--rpro-border-color); color: var(--rpro-text-primary); border-radius: 8px; padding: 10px; font-size: 13px; font-family: var(--rpro-font-stack); }
                .rpro-textarea { min-height: 100px; resize: vertical; }
                .rpro-group { padding: 12px; background: rgba(0,0,0,0.2); border-radius: 12px; display: flex; flex-direction: column; gap: 10px; }
                #rpro-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: none; align-items: center; justify-content: center; z-index: 10001; opacity: 0; transition: opacity 0.3s ease; }
                #rpro-modal-overlay.visible { display: flex; opacity: 1; }
                #rpro-modal-content { background: var(--rpro-bg-mid); border: 1px solid var(--rpro-border-color); padding: 25px; border-radius: var(--rpro-border-radius); text-align: center; color: var(--rpro-text-primary); display: flex; flex-direction: column; gap: 15px; width: 90%; max-width: 400px; }
                #rpro-modal-content h4 { margin: 0; font-size: 20px; color: var(--rpro-cyan); }
                #rpro-modal-content a { color: var(--rpro-text-secondary); text-decoration: none; display: block; padding: 8px; border-radius: 8px; transition: background-color 0.2s, color 0.2s; }
                #rpro-modal-content a:hover { color: var(--rpro-cyan); background-color: rgba(0,0,0,0.2); }
            `;
            document.head.appendChild(document.createElement("style")).textContent = styles;
        },

        createUI: function() {
            const toggleButton = document.createElement('div');
            toggleButton.id = 'rpro-toggle-button';
            toggleButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg>`;
            document.body.appendChild(toggleButton);
            this.ui.toggleButton = toggleButton;

            const panel = document.createElement('div');
            panel.id = 'rpro-panel';
            panel.innerHTML = `
                <div class="rpro-title-bar"><h3>${this.SCRIPT_NAME}</h3></div>
                <div id="rpro-main-actions" class="rpro-button-group">
                    <button id="rpro-btn-analisar" class="rpro-button">Analisar</button>
                    <button id="rpro-btn-gerar" class="rpro-button">Gerar IA</button>
                    <button id="rpro-btn-digitar" class="rpro-button">Digitar</button>
                </div>
                <button id="rpro-btn-parar" class="rpro-button stop-button" style="display:none;">Parar Processo</button>
                <div id="rpro-editor" class="rpro-group" style="display:none;">
                    <input id="rpro-gen-title" class="rpro-input" placeholder="Título gerado...">
                    <textarea id="rpro-gen-text" class="rpro-textarea" placeholder="Texto gerado..."></textarea>
                    <input id="rpro-velocidade" type="range" min="1" max="7" value="3" step="2" title="Velocidade de Digitação">
                </div>
                <div class="rpro-group">
                    <input type="password" id="rpro-apikey" class="rpro-input" placeholder="Chave API Google Gemini">
                    <div class="rpro-button-group grid-2">
                        <button id="rpro-btn-limpar" class="rpro-button">Limpar Tudo</button>
                        <button id="rpro-btn-sobre" class="rpro-button">Sobre</button>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);

            const modal = document.createElement('div');
            modal.id = 'rpro-modal-overlay';
            modal.innerHTML = `
                <div id="rpro-modal-content">
                    <h4>${this.SCRIPT_NAME}</h4>
                    <p>by <strong>${this.CREDITS_AUTHOR}</strong> | ${this.CREDITS_SUITE}</p>
                    <div>
                        <a href="https://github.com/${this.CREDITS_GITHUB}" target="_blank">GitHub</a>
                        <a href="https://discord.gg/${this.CREDITS_DISCORD}" target="_blank">Discord</a>
                    </div>
                    <button id="rpro-modal-close" class="rpro-button">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);

            Object.assign(this.ui, {
                panel, modalOverlay: modal, mainActions: document.getElementById('rpro-main-actions'),
                btnAnalisar: document.getElementById('rpro-btn-analisar'),
                btnGerar: document.getElementById('rpro-btn-gerar'), btnDigitar: document.getElementById('rpro-btn-digitar'),
                btnLimpar: document.getElementById('rpro-btn-limpar'), btnSobre: document.getElementById('rpro-btn-sobre'),
                btnParar: document.getElementById('rpro-btn-parar'), apiKeyInput: document.getElementById('rpro-apikey'),
                editor: document.getElementById('rpro-editor'), genTitle: document.getElementById('rpro-gen-title'),
                genText: document.getElementById('rpro-gen-text'), velocidadeSlider: document.getElementById('rpro-velocidade'),
                modalCloseBtn: document.getElementById('rpro-modal-close')
            });
            this.createToastContainer();
        },

        addEventListeners: function() {
            this.ui.toggleButton.onclick = () => this.toggleMenu();
            this.ui.btnAnalisar.onclick = () => this.runProcess(this.analisarTema);
            this.ui.btnGerar.onclick = () => this.runProcess(this.gerarRedacao);
            this.ui.btnDigitar.onclick = () => this.runProcess(this.digitarTexto);
            this.ui.btnParar.onclick = () => this.pararProcesso();
            this.ui.btnLimpar.onclick = () => this.limparTudo();
            this.ui.btnSobre.onclick = () => this.toggleModal(true);
            this.ui.modalOverlay.onclick = (e) => { if (e.target === this.ui.modalOverlay) this.toggleModal(false); };
            this.ui.modalCloseBtn.onclick = () => this.toggleModal(false);
            this.ui.apiKeyInput.oninput = () => {
                clearTimeout(this.state.saveTimeout);
                this.state.saveTimeout = setTimeout(() => this.saveApiKey(), 750);
            };
        },

        runProcess: async function(processFunction) {
            if (this.state.isRunning) return;
            this.state.isRunning = true; this.state.isStopping = false;
            this.state.abortController = new AbortController(); this.updateUIState();
            try { await processFunction.call(this); } catch (error) {
                if (error.name === 'AbortError') { this.showToast("Processo cancelado.", "warning"); }
                else { console.error(`[${this.SCRIPT_NAME}] Erro:`, error); this.showToast(`Erro: ${error.message}`, "error"); }
            } finally {
                this.state.isRunning = false; this.state.isStopping = false;
                this.state.abortController = null; this.updateUIState();
            }
        },

        updateUIState: function() {
            const isRunning = this.state.isRunning;
            this.ui.mainActions.style.display = isRunning ? 'none' : 'block';
            this.ui.btnParar.style.display = isRunning ? 'flex' : 'none';
            this.ui.btnGerar.disabled = !this.state.pageData.tema || !this.state.apiKey;
            this.ui.btnDigitar.disabled = !this.ui.genText.value;
            this.ui.btnLimpar.disabled = !this.ui.genText.value && !this.ui.genTitle.value;
            this.ui.apiKeyInput.disabled = isRunning;
            this.ui.btnSobre.disabled = isRunning;
            this.ui.editor.style.display = (this.ui.genText.value || this.ui.genTitle.value) ? 'flex' : 'none';
        },

        pararProcesso: function() { if (this.state.isRunning && this.state.abortController) { this.state.isStopping = true; this.state.abortController.abort(); } },
        toggleMenu: function() { this.state.isMenuVisible = !this.state.isMenuVisible; this.ui.panel.classList.toggle('visible', this.state.isMenuVisible); },
        toggleModal: function(show) { this.ui.modalOverlay.classList.toggle('visible', show); },
        createToastContainer: function() { if (document.getElementById('rpro-toast-container')) return; const c = document.createElement('div'); c.id = 'rpro-toast-container'; c.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10001;display:flex;flex-direction:column;gap:10px;width:90%;max-width:450px;'; document.body.appendChild(c); this.ui.toastContainer = c; },
        showToast: function(msg, type = 'info', dur = 3500) { if (!this.ui.toastContainer) return; const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'background-color:var(--rpro-bg-mid);color:var(--rpro-text-primary);padding:14px 24px;border-radius:12px;box-shadow:var(--rpro-shadow);transition:all .4s ease-out;opacity:0;transform:translateY(-30px);text-align:center;'; if (type === 'error') { t.style.backgroundColor = 'var(--rpro-danger)'; t.style.color = '#fff'; } else if (type === 'success') { t.style.backgroundColor = 'var(--rpro-success)'; t.style.color = '#fff'; } this.ui.toastContainer.appendChild(t); requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-30px)'; setTimeout(() => t.parentElement?.removeChild(t), 500); }, dur); },
        saveApiKey: function() { const apiKey = this.ui.apiKeyInput.value.trim(); if (apiKey) { localStorage.setItem("rproApiKey", apiKey); this.state.apiKey = apiKey; this.showToast("Chave API salva automaticamente!", "success"); } else { localStorage.removeItem("rproApiKey"); this.state.apiKey = ""; } this.updateUIState(); },
        loadApiKey: function() { this.state.apiKey = localStorage.getItem("rproApiKey") || this.DEFAULT_API_KEY; this.ui.apiKeyInput.value = this.state.apiKey; if (!this.state.apiKey) { this.showToast("Insira uma chave API para começar.", "warning"); } },
        findPageElements: function() { const t = document.querySelector('input[name="titulo"]'), s = document.querySelector('textarea[placeholder="Comece a escrever sua redação aqui..."]'); if (!s) throw new Error("Campo da redação não encontrado."); return { tituloInput: t, redacaoTextarea: s }; },
        analisarTema: async function() { this.showToast("Analisando página..."); await new Promise(r => setTimeout(r, 300)); const p = Array.from(document.querySelectorAll("p.MuiTypography-root.MuiTypography-body2")), g = p.find(e => /artigo de opinião|conto|relato|dissertativo-argumentativo/i.test(e.textContent)), t = g ? g.parentElement.nextElementSibling?.querySelector("p")?.textContent : null, w = p.find(e => /de\s+\d+\s+até\s+\d+\s+palavras/i.test(e.textContent))?.textContent; if (!g || !t || !w) throw new Error("Dados do tema não encontrados."); const m = w.match(/(\d+)/g); if (!m || m.length < 2) throw new Error("Não foi possível ler o nº de palavras."); this.state.pageData = { genero: g.textContent.trim(), tema: t.trim(), minPalavras: m[0], maxPalavras: m[1] }; this.showToast(`Tema: ${this.state.pageData.genero}`, "success"); },
        apiCall: async function(prompt) { const u = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent?key=${this.state.apiKey}`; const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), signal: this.state.abortController.signal, }); if (!r.ok) { throw new Error(`API Error ${r.status}: ${await r.text()}`); } const d = await r.json(); if (this.state.isStopping) return null; const c = d?.candidates?.[0]?.content?.parts?.[0]?.text; if (!c) throw new Error("Resposta da IA veio vazia."); return c; },
        gerarRedacao: async function() { this.showToast("IA está gerando o texto..."); const p = `Você é um assistente de IA para redação. Gênero: ${this.state.pageData.genero}. Tema: "${this.state.pageData.tema}". Tamanho: ${this.state.pageData.minPalavras} a ${this.state.pageData.maxPalavras} palavras. Crie um texto formal, objetivo, como um bom aluno, sem mencionar ser uma IA. Se for dissertativo, use a estrutura padrão com proposta de intervenção. Responda APENAS em JSON no formato: {"titulo": "Seu Título", "texto": "Seu texto aqui com \\n\\n para parágrafos."}`; const r = await this.apiCall(p); if (!r) return; const j = JSON.parse(r); this.ui.genTitle.value = j.titulo || ""; this.ui.genText.value = j.texto || ""; this.showToast("Redação gerada! Revise e edite.", "success"); },
        digitarTexto: async function() { this.showToast("Iniciando digitação..."); const t = this.ui.genTitle.value, s = this.ui.genText.value; if (!s) throw new Error("Não há texto para digitar."); const e = this.findPageElements(), v = parseInt(this.ui.velocidadeSlider.value); let cd, sd; switch (v) { case 1: cd = 80; sd = 250; break; case 5: cd = 15; sd = 60; break; case 7: cd = 0; sd = 0; break; default: cd = 30; sd = 120; break; } const type = async (el, txt, c, d) => { if (!el) return; el.focus(); const vs = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set; for (const char of txt) { if (this.state.isStopping) return; let st = el.selectionStart, en = el.selectionEnd, nt = el.value.substring(0, st) + char + el.value.substring(en), np = st + 1; vs.call(el, nt); el.selectionStart = np; el.selectionEnd = np; el.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, (char === ' ' || char === '\n') ? d : c)); } el.dispatchEvent(new Event('change', { bubbles: true })); }; if (e.tituloInput && t) await type(e.tituloInput, t, cd, sd); if (this.state.isStopping) return; await type(e.redacaoTextarea, s, cd, sd); if (!this.state.isStopping) this.showToast("Digitação concluída!", "success"); },
        limparEditorInterno: function() { this.ui.genTitle.value = ""; this.ui.genText.value = ""; this.updateUIState(); },
        limparCamposPagina: async function() { this.showToast("Limpando campos da página..."); const e = this.findPageElements(); if (e.tituloInput) { e.tituloInput.value = ""; e.tituloInput.dispatchEvent(new Event('input', { bubbles: true })); } e.redacaoTextarea.value = ""; e.redacaoTextarea.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 100)); },
        limparTudo: function() { this.limparEditorInterno(); this.runProcess(this.limparCamposPagina); this.showToast("Tudo limpo!", "success"); },
    };

    window.redacaoProTool = redacaoProTool;
    window.redacaoProTool.init();

})();
