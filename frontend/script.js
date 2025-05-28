import CONFIG from './api.js';
// Enhanced State Management
const CONFIG = {
    API_URL: API_BACKEND,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
    ALERT_DURATION: 4000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    MAX_HISTORY: 50,
    MAX_BULK_PASSWORDS: 100,
    STORAGE_KEYS: {
        THEME: 'securepass_theme',
        SETTINGS: 'securepass_settings',
        HISTORY: 'securepass_history',
        FAVORITES: 'securepass_favorites'
    }
};
const state = {
    isGenerating: false,
    senhaVisivel: false,
    analyzeVisible: false,
    currentPassword: '',
    currentTab: 'generator',
    retryCount: 0,
    lastGenerateTime: 0,
    theme: 'light',
    settings: {
        autoGenerate: true,
        autoCopy: false,
        soundEffects: false,
        showAdvanced: false
    },
    history: [],
    favorites: [],
    bulkPasswords: []
};

// Enhanced Utility Functions
const utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    formatTime(seconds) {
        if (seconds < 1) return 'Instantâneo';
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)}d`;
        return `${Math.round(seconds / 31536000)}a`;
    },

    calculateEntropy(password) {
        const charSets = [
            /[a-z]/.test(password) ? 26 : 0,
            /[A-Z]/.test(password) ? 26 : 0,
            /[0-9]/.test(password) ? 10 : 0,
            /[^A-Za-z0-9]/.test(password) ? 32 : 0
        ];
        const charSetSize = charSets.reduce((sum, size) => sum + size, 0);
        return password.length * Math.log2(charSetSize || 1);
    },

    estimateCrackTime(entropy) {
        const guessesPerSecond = 1e12; // 1 trillion guesses per second (modern hardware)
        const totalCombinations = Math.pow(2, entropy);
        const averageGuesses = totalCombinations / 2;
        return averageGuesses / guessesPerSecond;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            return new Promise((resolve, reject) => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    textArea.remove();
                    resolve();
                } catch (error) {
                    textArea.remove();
                    reject(error);
                }
            });
        }
    },

    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    playSound(type) {
        if (!state.settings.soundEffects) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequencies = {
            success: 800,
            error: 300,
            click: 600,
            copy: 1000
        };

        oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
};

// Enhanced Storage Management
const storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    },

    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    }
};

// Enhanced Alert System
const alertSystem = {
    show(message, type = 'info', duration = CONFIG.ALERT_DURATION) {
        const alerta = document.getElementById('alerta');
        const alertIcon = document.getElementById('alertIcon');
        const alertMessage = document.getElementById('alertMessage');

        alerta.className = 'mx-6 mt-6 p-4 rounded-xl border transition-all duration-300 transform';

        const configs = {
            success: {
                classes: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
                icon: 'check-circle'
            },
            error: {
                classes: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
                icon: 'x-circle'
            },
            warning: {
                classes: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
                icon: 'alert-triangle'
            },
            info: {
                classes: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
                icon: 'info'
            }
        };

        const config = configs[type] || configs.info;
        alerta.className += ` ${config.classes}`;

        alertIcon.innerHTML = `<i data-lucide="${config.icon}" class="w-5 h-5"></i>`;
        alertMessage.textContent = message;

        alerta.classList.remove('hidden');
        alerta.style.transform = 'translateY(-10px)';
        alerta.style.opacity = '0';

        setTimeout(() => {
            alerta.style.transform = 'translateY(0)';
            alerta.style.opacity = '1';
        }, 10);

        // Re-initialize icons
        lucide.createIcons();

        if (duration > 0) {
            setTimeout(() => this.hide(), duration);
        }

        utils.playSound(type === 'success' ? 'success' : type === 'error' ? 'error' : 'click');
    },

    hide() {
        const alerta = document.getElementById('alerta');
        alerta.style.transform = 'translateY(-10px)';
        alerta.style.opacity = '0';

        setTimeout(() => {
            alerta.classList.add('hidden');
        }, CONFIG.ANIMATION_DURATION);
    }
};

// Enhanced Password Strength Analyzer
const strengthAnalyzer = {
    analyze(password) {
        if (!password) return { score: 0, level: 'none', tips: [], checks: {} };

        let score = 0;
        const tips = [];
        const checks = {
            length: password.length >= 12,
            longLength: password.length >= 16,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /[0-9]/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password),
            noRepeats: !/(.)\1{2,}/.test(password),
            noSequential: !/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password),
            noCommon: !this.isCommonPassword(password)
        };

        // Calculate score
        if (checks.length) score += 2;
        if (checks.longLength) score += 1;
        if (checks.lowercase) score += 1;
        if (checks.uppercase) score += 1;
        if (checks.numbers) score += 1;
        if (checks.symbols) score += 2;
        if (checks.noRepeats) score += 1;
        if (checks.noSequential) score += 1;
        if (checks.noCommon) score += 1;

        // Generate tips
        if (!checks.length) tips.push('Use pelo menos 12 caracteres');
        if (!checks.longLength && checks.length) tips.push('Considere usar 16+ caracteres para maior segurança');
        if (!checks.lowercase) tips.push('Adicione letras minúsculas');
        if (!checks.uppercase) tips.push('Adicione letras maiúsculas');
        if (!checks.numbers) tips.push('Adicione números');
        if (!checks.symbols) tips.push('Adicione símbolos especiais');
        if (!checks.noRepeats) tips.push('Evite caracteres repetidos consecutivos');
        if (!checks.noSequential) tips.push('Evite sequências óbvias (abc, 123)');
        if (!checks.noCommon) tips.push('Evite senhas comuns ou previsíveis');

        // Determine level
        let level;
        if (score <= 3) level = 'very-weak';
        else if (score <= 5) level = 'weak';
        else if (score <= 7) level = 'fair';
        else if (score <= 9) level = 'good';
        else level = 'strong';

        return { score, level, tips, checks };
    },

    isCommonPassword(password) {
        const commonPasswords = [
            '123456', 'password', '123456789', '12345678', '12345',
            '1234567', '1234567890', 'qwerty', 'abc123', 'million2',
            '000000', '1234', 'iloveyou', 'aaron431', 'password1',
            'qqww1122', '123', 'omgpop', '123321', '654321'
        ];
        return commonPasswords.includes(password.toLowerCase());
    },

    display(password) {
        const container = document.getElementById('strengthContainer');
        const bar = document.getElementById('strengthBar');
        const text = document.getElementById('strengthText');
        const tipsContainer = document.getElementById('strengthTips');

        if (!password) {
            container.style.display = 'none';
            return;
        }

        const analysis = this.analyze(password);
        const percentage = Math.min((analysis.score / 10) * 100, 100);

        container.style.display = 'block';

        bar.style.width = `${percentage}%`;
        bar.className = `h-full transition-all duration-500 ease-out rounded-full strength-${analysis.level}`;

        const levelTexts = {
            'very-weak': 'Muito Fraca',
            'weak': 'Fraca',
            'fair': 'Razoável',
            'good': 'Boa',
            'strong': 'Muito Forte'
        };
        text.textContent = levelTexts[analysis.level];
        text.className = `text-sm font-bold text-${this.getLevelColor(analysis.level)}-600 dark:text-${this.getLevelColor(analysis.level)}-400`;

        if (analysis.tips.length > 0) {
            tipsContainer.innerHTML = analysis.tips.map(tip =>
                `<div class="flex items-center space-x-2">
                    <i data-lucide="arrow-right" class="w-3 h-3"></i>
                    <span>${tip}</span>
                </div>`
            ).join('');
        } else {
            tipsContainer.innerHTML = '<div class="flex items-center space-x-2 text-green-600 dark:text-green-400"><i data-lucide="check" class="w-3 h-3"></i><span>Senha muito segura!</span></div>';
        }

        lucide.createIcons();
        return analysis;
    },

    getLevelColor(level) {
        const colors = {
            'very-weak': 'red',
            'weak': 'orange',
            'fair': 'yellow',
            'good': 'green',
            'strong': 'emerald'
        };
        return colors[level] || 'gray';
    }
};

// Enhanced Statistics Display
const statsDisplay = {
    update(password) {
        const container = document.getElementById('statsContainer');
        const entropyValue = document.getElementById('entropyValue');
        const crackTime = document.getElementById('crackTime');

        if (!password) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const entropy = utils.calculateEntropy(password);
        const crackTimeSeconds = utils.estimateCrackTime(entropy);

        entropyValue.textContent = Math.round(entropy);
        crackTime.textContent = utils.formatTime(crackTimeSeconds);
    }
};

// Theme Management
function initializeTheme() {
    const savedTheme = storage.load(CONFIG.STORAGE_KEYS.THEME, 'light');
    state.theme = savedTheme;
    applyTheme(savedTheme);
}

function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    state.theme = newTheme;
    applyTheme(newTheme);
    storage.save(CONFIG.STORAGE_KEYS.THEME, newTheme);
    utils.playSound('click');
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Tab Management
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    state.currentTab = tabName;
    utils.playSound('click');
}

// Advanced Options Toggle
function toggleAdvancedOptions() {
    const container = document.getElementById('advancedOptions');
    const toggleText = document.getElementById('advancedToggleText');
    const toggleIcon = document.getElementById('advancedToggleIcon');

    const isHidden = container.classList.contains('hidden');

    if (isHidden) {
        container.classList.remove('hidden');
        container.style.animation = 'slideDown 0.3s ease-out';
        toggleText.textContent = 'Opções Básicas';
        toggleIcon.style.transform = 'rotate(180deg)';
        state.settings.showAdvanced = true;
    } else {
        container.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            container.classList.add('hidden');
        }, 300);
        toggleText.textContent = 'Opções Avançadas';
        toggleIcon.style.transform = 'rotate(0deg)';
        state.settings.showAdvanced = false;
    }

    saveSettings();
    utils.playSound('click');
}

// Length Controls
function updateLengthFromSlider() {
    const slider = document.getElementById('lengthSlider');
    const input = document.getElementById('lengthInput');
    input.value = slider.value;
}

function updateLengthFromInput() {
    const slider = document.getElementById('lengthSlider');
    const input = document.getElementById('lengthInput');
    const value = Math.max(4, Math.min(64, parseInt(input.value) || 16));
    input.value = value;
    slider.value = value;
}

function adjustLength(delta) {
    const lengthInput = document.getElementById('lengthInput');
    const lengthSlider = document.getElementById('lengthSlider');
    const currentValue = parseInt(lengthInput.value) || 16;
    const newValue = Math.max(4, Math.min(64, currentValue + delta));

    lengthInput.value = newValue;
    lengthSlider.value = newValue;

    lengthInput.classList.add('animate-pulse');
    setTimeout(() => lengthInput.classList.remove('animate-pulse'), 200);
}

function setLength(length) {
    const lengthInput = document.getElementById('lengthInput');
    const lengthSlider = document.getElementById('lengthSlider');
    lengthInput.value = length;
    lengthSlider.value = length;

    lengthInput.classList.add('animate-pulse');
    setTimeout(() => lengthInput.classList.remove('animate-pulse'), 200);
}

// Preset Management
function applyPreset(presetName) {
    const presets = {
        basic: { length: 8, uppercase: true, lowercase: true, numbers: true, symbols: false },
        strong: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
        ultra: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true },
        pin: { length: 6, uppercase: false, lowercase: false, numbers: true, symbols: false }
    };

    const preset = presets[presetName];
    if (!preset) return;

    // Apply length
    setLength(preset.length);

    // Apply character types
    document.getElementById('includeUppercase').checked = preset.uppercase;
    document.getElementById('includeLowercase').checked = preset.lowercase;
    document.getElementById('includeNumbers').checked = preset.numbers;
    document.getElementById('includeSymbols').checked = preset.symbols;

    // Generate password with new settings
    setTimeout(() => gerarSenha(), 100);

    utils.playSound('click');
}

// Main Password Generation Function
async function gerarSenha() {
    const now = Date.now();
    if (now - state.lastGenerateTime < CONFIG.DEBOUNCE_DELAY) {
        return;
    }
    state.lastGenerateTime = now;

    if (state.isGenerating) return;

    const lengthInput = document.getElementById('lengthInput');
    const length = parseInt(lengthInput.value) || 16;

    // Validation
    if (length < 4 || length > 64) {
        alertSystem.show('O comprimento deve ser entre 4 e 64 caracteres.', 'warning');
        lengthInput.classList.add('animate-shake');
        setTimeout(() => lengthInput.classList.remove('animate-shake'), 500);
        return;
    }

    // Check if at least one character type is selected
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;

    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        alertSystem.show('Selecione pelo menos um tipo de caractere!', 'warning');
        return;
    }

    // UI updates
    state.isGenerating = true;
    const spinner = document.getElementById('spinner');
    const btnGerar = document.getElementById('btnGerar');
    const generateIcon = document.getElementById('generateIcon');
    const generateText = document.getElementById('generateText');

    spinner.classList.remove('hidden');
    generateIcon.classList.add('hidden');
    generateText.textContent = 'Gerando...';
    btnGerar.disabled = true;
    btnGerar.classList.add('loading');

    try {
        const response = await fetch(`${CONFIG.API_URL}?tamanho=${length}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.senha) {
            throw new Error('Resposta inválida da API');
        }

        // Success
        state.currentPassword = data.senha;
        const senhaInput = document.getElementById('senhaGerada');
        senhaInput.value = data.senha;

        // Animate password input
        senhaInput.classList.add('animate-pulse-success');
        setTimeout(() => senhaInput.classList.remove('animate-pulse-success'), 600);

        // Update analysis
        const analysis = strengthAnalyzer.display(data.senha);
        statsDisplay.update(data.senha);

        // Add to history
        addToHistory(data.senha, analysis);

        // Auto-copy if enabled
        if (state.settings.autoCopy) {
            await utils.copyToClipboard(data.senha);
            alertSystem.show('Senha gerada e copiada automaticamente!', 'success');
        } else {
            alertSystem.show('Senha gerada com sucesso!', 'success');
        }

        state.retryCount = 0;

    } catch (error) {
        console.error('Erro ao gerar senha:', error);

        // Retry logic
        if (state.retryCount < CONFIG.MAX_RETRIES) {
            state.retryCount++;
            alertSystem.show(`Tentativa ${state.retryCount}/${CONFIG.MAX_RETRIES}...`, 'warning', 1500);

            setTimeout(() => {
                if (state.retryCount <= CONFIG.MAX_RETRIES) {
                    gerarSenha();
                }
            }, CONFIG.RETRY_DELAY);
            return;
        }

        // Final failure
        document.getElementById('senhaGerada').value = '';
        strengthAnalyzer.display('');
        statsDisplay.update('');

        let errorMessage = 'Erro ao gerar senha. ';
        if (error.name === 'AbortError') {
            errorMessage += 'Tempo limite excedido.';
        } else if (!navigator.onLine) {
            errorMessage += 'Verifique sua conexão.';
        } else {
            errorMessage += 'Tente novamente.';
        }

        alertSystem.show(errorMessage, 'error', 5000);
        state.retryCount = 0;

    } finally {
        // Reset UI
        state.isGenerating = false;
        spinner.classList.add('hidden');
        generateIcon.classList.remove('hidden');
        generateText.textContent = 'Gerar Nova Senha';
        btnGerar.disabled = false;
        btnGerar.classList.remove('loading');
    }
}

