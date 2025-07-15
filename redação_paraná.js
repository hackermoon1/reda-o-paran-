(function() {
    if (window.redacaoProTool) {
        window.redacaoProTool.toggleMenu();
        return;
    }

    const redacaoProTool = {
        SCRIPT_NAME: "Redação PRO",
        CREDITS_AUTHOR: "hackermoon1",
        CREDITS_SUITE: "MoonScripts © 2025",
        DEFAULT_API_KEY: "AIzaSyBdDsGQed0NSTC8tGrOJygFWNsoOln3uQ0",
        MODEL_NAME: 'gemini-1.5-pro-latest',
        state: {
            isMenuVisible: false,
            isRunning: false,
            isTyping: false,
            abortController: null,
            pageData: {},
            generatedTitle: "",
            generatedText: ""
        },
        ui: {},

        init: function() {
            try {
                this.injectStyles();
                this.createUI();
                this.addEventListeners();
                this.updateUIState();
                this.showToast(`${this.SCRIPT_NAME} carregado!`, "success");
            } catch (error) {
                console.error(`[${this.SCRIPT_NAME}] Erro:`, error);
                alert(`Erro ao iniciar ${this.SCRIPT_NAME}: ${error.message}`);
            }
        },

        injectStyles: function() {
            const styles = `
                :root {
                    --rpro-cyan: #00e5ff; --rpro-bg-start: #0f2027; --rpro-bg-end: #2c5364;
                    --rpro-text-primary: #e8e8e8; --rpro-text-secondary: #a0a0a0;
                    --rpro-shadow: 0 0 25px rgba(0, 229, 255, 0.2);
                    --rpro-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    --rpro-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
                    --rpro-border-radius: 16px;
                }
                #rpro-toggle-button {
                    position: fixed; bottom: 20px; right: 20px;
                    background: linear-gradient(145deg, var(--rpro-cyan), #00a3b6); color: black;
                    width: 54px; height: 54px; border-radius: 50%; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 20px var(--rpro-cyan); z-index: 10000;
                    transition: all 0.3s var(--rpro-ease-out); user-select: none; border: none;
                }
                #rpro-toggle-button:hover { transform: scale(1.1); box-shadow: 0 0 35px var(--rpro-cyan); }
                #rpro-toggle-button svg { width: 24px; height: 24px; }
                #rpro-panel {
                    position: fixed; bottom: 90px; right: 20px; width: 320px;
                    border-radius: var(--rpro-border-radius); box-shadow: var(--rpro-shadow);
                    padding: 20px; z-index: 9999; font-family: var(--rpro-font-stack);
                    display: none; flex-direction: column; border: 1px solid var(--rpro-cyan);
                    opacity: 0; transform: translateY(20px) scale(0.95);
                    transition: opacity 0.4s var(--rpro-ease-out), transform 0.4s var(--rpro-ease-out);
                    background: linear-gradient(145deg, var(--rpro-bg-start), var(--rpro-bg-end));
                    backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%);
                    color: var(--rpro-text-primary); gap: 16px;
                }
                #rpro-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
                .rpro-button {
                    background-color: rgba(0, 0, 0, 0.3); color: var(--rpro-text-primary);
                    border: 1px solid rgba(0, 229, 255, 0.3); padding: 12px; border-radius: 10px;
                    cursor: pointer; font-size: 14px; font-weight: 500; text-align: center;
                    transition: all 0.2s ease-out; width: 100%; display: flex;
                    align-items: center; justify-content: center; gap: 10px;
                }
                .rpro-button:hover:not(:disabled) { background-color: rgba(0, 229, 255, 0.15); border-color: var(--rpro-cyan); color: var(--rpro-cyan); box-shadow: 0 0 10px rgba(0, 229, 255, 0.3); }
                .rpro-button:disabled { color: #666 !important; cursor: not-allowed; opacity: 0.5; background-color: rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.1) !important; box-shadow: none; }
                #rpro-typing-controls .stop { border-color: #ff9f0a; color: #ff9f0a; }
                #rpro-typing-controls .stop:hover:not(:disabled) { background-color: rgba(255, 159, 10, 0.2); }
                #rpro-slider-group { display: flex; flex-direction: column; gap: 8px; }
                input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; cursor: pointer; }
                input[type="range"]::-webkit-slider-runnable-track { background: rgba(0,0,0,0.4); height: 4px; border-radius: 2px; }
                input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -6px; background-color: var(--rpro-cyan); height: 16px; width: 16px; border-radius: 50%; border: 2px solid var(--rpro-bg-end); }
                .rpro-footer { border-top: 1px solid rgba(0, 229, 255, 0.3); padding-top: 12px; text-align: center; font-size: 11px; color: var(--rpro-text-secondary); }
                .rpro-footer strong { color: var(--rpro-cyan); font-weight: 500; }
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
                <button id="rpro-btn-analisar-gerar" class="rpro-button">Analisar & Gerar</button>
                <div id="rpro-typing-controls">
                    <button id="rpro-btn-digitar" class="rpro-button">Começar Digitação</button>
                    <button id="rpro-btn-parar" class="rpro-button stop" style="display:none;">Parar Digitação</button>
                </div>
                <button id="rpro-btn-limpar" class="rpro-button">Limpar Redação</button>
                <div id="rpro-slider-group">
                    <input id="rpro-velocidade" type="range" min="1" max="7" value="3" step="2" title="Velocidade de Digitação">
                </div>
                <div class="rpro-footer">
                    <span>by <strong>${this.CREDITS_AUTHOR}</strong> | ${this.CREDITS_SUITE}</span>
                </div>
            `;
            document.body.appendChild(panel);

            Object.assign(this.ui, {
                panel, typingControls: document.getElementById('rpro-typing-controls'),
                btnAnalisarGerar: document.getElementById('rpro-btn-analisar-gerar'),
                btnDigitar: document.getElementById('rpro-btn-digitar'),
                btnParar: document.getElementById('rpro-btn-parar'),
                btnLimpar: document.getElementById('rpro-btn-limpar'),
                velocidadeSlider: document.getElementById('rpro-velocidade'),
            });
            this.createToastContainer();
        },

        addEventListeners: function() {
            this.ui.toggleButton.onclick = () => this.toggleMenu();
            this.ui.btnAnalisarGerar.onclick = () => this.runProcess(this.analisarEGerar);
            this.ui.btnDigitar.onclick = () => this.runProcess(this.digitarTexto, true);
            this.ui.btnParar.onclick = () => this.pararProcesso();
            this.ui.btnLimpar.onclick = () => this.limparTudo();
        },

        runProcess: async function(processFunction, isTypingProcess = false) {
            if (this.state.isRunning) return;
            this.state.isRunning = true;
            this.state.isTyping = isTypingProcess;
            this.state.abortController = new AbortController();
            this.updateUIState();
            try {
                await processFunction.call(this);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(`[${this.SCRIPT_NAME}] Erro:`, error);
                    this.showToast(`Erro: ${error.message}`, "error");
                }
            } finally {
                this.state.isRunning = false;
                this.state.isTyping = false;
                this.state.abortController = null;
                this.updateUIState();
            }
        },

        updateUIState: function() {
            const { isRunning, isTyping, generatedText } = this.state;
            this.ui.btnAnalisarGerar.disabled = isRunning;
            this.ui.btnDigitar.style.display = isTyping ? 'none' : 'flex';
            this.ui.btnParar.style.display = isTyping ? 'flex' : 'none';
            this.ui.btnDigitar.disabled = isRunning || !generatedText;
            this.ui.btnLimpar.disabled = isRunning;
            this.ui.velocidadeSlider.disabled = isRunning;
        },

        pararProcesso: function() {
            if (this.state.isRunning && this.state.abortController) {
                this.state.abortController.abort();
                this.showToast("Digitação parada.", "warning");
            }
        },

        toggleMenu: function() { this.state.isMenuVisible = !this.state.isMenuVisible; this.ui.panel.classList.toggle('visible', this.state.isMenuVisible); },
        createToastContainer: function() { if (document.getElementById('rpro-toast-container')) return; const c = document.createElement('div'); c.id = 'rpro-toast-container'; c.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10001;display:flex;flex-direction:column;gap:10px;width:90%;max-width:450px;'; document.body.appendChild(c); this.ui.toastContainer = c; },
        showToast: function(msg, type = 'info', dur = 3000) { if (!this.ui.toastContainer) return; const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'background-color:var(--rpro-bg-mid);color:var(--rpro-text-primary);padding:14px 24px;border-radius:12px;box-shadow:var(--rpro-shadow);transition:all .4s ease-out;opacity:0;transform:translateY(-30px);text-align:center;'; if (type === 'error') { t.style.backgroundColor = '#ff453a'; t.style.color = '#fff'; } else if (type === 'success') { t.style.backgroundColor = '#32d74b'; t.style.color = '#fff'; } else if (type === 'warning') { t.style.backgroundColor = '#ff9f0a'; t.style.color = '#fff'; } this.ui.toastContainer.appendChild(t); requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-30px)'; setTimeout(() => t.parentElement?.removeChild(t), 500); }, dur); },
        findPageElements: function() { const t = document.querySelector('input[name="titulo"]'), s = document.querySelector('textarea[placeholder="Comece a escrever sua redação aqui..."]'); if (!s) throw new Error("Campo da redação não encontrado."); return { tituloInput: t, redacaoTextarea: s }; },
        
        analisarEGerar: async function() {
            this.showToast("Analisando página...");
            await new Promise(r => setTimeout(r, 300));
            const p = Array.from(document.querySelectorAll("p.MuiTypography-root.MuiTypography-body2"));
            const g = p.find(e => /artigo de opinião|conto|relato|dissertativo-argumentativo/i.test(e.textContent));
            const t = g ? g.parentElement.nextElementSibling?.querySelector("p")?.textContent : null;
            const w = p.find(e => /de\s+\d+\s+até\s+\d+\s+palavras/i.test(e.textContent))?.textContent;
            if (!g || !t || !w) throw new Error("Dados do tema não encontrados.");
            const m = w.match(/(\d+)/g);
            if (!m || m.length < 2) throw new Error("Não foi possível ler o nº de palavras.");
            this.state.pageData = { genero: g.textContent.trim(), tema: t.trim(), minPalavras: m[0], maxPalavras: m[1] };
            this.showToast(`Tema analisado: ${this.state.pageData.genero}. Gerando...`, "success");

            const prompt = `Você é um assistente de IA para redação. Gênero: ${this.state.pageData.genero}. Tema: "${this.state.pageData.tema}". Tamanho: ${this.state.pageData.minPalavras} a ${this.state.pageData.maxPalavras} palavras. Crie um texto formal e objetivo, como um bom aluno. Não mencione ser uma IA. Responda APENAS em JSON no formato: {"titulo": "Seu Título", "texto": "Seu texto aqui com \\n\\n para parágrafos."}`;
            const u = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent?key=${this.DEFAULT_API_KEY}`;
            const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), signal: this.state.abortController.signal });
            if (!r.ok) throw new Error(`API Error ${r.status}`);
            const d = await r.json();
            const c = d?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!c) throw new Error("Resposta da IA veio vazia.");
            const j = JSON.parse(c);
            this.state.generatedTitle = j.titulo || "";
            this.state.generatedText = j.texto || "";
            this.showToast("Redação gerada e pronta para digitar!", "success");
        },

        digitarTexto: async function() {
            const { generatedTitle: t, generatedText: s } = this.state;
            if (!s) { this.showToast("Primeiro, gere uma redação.", "warning"); return; }
            const e = this.findPageElements(), v = parseInt(this.ui.velocidadeSlider.value);
            let cd, sd;
            switch (v) { case 1: cd = 80; sd = 250; break; case 5: cd = 15; sd = 60; break; case 7: cd = 0; sd = 0; break; default: cd = 30; sd = 120; break; }
            const type = async (el, txt, c, d) => {
                if (!el) return;
                el.focus();
                const vs = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
                for (const char of txt) {
                    if (this.state.abortController.signal.aborted) return;
                    let st = el.selectionStart, en = el.selectionEnd, nt = el.value.substring(0, st) + char + el.value.substring(en), np = st + 1;
                    vs.call(el, nt);
                    el.selectionStart = np; el.selectionEnd = np;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    await new Promise(r => setTimeout(r, (char === ' ' || char === '\n') ? d : c));
                }
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
            if (e.tituloInput && t) await type(e.tituloInput, t, cd, sd);
            if (this.state.abortController.signal.aborted) return;
            await type(e.redacaoTextarea, s, cd, sd);
            if (!this.state.abortController.signal.aborted) this.showToast("Digitação concluída!", "success");
        },

        limparTudo: function() {
            this.state.generatedTitle = ""; this.state.generatedText = "";
            const e = this.findPageElements();
            if (e.tituloInput) { e.tituloInput.value = ""; e.tituloInput.dispatchEvent(new Event('input', { bubbles: true })); }
            e.redacaoTextarea.value = ""; e.redacaoTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            this.showToast("Redação limpa!", "success");
            this.updateUIState();
        },
    };

    window.redacaoProTool = redacaoProTool;
    window.redacaoProTool.init();

})();
