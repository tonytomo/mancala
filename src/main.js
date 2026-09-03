import { GameController } from './controller/GameController.js';

/**
 * Application Bootstrap & Event Binding
 */
let gameController = null;

export function initializeApp() {
    const canvas = document.getElementById('myCanvas');
    if (!canvas) {
        console.error('Canvas element #myCanvas not found.');
        return;
    }

    gameController = new GameController(canvas);
    gameController.init();

    bindEventListeners(gameController);
    setupGlobalApi(gameController);
}

/**
 * Modern event listener registration (eliminates need for inline HTML handlers)
 * @param {GameController} controller
 */
function bindEventListeners(controller) {
    // Player 1 controller buttons: indices 14 down to 8
    const p1Buttons = document.querySelectorAll('.player-1 .btn');
    const p1Indices = [14, 13, 12, 11, 10, 9, 8];
    p1Buttons.forEach((btn, i) => {
        const pitIndex = p1Indices[i];
        btn.addEventListener('click', () => controller.handleUserMove(pitIndex));
    });

    // Player 2 controller buttons: indices 0 up to 6
    const p2Buttons = document.querySelectorAll('.player-2 .btn1');
    p2Buttons.forEach((btn, i) => {
        const pitIndex = i;
        btn.addEventListener('click', () => controller.handleUserMove(pitIndex));
    });

    // Game control bar buttons
    const skipBtn = document.getElementById('skip');
    if (skipBtn) skipBtn.addEventListener('click', () => controller.triggerBotFirst());

    const restartBtn = document.querySelector('.restartbtn');
    if (restartBtn) restartBtn.addEventListener('click', () => controller.restart());

    const pvpBtn = document.getElementById('pvpbtn');
    if (pvpBtn) pvpBtn.addEventListener('click', () => controller.togglePvP());

    const modeBtn = document.getElementById('modebtn');
    if (modeBtn) modeBtn.addEventListener('click', () => controller.cycleMode());

    const clearBtn = document.getElementById('clearbtn');
    if (clearBtn) clearBtn.addEventListener('click', () => controller.ui.clearLog());

    const statBtn = document.getElementById('statbtn');
    if (statBtn) statBtn.addEventListener('click', () => controller.ui.toggleStats());

    const ruleBtns = document.querySelectorAll('.rulebtn, .modal-box button');
    ruleBtns.forEach(btn => {
        btn.addEventListener('click', () => controller.ui.toggleRules());
    });

    const seedInput = document.getElementById('biji');
    if (seedInput) {
        seedInput.addEventListener('change', () => controller.restart());
    }
}

/**
 * Backward compatibility with legacy inline handlers & debugging
 * @param {GameController} controller
 */
function setupGlobalApi(controller) {
    window.gameController = controller;
    window.init = () => controller.init();
    window.tap = (idx) => controller.handleUserMove(idx);
    window.tap1 = (idx) => controller.handleUserMove(idx);
    window.restart = () => controller.restart();
    window.pvpOn = () => controller.togglePvP();
    window.changeMode = () => controller.cycleMode();
    window.clearLog = () => controller.ui.clearLog();
    window.statToggle = () => controller.ui.toggleStats();
    window.ruleToggle = () => controller.ui.toggleRules();
    window.botFirst = () => controller.triggerBotFirst();
}

// Auto-bootstrap when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