// Copy Password Function
async function copiarSenha() {
    const senhaInput = document.getElementById('senhaGerada');
    const copyIcon = document.getElementById('copyIcon');

    if (!senhaInput.value) {
        alertSystem.show('Gere uma senha primeiro!', 'warning');
        return;
    }

    try {
        await utils.copyToClipboard(senhaInput.value);

        // Visual feedback
        senhaInput.classList.add('copied');
        copyIcon.setAttribute('data-lucide', 'check');

        showSuccessModal('Senha copiada para a área de transferência!');
        utils.playSound('copy');

        setTimeout(() => {
            senhaInput.classList.remove('copied');
            copyIcon.setAttribute('data-lucide', 'copy');
            lucide.createIcons();
        }, 1000);

    } catch (error) {
        console.error('Erro ao copiar:', error);
        alertSystem.show('Erro ao copiar senha!', 'error');
    }
}

// Toggle Password Visibility
function toggleSenhaVisibilidade() {
    const senhaInput = document.getElementById('senhaGerada');
    const eyeIcon = document.getElementById('eyeIcon');

    state.senhaVisivel = !state.senhaVisivel;
    senhaInput.type = state.senhaVisivel ? 'text' : 'password';

    eyeIcon.setAttribute('data-lucide', state.senhaVisivel ? 'eye-off' : 'eye');
    lucide.createIcons();
    utils.playSound('click');
}

