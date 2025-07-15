(function() {
    if (window.redacaoProTool) {
        window.redacaoProTool.toggleMenu();
        return;
    }

    const redacaoProTool = {
        SCRIPT_NAME: "Redação PR",
        CREDITS: "by hackermoon",
        DEFAULT_API_KEY: "AIzaSyBdDsGQed0NSTC8tGrOJygFWNsoOln3uQ0",
        MODEL_NAME: 'gemini-1.5-pro-latest',
        state: {
            isMenuVisible: false,
            isRunning: false,
            isStopping: false,
            apiKey: "",
            pageData: {},
            abortController: null,
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
                    --rpro-bg-primary: rgba(22, 22, 25, 0.92);
                    --rpro-text-primary: #f5f5f7;
                    --rpro-text-secondary: #a8a8b3;
                    --rpro-accent: #0a84ff;
                    --rpro-accent-hover: #359dff;
                    --rpro-danger: #ff453a;
                    --rpro-warning: #ff9f0a;
                    --rpro-success: #32d74b;
                    --rpro-border-color: rgba(255, 255, 255, 0.15);
                    --rpro-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
                    --rpro-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    --rpro-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
                    --rpro-border-radius: 16px;
                }
                #rpro-toggle-button {
                    position: fixed; bottom: 20px; right: 20px;
                    background: linear-gradient(145deg, var(--rpro-accent), var(--rpro-accent-hover));
                    color: white; width: 54px; height: 54px; border-radius: 50%;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: var(--rpro-shadow); z-index: 10000;
                    transition: transform 0.3s var(--rpro-ease-out);
                    user-select: none; border: none;
                }
                #rpro-toggle-button:hover { transform: scale(1.1); }
                #rpro-toggle-button svg { width: 24px; height: 24px; }
                #rpro-panel {
                    position: fixed; bottom: 90px; right: 20px;
                    width: 350px; border-radius: var(--rpro-border-radius);
                    box-shadow: var(--rpro-shadow); padding: 20px; z-index: 9999;
                    font-family: var(--rpro-font-stack); display: none; flex-direction: column;
                    border: 1px solid var(--rpro-border-color);
                    opacity: 0; transform: translateY(20px) scale(0.95);
                    transition: opacity 0.4s var(--rpro-ease-out), transform 0.4s var(--rpro-ease-out);
                    background: var(--rpro-bg-primary);
                    backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
                    color: var(--rpro-text-primary); gap: 14px;
                }
                #rpro-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
                .rpro-title-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--rpro-border-color); }
                .rpro-title-bar h3 { margin: 0; font-size: 18px; font-weight: 600; }
                .rpro-title-bar .rpro-credits { font-size: 11px; color: var(--rpro-text-secondary); }
                .rpro-button {
                    background-color: rgba(255, 255, 255, 0.1); color: var(--rpro-text-primary);
                    border: none; padding: 12px; border-radius: 10px; cursor: pointer;
                    font-size: 14px; font-weight: 500; text-align: left;
                    transition: all 0.2s ease-out; width: 100%;
                    display: flex; align-items: center; gap: 10px;
                }
                .rpro-button:hover:not(:disabled) { background-color: rgba(255, 255, 255, 0.18); transform: translateY(-1px); }
                .rpro-button:disabled { background-color: rgba(255, 255, 255, 0.05) !important; color: var(--rpro-text-secondary) !important; cursor: not-allowed; opacity: 0.6; transform: none; }
                .rpro-button .num { font-weight: bold; background-color: var(--rpro-accent); color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;}
                .rpro-button.stop-button { background-color: rgba(255, 159, 10, 0.25); color: var(--rpro-warning); }
                .rpro-button.stop-button:hover:not(:disabled) { background-color: rgba(255, 159, 10, 0.4); }
                .rpro-status-line { padding: 8px 0; border-top: 1px solid var(--rpro-border-color); font-size: 12px; color: var(--rpro-text-secondary); min-height: 18px; text-align: center; margin-top: 5px;}
                .rpro-status-line.error { color: var(--rpro-danger); } .rpro-status-line.success { color: var(--rpro-success); }
                #rpro-toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; flex-direction: column; gap: 10px; width: 90%; max-width: 450px; }
                .rpro-toast {
                    background-color: var(--rpro-bg-primary); color: var(--rpro-text-primary); padding: 14px 24px; border-radius: 12px;
                    font-size: 14px; box-shadow: 0 5px 20px rgba(0,0,0,0.3); opacity: 0; transform: translateY(-30px);
                    transition: all 0.4s var(--rpro-ease-out); border: 1px solid var(--rpro-border-color); backdrop-filter: blur(10px);
                }
                .rpro-toast.show { opacity: 1; transform: translateY(0); }
                .rpro-toast.error { background-color: var(--rpro-danger); color: #fff; } .rpro-toast.success { background-color: var(--rpro-success); color: #fff; }
                .rpro-input, .rpro-textarea { width: 100%; box-sizing: border-box; background-color: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); color: var(--rpro-text-primary); border-radius: 8px; padding: 10px; font-size: 13px; font-family: var(--rpro-font-stack); }
                .rpro-textarea { min-height: 120px; resize: vertical; margin-top: 5px; }
                .rpro-group { padding: 12px; background: rgba(0,0,0,0.15); border-radius: 12px; display: flex; flex-direction: column; gap: 10px; }
                .api-section { display: flex; gap: 8px; align-items: center; } .api-section input { flex-grow: 1; }
                .utility-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            `;
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
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
                <div class="rpro-title-bar"><h3>${this.SCRIPT_NAME}</h3><span class="rpro-credits">${this.CREDITS}</span></div>
                <button id="rpro-btn-analisar" class="rpro-button"><span class="num">1</span>Analisar Tema da Página</button>
                <button id="rpro-btn-gerar" class="rpro-button"><span class="num">2</span>Gerar Redação com IA</button>
                <div id="rpro-editor" class="rpro-group" style="display:none;">
                    <label class="rpro-label" for="rpro-gen-title">Editor de Texto (revise antes de enviar)</label>
                    <input id="rpro-gen-title" class="rpro-input" placeholder="Título gerado...">
                    <textarea id="rpro-gen-text" class="rpro-textarea" placeholder="Texto gerado..."></textarea>
                    <label class="rpro-label" for="rpro-velocidade">Velocidade de Digitação</label>
                    <input id="rpro-velocidade" type="range" min="1" max="7" value="3" step="2">
                </div>
                <button id="rpro-btn-digitar" class="rpro-button"><span class="num">3</span>Digitar na Página</button>
                <div class="utility-buttons">
                    <button id="rpro-btn-limpar-editor" class="rpro-button">Limpar Editor</button>
                    <button id="rpro-btn-limpar-pagina" class="rpro-button">Limpar Página</button>
                </div>
                <button id="rpro-btn-parar" class="rpro-button stop-button">Parar Processo</button>
                <div class="rpro-group">
                    <label class="rpro-label" for="rpro-apikey">Chave API Google Gemini</label>
                    <div class="api-section">
                        <input type="password" id="rpro-apikey" class="rpro-input" placeholder="Cole sua chave aqui">
                        <button id="rpro-btn-savekey" class="rpro-button" style="padding: 8px 12px; flex-shrink: 0;">Salvar</button>
                    </div>
                </div>
                <div id="rpro-status-line" class="rpro-status-line">Pronto para começar.</div>
            `;
            document.body.appendChild(panel);

            Object.assign(this.ui, {
                panel,
                statusLine: document.getElementById('rpro-status-line'),
                btnAnalisar: document.getElementById('rpro-btn-analisar'),
                btnGerar: document.getElementById('rpro-btn-gerar'),
                btnDigitar: document.getElementById('rpro-btn-digitar'),
                btnLimparEditor: document.getElementById('rpro-btn-limpar-editor'),
                btnLimparPagina: document.getElementById('rpro-btn-limpar-pagina'),
                btnParar: document.getElementById('rpro-btn-parar'),
                btnSaveKey: document.getElementById('rpro-btn-savekey'),
                apiKeyInput: document.getElementById('rpro-apikey'),
                editor: document.getElementById('rpro-editor'),
                genTitle: document.getElementById('rpro-gen-title'),
                genText: document.getElementById('rpro-gen-text'),
                velocidadeSlider: document.getElementById('rpro-velocidade'),
            });
            this.createToastContainer();
        },

        addEventListeners: function() {
            this.ui.toggleButton.onclick = () => this.toggleMenu();
            this.ui.btnAnalisar.onclick = () => this.runProcess(this.analisarTema);
            this.ui.btnGerar.onclick = () => this.runProcess(this.gerarRedacao);
            this.ui.btnDigitar.onclick = () => this.runProcess(this.digitarTexto);
            this.ui.btnParar.onclick = () => this.pararProcesso();
            this.ui.btnLimparEditor.onclick = () => this.limparEditorInterno();
            this.ui.btnLimparPagina.onclick = () => this.runProcess(this.limparCamposPagina);
            this.ui.btnSaveKey.onclick = () => this.saveApiKey();
        },

        runProcess: async function(processFunction) {
            if (this.state.isRunning) return;
            this.state.isRunning = true;
            this.state.isStopping = false;
            this.state.abortController = new AbortController();
            this.updateUIState();
            try {
                await processFunction.call(this);
            } catch (error) {
                if (error.message === "Processo cancelado pelo usuário.") {
                    this.updateStatus("Processo cancelado.", "warning", true);
                } else {
                    console.error(`[${this.SCRIPT_NAME}] Erro:`, error);
                    this.updateStatus(`Erro: ${error.message}`, "error", true);
                }
            } finally {
                this.state.isRunning = false;
                this.state.isStopping = false;
                this.state.abortController = null;
                this.updateUIState();
                if (this.state.isMenuVisible && !this.ui.statusLine.classList.contains('error') && !this.ui.statusLine.classList.contains('warning')) {
                    this.updateStatus("Pronto.");
                }
            }
        },

        updateUIState: function() {
            const isRunning = this.state.isRunning;
            this.ui.btnAnalisar.disabled = isRunning;
            this.ui.btnGerar.disabled = isRunning || !this.state.pageData.tema || !this.state.apiKey;
            this.ui.btnDigitar.disabled = isRunning || !this.ui.genText.value;
            this.ui.btnLimparEditor.disabled = isRunning || !this.ui.genText.value;
            this.ui.btnLimparPagina.disabled = isRunning;
            this.ui.btnParar.disabled = !isRunning;
            this.ui.btnSaveKey.disabled = isRunning;
            this.ui.editor.style.display = (this.ui.genText.value || this.ui.genTitle.value) ? 'flex' : 'none';
        },

        pararProcesso: function() {
            if (this.state.isRunning && this.state.abortController) {
                this.updateStatus("Cancelando...", "warning");
                this.state.isStopping = true;
                this.state.abortController.abort();
            }
        },

        toggleMenu: function() {
            this.state.isMenuVisible = !this.state.isMenuVisible;
            this.ui.panel.classList.toggle('visible', this.state.isMenuVisible);
        },

        createToastContainer: function() {
            if (document.getElementById('rpro-toast-container')) return;
            const container = document.createElement('div');
            container.id = 'rpro-toast-container';
            document.body.appendChild(container);
            this.ui.toastContainer = container;
        },

        showToast: function(message, type = 'info', duration = 3500) {
            if (!this.ui.toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `rpro-toast ${type}`;
            toast.textContent = message;
            this.ui.toastContainer.appendChild(toast);
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.parentElement?.removeChild(toast);
                }, 500);
            }, duration);
        },

        updateStatus: function(message, type = 'info', showToastFlag = false) {
            if (this.ui.statusLine) {
                this.ui.statusLine.textContent = message;
                this.ui.statusLine.className = 'rpro-status-line';
                this.ui.statusLine.classList.add(type);
            }
            if (showToastFlag) {
                this.showToast(message, type);
            }
        },

        saveApiKey: function() {
            const apiKey = this.ui.apiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem("rproApiKey", apiKey);
                this.state.apiKey = apiKey;
                this.updateStatus("Chave API salva!", "success", true);
            } else {
                localStorage.removeItem("rproApiKey");
                this.state.apiKey = "";
                this.updateStatus("Chave API removida.", "info");
            }
            this.updateUIState();
        },

        loadApiKey: function() {
            this.state.apiKey = localStorage.getItem("rproApiKey") || this.DEFAULT_API_KEY;
            this.ui.apiKeyInput.value = this.state.apiKey;
            if (this.state.apiKey === this.DEFAULT_API_KEY && this.ui.apiKeyInput.value) {
                this.updateStatus("Usando chave padrão. Salve a sua.", "info");
            } else if (this.state.apiKey) {
                this.updateStatus("Chave API carregada.", "success");
            } else {
                this.updateStatus("Insira uma chave API.", "warning");
            }
        },

        findPageElements: function() {
            const tituloInput = document.querySelector('input[name="titulo"]');
            const redacaoTextarea = document.querySelector('textarea[placeholder="Comece a escrever sua redação aqui..."]');
            if (!redacaoTextarea) {
                throw new Error("Campo da redação não encontrado.");
            }
            return {
                tituloInput,
                redacaoTextarea
            };
        },

        analisarTema: async function() {
            this.updateStatus("Analisando página...");
            await new Promise(resolve => setTimeout(resolve, 300));
            const pElements = Array.from(document.querySelectorAll("p.MuiTypography-root.MuiTypography-body2"));
            const generoEl = pElements.find(p => /artigo de opinião|conto|relato|dissertativo-argumentativo/i.test(p.textContent));
            const temaEl = generoEl ? generoEl.parentElement.nextElementSibling?.querySelector("p")?.textContent : null;
            const palavrasEl = pElements.find(p => /de\s+\d+\s+até\s+\d+\s+palavras/i.test(p.textContent))?.textContent;
            if (!generoEl || !temaEl || !palavrasEl) {
                throw new Error("Dados do tema não encontrados.");
            }
            const palavrasMatch = palavrasEl.match(/(\d+)/g);
            if (!palavrasMatch || palavrasMatch.length < 2) {
                throw new Error("Não foi possível ler o nº de palavras.");
            }
            this.state.pageData = {
                genero: generoEl.textContent.trim(),
                tema: temaEl.trim(),
                minPalavras: palavrasMatch[0],
                maxPalavras: palavrasMatch[1]
            };
            this.updateStatus(`Tema: ${this.state.pageData.genero} (${palavrasMatch[0]}-${palavrasMatch[1]} palavras)`, "success", true);
        },

        apiCall: async function(prompt) {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent?key=${this.state.apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                }),
                signal: this.state.abortController.signal,
            });
            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();
            if (this.state.isStopping) {
                throw new Error("Processo cancelado pelo usuário.");
            }
            const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textContent) {
                throw new Error("Resposta da IA veio vazia.");
            }
            return textContent;
        },

        gerarRedacao: async function() {
            this.updateStatus("IA está gerando o texto...", "info");
            const prompt = `
                Você é um assistente de IA para redação escolar em português do Brasil. Siga estas instruções RÍGIDAS.
                Contexto:
                - Gênero: ${this.state.pageData.genero}
                - Tema: "${this.state.pageData.tema}"
                - Tamanho: Entre ${this.state.pageData.minPalavras} e ${this.state.pageData.maxPalavras} palavras.
                Instruções:
                1. Foco Total: A redação deve ser 100% focada no tema.
                2. Linguagem: Use linguagem formal, clara e objetiva. Escreva como um bom aluno, não como um especialista.
                3. Estrutura (se dissertativo): Introdução com tese, 2 parágrafos de desenvolvimento, e 1 de conclusão com proposta de intervenção detalhada (Agente, Ação, Meio, Finalidade).
                4. Proibido: Não mencione que você é uma IA. Não inclua observações fora do texto.
                Formato da Resposta (OBRIGATÓRIO):
                Responda em JSON, sem nenhum texto antes ou depois:
                {
                  "titulo": "Um Título Criativo e Curto Aqui",
                  "texto": "Parágrafo de introdução aqui...\\n\\nParágrafo de desenvolvimento 1 aqui...\\n\\nParágrafo de desenvolvimento 2 aqui...\\n\\nParágrafo de conclusão aqui."
                }`;
            const rawResponse = await this.apiCall(prompt);
            const jsonData = JSON.parse(rawResponse);
            this.ui.genTitle.value = jsonData.titulo || "";
            this.ui.genText.value = jsonData.texto || "";
            this.updateStatus("Redação gerada! Revise e edite.", "success", true);
        },

        digitarTexto: async function() {
            this.updateStatus("Iniciando digitação...", "info");
            const titulo = this.ui.genTitle.value;
            const texto = this.ui.genText.value;
            if (!texto) throw new Error("Não há texto para digitar.");
            const pageElements = this.findPageElements();
            const velocidade = parseInt(this.ui.velocidadeSlider.value);
            let charDelay, spaceDelay;
            switch (velocidade) {
                case 1: charDelay = 80; spaceDelay = 250; break;
                case 5: charDelay = 15; spaceDelay = 60; break;
                case 7: charDelay = 0; spaceDelay = 0; break;
                default: charDelay = 30; spaceDelay = 120; break;
            }
            const typeRoutine = async (element, text, charD, spaceD) => {
                if (!element) return;
                element.focus();
                const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value').set;
                for (const char of text) {
                    if (this.state.isStopping) throw new Error("Processo cancelado pelo usuário.");
                    let start = element.selectionStart;
                    let end = element.selectionEnd;
                    const newText = element.value.substring(0, start) + char + element.value.substring(end);
                    valueSetter.call(element, newText);
                    const newPos = start + 1;
                    element.selectionStart = newPos;
                    element.selectionEnd = newPos;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    const delay = (char === ' ' || char === '\n') ? spaceD : charD;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                element.dispatchEvent(new Event('change', { bubbles: true }));
            };
            if (pageElements.tituloInput && titulo) {
                await typeRoutine(pageElements.tituloInput, titulo, charDelay, spaceDelay);
            }
            await typeRoutine(pageElements.redacaoTextarea, texto, charDelay, spaceDelay);
            this.updateStatus("Digitação concluída!", "success", true);
        },

        limparEditorInterno: function() {
            this.ui.genTitle.value = "";
            this.ui.genText.value = "";
            this.updateStatus("Editor interno limpo.", "info");
            this.updateUIState();
        },

        limparCamposPagina: async function() {
            this.updateStatus("Limpando campos da página...");
            const pageElements = this.findPageElements();
            if (pageElements.tituloInput) {
                pageElements.tituloInput.value = "";
                pageElements.tituloInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            pageElements.redacaoTextarea.value = "";
            pageElements.redacaoTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 100));
            this.updateStatus("Campos da página limpos.", "success", true);
        }
    };

    window.redacaoProTool = redacaoProTool;
    window.redacaoProTool.init();

})();
