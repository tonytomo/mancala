import { GAME_MODE_DETAILS } from '../core/Constants.js';

/**
 * Manages all DOM elements, user controls, event bindings, logs, and notification banners.
 */
export class UIManager {
    constructor() {
        this.cacheElements();
    }

    cacheElements() {
        this.btnP1 = Array.from(document.querySelectorAll('.btn'));
        this.btnP2 = Array.from(document.querySelectorAll('.btn1'));
        this.btnSkip = document.getElementById('skip');
        this.btnPvp = document.getElementById('pvpbtn');
        this.btnMode = document.getElementById('modebtn');
        this.btnClearLog = document.getElementById('clearbtn');
        this.btnStat = document.getElementById('statbtn');
        this.btnRestart = document.querySelector('.restartbtn');
        this.btnRule = document.querySelector('.rulebtn');
        this.inputBiji = document.getElementById('biji');

        this.notifEl = document.getElementById('notif');
        this.logList = document.getElementById('log');
        this.statContainer = document.getElementById('stat');
        this.aiBotContainer = document.getElementById('aibot');
        this.aiBoxes = Array.from(document.getElementsByClassName('aibox'));
        this.ruleModal = document.getElementById('rule');
        this.titleEl = document.getElementById('title');
    }

    /**
     * Set active/disabled state for Player 1 buttons
     * @param {boolean} enabled
     */
    setPlayer1ButtonsEnabled(enabled) {
        this.btnP1.forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    /**
     * Set active/disabled state for Player 2 buttons
     * @param {boolean} enabled
     */
    setPlayer2ButtonsEnabled(enabled) {
        this.btnP2.forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    /**
     * Disable all player action buttons
     */
    disableAllActionButtons() {
        this.setPlayer1ButtonsEnabled(false);
        this.setPlayer2ButtonsEnabled(false);
    }

    setSkipButtonDisabled(disabled) {
        if (this.btnSkip) {
            this.btnSkip.disabled = disabled;
        }
    }

    /**
     * Append message to log console and scroll to bottom
     * @param {string} text
     */
    addLog(text) {
        if (!this.logList) return;
        const li = document.createElement('li');
        li.textContent = text;
        this.logList.appendChild(li);
        li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Clear all messages in log
     */
    clearLog() {
        if (this.logList) {
            this.logList.innerHTML = '';
        }
    }

    /**
     * Update notification bar
     * @param {string} message
     */
    setNotification(message) {
        if (!this.notifEl) return;
        this.notifEl.innerHTML = '';
        const p = document.createElement('p');
        p.textContent = message;
        this.notifEl.appendChild(p);
    }

    /**
     * Update AI probability / evaluation boxes
     * @param {number[]} evaluations Array of 7 numbers for pits 0..6
     * @param {number} chosenIndex Index of selected pit
     */
    updateAiMind(evaluations, chosenIndex = -1) {
        if (!this.aiBoxes || this.aiBoxes.length === 0) return;

        evaluations.forEach((val, index) => {
            if (index >= this.aiBoxes.length) return;
            const box = this.aiBoxes[index];
            box.textContent = val.toString();

            const isChosen = (index === chosenIndex);
            if (val === 0.5) {
                box.style.backgroundColor = isChosen ? '#555' : '#444';
            } else if (val < 0.5) {
                box.style.backgroundColor = isChosen ? '#3765bd' : '#1e4388';
            } else {
                box.style.backgroundColor = isChosen ? '#c22d2d' : '#921f1f';
            }
        });
    }

    resetAiMind() {
        this.updateAiMind(new Array(7).fill(0.5));
    }

    /**
     * Update PvP button UI and mode visibility
     * @param {boolean} isPvP
     */
    updatePvPState(isPvP) {
        if (!this.btnPvp) return;

        if (isPvP) {
            this.btnPvp.innerText = 'PvP ON';
            this.btnPvp.style.backgroundColor = '#021f55';
            if (this.btnMode) this.btnMode.disabled = true;
            if (this.btnSkip) this.btnSkip.style.display = 'none';
        } else {
            this.btnPvp.innerText = 'PvP OFF';
            this.btnPvp.style.backgroundColor = '#353535';
            if (this.btnMode) this.btnMode.disabled = false;
            if (this.btnSkip) this.btnSkip.style.display = 'block';
        }
    }

    /**
     * Update Mode button label and style
     * @param {number} mode
     */
    updateModeDisplay(mode) {
        if (!this.btnMode) return;
        const details = GAME_MODE_DETAILS[mode];
        if (details) {
            this.btnMode.innerText = details.label;
            this.btnMode.style.backgroundColor = details.color;
        }
    }

    /**
     * Toggle Stats / AI mind panel visibility
     */
    toggleStats() {
        if (!this.statContainer || !this.aiBotContainer || !this.titleEl) return;

        const isHidden = this.statContainer.style.display === 'none' || !this.statContainer.style.display;
        if (isHidden) {
            this.statContainer.style.display = 'flex';
            this.aiBotContainer.style.display = 'flex';
            this.titleEl.style.backgroundImage = 'none';
        } else {
            this.statContainer.style.display = 'none';
            this.aiBotContainer.style.display = 'none';
            this.titleEl.style.backgroundImage = 'url(assets/logoname2.png)';
        }
    }

    /**
     * Toggle rules modal visibility
     */
    toggleRules() {
        if (!this.ruleModal) return;
        const isShown = this.ruleModal.style.display === 'flex';
        this.ruleModal.style.display = isShown ? 'none' : 'flex';
    }

    /**
     * Read and validate starting seeds input
     * @param {number} fallbackDefault
     * @returns {number}
     */
    getInitialSeeds(fallbackDefault = 7) {
        if (!this.inputBiji) return fallbackDefault;
        const val = parseInt(this.inputBiji.value, 10);
        if (isNaN(val) || val < 1 || val > 30) {
            this.inputBiji.value = fallbackDefault.toString();
            return fallbackDefault;
        }
        return val;
    }
}