// Analyzer Functions
function toggleAnalyzeVisibility() {
    const analyzeInput = document.getElementById('analyzeInput');
    const eyeIcon = document.getElementById('analyzeEyeIcon');

    state.analyzeVisible = !state.analyzeVisible;
    analyzeInput.type = state.analyzeVisible ? 'text' : 'password';

    eyeIcon.setAttribute('data-lucide', state.analyzeVisible ? 'eye-off' : 'eye');
    lucide.createIcons();
}

function analyzePassword(password) {
    const resultsContainer = document.getElementById('analysisResults');

    if (!password) {
        resultsContainer.classList.add('hidden');
        return;
    }

    resultsContainer.classList.remove('hidden');

    // Detailed analysis
    const analysis = strengthAnalyzer.analyze(password);
    const entropy = utils.calculateEntropy(password);
    const crackTime = utils.estimateCrackTime(entropy);

    // Update detailed strength bar
    const detailedBar = document.getElementById('detailedStrengthBar');
    const detailedText = document.getElementById('detailedStrengthText');
    const percentage = Math.min((analysis.score / 10) * 100, 100);

    detailedBar.style.width = `${percentage}%`;
    detailedBar.className = `h-full rounded-full transition-all duration-500 strength-${analysis.level}`;

    const levelTexts = {
        'very-weak': 'Muito Fraca',
        'weak': 'Fraca',
        'fair': 'Razoável',
        'good': 'Boa',
        'strong': 'Muito Forte'
    };
    detailedText.textContent = levelTexts[analysis.level];
    detailedText.className = `text-sm font-semibold text-${strengthAnalyzer.getLevelColor(analysis.level)}-600 dark:text-${strengthAnalyzer.getLevelColor(analysis.level)}-400`;

    // Update statistics
    document.getElementById('analyzeLength').textContent = password.length;
    document.getElementById('analyzeEntropy').textContent = `${Math.round(entropy)} bits`;
    document.getElementById('analyzeCrackTime').textContent = utils.formatTime(crackTime);

    // Count character types
    let charTypes = 0;
    if (/[a-z]/.test(password)) charTypes++;
    if (/[A-Z]/.test(password)) charTypes++;
    if (/[0-9]/.test(password)) charTypes++;
    if (/[^A-Za-z0-9]/.test(password)) charTypes++;
    document.getElementById('analyzeCharTypes').textContent = charTypes;

    // Security checks
    const checksContainer = document.getElementById('securityChecks');
    const securityChecks = [
        { check: analysis.checks.length, text: 'Comprimento adequado (12+ chars)', icon: 'shield' },
        { check: analysis.checks.longLength, text: 'Comprimento forte (16+ chars)', icon: 'shield-check' },
        { check: analysis.checks.lowercase, text: 'Contém letras minúsculas', icon: 'type' },
        { check: analysis.checks.uppercase, text: 'Contém letras maiúsculas', icon: 'type' },
        { check: analysis.checks.numbers, text: 'Contém números', icon: 'hash' },
        { check: analysis.checks.symbols, text: 'Contém símbolos', icon: 'at-sign' },
        { check: analysis.checks.noRepeats, text: 'Sem repetições excessivas', icon: 'repeat' },
        { check: analysis.checks.noSequential, text: 'Sem sequências óbvias', icon: 'trending-up' },
        { check: analysis.checks.noCommon, text: 'Não é uma senha comum', icon: 'alert-triangle' }
    ];

    checksContainer.innerHTML = securityChecks.map(item => `
        <div class="flex items-center space-x-3">
            <div class="w-5 h-5 rounded-full flex items-center justify-center ${item.check ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}">
                <i data-lucide="${item.check ? 'check' : 'x'}" class="w-3 h-3 ${item.check ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"></i>
            </div>
            <span class="text-sm ${item.check ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}">${item.text}</span>
        </div>
    `).join('');

    // Recommendations
    const recommendationsContainer = document.getElementById('recommendations');
    if (analysis.tips.length > 0) {
        recommendationsContainer.innerHTML = analysis.tips.map(tip => `
            <div class="flex items-start space-x-2">
                <i data-lucide="arrow-right" class="w-4 h-4 mt-0.5 text-blue-500 dark:text-blue-400"></i>
                <span>${tip}</span>
            </div>
        `).join('');
    } else {
        recommendationsContainer.innerHTML = `
            <div class="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Sua senha atende a todos os critérios de segurança!</span>
            </div>
        `;
    }

    lucide.createIcons();
}

// Bulk Password Generation
async function generateBulkPasswords() {
    const countInput = document.getElementById('bulkCount');
    const lengthInput = document.getElementById('bulkLength');
    const count = Math.max(1, Math.min(CONFIG.MAX_BULK_PASSWORDS, parseInt(countInput.value) || 5));
    const length = Math.max(4, Math.min(64, parseInt(lengthInput.value) || 16));

    const btnBulkGenerate = document.getElementById('btnBulkGenerate');
    btnBulkGenerate.disabled = true;
    btnBulkGenerate.innerHTML = `
        <div class="flex items-center justify-center space-x-3">
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Gerando ${count} senhas...</span>
        </div>
    `;

    try {
        const passwords = [];
        for (let i = 0; i < count; i++) {
            const response = await fetch(`${CONFIG.API_URL}?tamanho=${length}`);
            const data = await response.json();
            if (data.senha) {
                passwords.push({
                    id: utils.generateId(),
                    password: data.senha,
                    length: length,
                    strength: strengthAnalyzer.analyze(data.senha)
                });
            }

            // Small delay to prevent overwhelming the API
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        state.bulkPasswords = passwords;
        displayBulkPasswords(passwords);
        alertSystem.show(`${passwords.length} senhas geradas com sucesso!`, 'success');

    } catch (error) {
        console.error('Erro ao gerar senhas em lote:', error);
        alertSystem.show('Erro ao gerar senhas em lote!', 'error');
    } finally {
        btnBulkGenerate.disabled = false;
        btnBulkGenerate.innerHTML = `
            <div class="flex items-center justify-center space-x-3">
                <i data-lucide="layers" class="w-5 h-5"></i>
                <span>Gerar Senhas em Lote</span>
            </div>
        `;
        lucide.createIcons();
    }
}

function displayBulkPasswords(passwords) {
    const resultsContainer = document.getElementById('bulkResults');
    const listContainer = document.getElementById('bulkPasswordsList');

    resultsContainer.classList.remove('hidden');

    listContainer.innerHTML = passwords.map((item, index) => `
        <div class="bulk-password-item">
            <div class="flex-1">
                <div class="flex items-center justify-between">
                    <span class="font-mono text-sm">${item.password}</span>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs px-2 py-1 rounded-full bg-${strengthAnalyzer.getLevelColor(item.strength.level)}-100 dark:bg-${strengthAnalyzer.getLevelColor(item.strength.level)}-900/30 text-${strengthAnalyzer.getLevelColor(item.strength.level)}-700 dark:text-${strengthAnalyzer.getLevelColor(item.strength.level)}-300">
                            ${item.strength.level === 'very-weak' ? 'Muito Fraca' :
            item.strength.level === 'weak' ? 'Fraca' :
                item.strength.level === 'fair' ? 'Razoável' :
                    item.strength.level === 'good' ? 'Boa' : 'Muito Forte'}
                        </span>
                        <button onclick="copyBulkPassword('${item.password}')" class="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Copiar">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

async function copyBulkPassword(password) {
    try {
        await utils.copyToClipboard(password);
        alertSystem.show('Senha copiada!', 'success', 2000);
        utils.playSound('copy');
    } catch (error) {
        alertSystem.show('Erro ao copiar senha!', 'error');
    }
}

async function copyAllPasswords() {
    if (state.bulkPasswords.length === 0) return;

    const allPasswords = state.bulkPasswords.map(item => item.password).join('\n');

    try {
        await utils.copyToClipboard(allPasswords);
        alertSystem.show(`${state.bulkPasswords.length} senhas copiadas!`, 'success');
        utils.playSound('copy');
    } catch (error) {
        alertSystem.show('Erro ao copiar senhas!', 'error');
    }
}

function exportPasswords() {
    if (state.bulkPasswords.length === 0) return;

    const csvContent = 'Senha,Comprimento,Força,Entropia\n' +
        state.bulkPasswords.map(item => {
            const entropy = utils.calculateEntropy(item.password);
            return `"${item.password}",${item.length},"${item.strength.level}",${Math.round(entropy)}`;
        }).join('\n');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    utils.downloadFile(csvContent, `senhas-${timestamp}.csv`, 'text/csv');

    alertSystem.show('Senhas exportadas com sucesso!', 'success');
    utils.playSound('success');
}

// History Management
function addToHistory(password, analysis) {
    const historyItem = {
        id: utils.generateId(),
        password: password,
        timestamp: new Date(),
        strength: analysis.level,
        length: password.length,
        entropy: Math.round(utils.calculateEntropy(password))
    };

    state.history.unshift(historyItem);

    // Keep only the last MAX_HISTORY items
    if (state.history.length > CONFIG.MAX_HISTORY) {
        state.history = state.history.slice(0, CONFIG.MAX_HISTORY);
    }

    saveHistory();
    updateHistoryCount();
}

function updateHistoryCount() {
    const countElement = document.getElementById('historyCount');
    if (state.history.length > 0) {
        countElement.textContent = state.history.length;
        countElement.classList.remove('hidden');
    } else {
        countElement.classList.add('hidden');
    }
}

function toggleHistory() {
    const modal = document.getElementById('historyModal');
    const isHidden = modal.classList.contains('hidden');

    if (isHidden) {
        displayHistory();
        modal.classList.remove('hidden');
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, CONFIG.ANIMATION_DURATION);
    }

    utils.playSound('click');
}

function displayHistory() {
    const listContainer = document.getElementById('historyList');

    if (state.history.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i data-lucide="history" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                <p>Nenhuma senha no histórico</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    listContainer.innerHTML = state.history.map(item => `
        <div class="history-item">
            <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-sm">${item.password}</span>
                    <div class="flex items-center space-x-2">
                        <button onclick="copyHistoryPassword('${item.password}')" class="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Copiar">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                        <button onclick="addToFavorites('${item.password}')" class="p-1 text-gray-400 hover:text-yellow-500 transition-colors" title="Favoritar">
                            <i data-lucide="star" class="w-4 h-4"></i>
                        </button>
                        <button onclick="removeFromHistory('${item.id}')" class="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Remover">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>${utils.formatDate(new Date(item.timestamp))}</span>
                    <div class="flex items-center space-x-4">
                        <span>${item.length} chars</span>
                        <span>${item.entropy} bits</span>
                        <span class="px-2 py-1 rounded-full bg-${strengthAnalyzer.getLevelColor(item.strength)}-100 dark:bg-${strengthAnalyzer.getLevelColor(item.strength)}-900/30 text-${strengthAnalyzer.getLevelColor(item.strength)}-700 dark:text-${strengthAnalyzer.getLevelColor(item.strength)}-300">
                            ${item.strength === 'very-weak' ? 'Muito Fraca' :
            item.strength === 'weak' ? 'Fraca' :
                item.strength === 'fair' ? 'Razoável' :
                    item.strength === 'good' ? 'Boa' : 'Muito Forte'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

async function copyHistoryPassword(password) {
    try {
        await utils.copyToClipboard(password);
        alertSystem.show('Senha copiada!', 'success', 2000);
        utils.playSound('copy');
    } catch (error) {
        alertSystem.show('Erro ao copiar senha!', 'error');
    }
}

function removeFromHistory(id) {
    state.history = state.history.filter(item => item.id !== id);
    saveHistory();
    updateHistoryCount();
    displayHistory();
    alertSystem.show('Item removido do histórico', 'info', 2000);
}

function clearHistory() {
    if (state.history.length === 0) return;

    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        state.history = [];
        saveHistory();
        updateHistoryCount();
        displayHistory();
        alertSystem.show('Histórico limpo com sucesso!', 'success');
        utils.playSound('success');
    }
}

// Favorites Management
function addToFavorites(password = null) {
    const targetPassword = password || state.currentPassword;

    if (!targetPassword) {
        alertSystem.show('Nenhuma senha para adicionar aos favoritos!', 'warning');
        return;
    }

    // Check if already in favorites
    if (state.favorites.some(fav => fav.password === targetPassword)) {
        alertSystem.show('Senha já está nos favoritos!', 'info');
        return;
    }

    const favoriteItem = {
        id: utils.generateId(),
        password: targetPassword,
        timestamp: new Date(),
        strength: strengthAnalyzer.analyze(targetPassword).level
    };

    state.favorites.push(favoriteItem);
    saveFavorites();

    // Update favorite button
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.innerHTML = '<i data-lucide="star" class="w-4 h-4 text-yellow-500"></i>';
        lucide.createIcons();
    }

    alertSystem.show('Senha adicionada aos favoritos!', 'success');
    utils.playSound('success');
}

// Settings Management
function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    const isHidden = modal.classList.contains('hidden');

    if (isHidden) {
        loadSettingsUI();
        modal.classList.remove('hidden');
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, CONFIG.ANIMATION_DURATION);
    }

    utils.playSound('click');
}

function loadSettingsUI() {
    document.getElementById('autoGenerate').checked = state.settings.autoGenerate;
    document.getElementById('autoCopy').checked = state.settings.autoCopy;
    document.getElementById('soundEffects').checked = state.settings.soundEffects;
}

function saveSettings() {
    state.settings.autoGenerate = document.getElementById('autoGenerate')?.checked ?? state.settings.autoGenerate;
    state.settings.autoCopy = document.getElementById('autoCopy')?.checked ?? state.settings.autoCopy;
    state.settings.soundEffects = document.getElementById('soundEffects')?.checked ?? state.settings.soundEffects;

    storage.save(CONFIG.STORAGE_KEYS.SETTINGS, state.settings);
}

function saveHistory() {
    storage.save(CONFIG.STORAGE_KEYS.HISTORY, state.history);
}

function saveFavorites() {
    storage.save(CONFIG.STORAGE_KEYS.FAVORITES, state.favorites);
}

// Additional Features
function downloadPassword() {
    if (!state.currentPassword) {
        alertSystem.show('Nenhuma senha para baixar!', 'warning');
        return;
    }

    const content = `Senha gerada: ${state.currentPassword}\nData: ${utils.formatDate(new Date())}\nComprimento: ${state.currentPassword.length} caracteres\nEntropia: ${Math.round(utils.calculateEntropy(state.currentPassword))} bits`;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    utils.downloadFile(content, `senha-${timestamp}.txt`, 'text/plain');
    alertSystem.show('Senha baixada com sucesso!', 'success');
    utils.playSound('success');
}

function sharePassword() {
    if (!state.currentPassword) {
        alertSystem.show('Nenhuma senha para compartilhar!', 'warning');
        return;
    }

    if (navigator.share) {
        navigator.share({
            title: 'Senha Segura Gerada',
            text: `Senha: ${state.currentPassword}`,
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        copiarSenha();
    }

    utils.playSound('click');
}

// Success Modal
function showSuccessModal(message = 'Operação realizada com sucesso.') {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');

    messageElement.textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('show');

    setTimeout(() => {
        closeSuccessModal();
    }, 3000);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, CONFIG.ANIMATION_DURATION);
}

// Initialization
function initializeApp() {
    // Load saved data
    state.settings = { ...state.settings, ...storage.load(CONFIG.STORAGE_KEYS.SETTINGS, {}) };
    state.history = storage.load(CONFIG.STORAGE_KEYS.HISTORY, []);
    state.favorites = storage.load(CONFIG.STORAGE_KEYS.FAVORITES, []);

    // Update UI
    updateHistoryCount();

    // Show advanced options if previously enabled
    if (state.settings.showAdvanced) {
        toggleAdvancedOptions();
    }

    // Auto-generate if enabled
    if (state.settings.autoGenerate) {
        setTimeout(() => {
            gerarSenha();
        }, 500);
    }

    // Event listeners
    setupEventListeners();
}

function setupEventListeners() {
    const lengthInput = document.getElementById('lengthInput');
    const lengthSlider = document.getElementById('lengthSlider');

    // Length input events
    lengthInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            gerarSenha();
        }
    });

    lengthInput.addEventListener('input', utils.debounce(function () {
        updateLengthFromInput();
        const value = parseInt(this.value);
        if (value < 4 || value > 64) {
            this.classList.add('border-red-500', 'dark:border-red-400');
        } else {
            this.classList.remove('border-red-500', 'dark:border-red-400');
        }
    }, 300));

    lengthSlider.addEventListener('input', updateLengthFromSlider);

    // Settings change events
    document.addEventListener('change', function (e) {
        if (e.target.closest('#settingsModal')) {
            saveSettings();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + G to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
            e.preventDefault();
            gerarSenha();
        }

        // Ctrl/Cmd + C to copy (when password field is focused)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' &&
            (document.activeElement.id === 'senhaGerada' || document.activeElement.id === 'analyzeInput')) {
            e.preventDefault();
            copiarSenha();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            closeSuccessModal();
            document.getElementById('settingsModal').classList.add('hidden');
            document.getElementById('historyModal').classList.add('hidden');
        }

        // Ctrl/Cmd + H for history
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            toggleHistory();
        }

        // Ctrl/Cmd + , for settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            toggleSettings();
        }
    });

    // Online/offline detection
    window.addEventListener('online', () => {
        alertSystem.show('Conexão restaurada!', 'success', 2000);
    });

    window.addEventListener('offline', () => {
        alertSystem.show('Sem conexão com a internet', 'warning', 0);
    });

    // Visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Refresh icons when tab becomes visible
            setTimeout(() => lucide.createIcons(), 100);
        }
    });
}

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Página carregada em ${loadTime}ms`);
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Erro global:', e.error);
    alertSystem.show('Ocorreu um erro inesperado', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rejeitada:', e.reason);
    alertSystem.show('Erro de conexão', 'error');
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
