import { BOARD_CONFIG, GAME_MODE, TIMINGS } from '../core/Constants.js';
import { GameState } from '../models/GameState.js';
import { DakonEngine } from '../engine/DakonEngine.js';
import { BotStrategy } from '../ai/BotStrategy.js';
import { SoundManager } from '../audio/SoundManager.js';
import { BoardRenderer } from '../render/BoardRenderer.js';
import { UIManager } from '../ui/UIManager.js';

/**
 * Main Game Controller. Coordinates game state, animation loop, audio, renderer, UI, and inputs.
 */
export class GameController {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.gameState = new GameState();
        this.renderer = new BoardRenderer(canvas);
        this.ui = new UIManager();
        this.sound = new SoundManager();

        this.isPvP = false;
        this.botMode = GAME_MODE.EASY;
        this.currentPlayer = BOARD_CONFIG.PLAYER_ONE.ID;
        this.isAnimating = false;
        this.activeAnimationSession = 0; // Incremented on restart/cancellation to void stale timers
    }

    /**
     * Initialize game on page load
     */
    init() {
        this.ui.updatePvPState(this.isPvP);
        this.ui.updateModeDisplay(this.botMode);
        this.restart();
    }

    /**
     * Restarts the game with the selected seed configuration.
     */
    restart() {
        this.activeAnimationSession++;
        this.isAnimating = false;

        const initialSeeds = this.ui.getInitialSeeds(BOARD_CONFIG.DEFAULT_SEEDS_PER_PIT);
        this.gameState.reset(initialSeeds);
        this.currentPlayer = BOARD_CONFIG.PLAYER_ONE.ID;

        this.ui.clearLog();
        this.ui.addLog('____________________');
        this.ui.addLog('Game restarted!');
        this.ui.addLog(`Biji Awal = ${initialSeeds}`);
        this.ui.setNotification('Game mulai!');
        this.ui.resetAiMind();
        this.ui.setSkipButtonDisabled(false);

        this.renderer.render(this.gameState, {
            activePitIndex: -1,
            handSeeds: 0,
            handColor: '#414141',
        });

        this.enableCurrentPlayerControls();
    }

    /**
     * Toggles between Player vs Bot and Player vs Player (PvP).
     */
    togglePvP() {
        this.isPvP = !this.isPvP;
        this.ui.addLog('____________________');
        this.ui.addLog(this.isPvP ? '~ PVP ON ~' : '~ PVP OFF ~');
        this.ui.updatePvPState(this.isPvP);
        this.restart();
    }

    /**
     * Cycles Bot AI difficulty: EASY -> MEDIUM -> EXPERT -> EASY.
     */
    cycleMode() {
        this.botMode = (this.botMode + 1) % 3;
        const modeLabels = ['EASY', 'MEDIUM', 'EXPERT'];
        this.ui.addLog('____________________');
        this.ui.addLog(`@@ BOT ${modeLabels[this.botMode]} @@`);
        this.ui.updateModeDisplay(this.botMode);
        this.restart();
    }

    /**
     * Let Bot make the first turn.
     */
    triggerBotFirst() {
        if (this.isPvP || this.isAnimating) return;

        this.ui.setSkipButtonDisabled(true);
        this.ui.disableAllActionButtons();
        this.currentPlayer = BOARD_CONFIG.PLAYER_TWO.ID;
        this.executeBotTurn();
    }

    /**
     * Handle user pit selection (Player 1 or Player 2 in PvP).
     * @param {number} pitIndex
     */
    handleUserMove(pitIndex) {
        if (this.isAnimating) return;

        const expectedPlayer = GameState.isPlayerPit(BOARD_CONFIG.PLAYER_ONE.ID, pitIndex)
            ? BOARD_CONFIG.PLAYER_ONE.ID
            : BOARD_CONFIG.PLAYER_TWO.ID;

        if (this.currentPlayer !== expectedPlayer) return;
        if (this.gameState.holes[pitIndex] === 0) return;

        this.ui.setSkipButtonDisabled(true);
        this.executeMove(pitIndex, this.currentPlayer);
    }

    /**
     * Executes the Bot's turn with evaluation and move animation.
     */
    executeBotTurn() {
        if (this.isAnimating) return;

        // Terminal check before bot moves
        if (this.checkAndHandleGameOver(BOARD_CONFIG.PLAYER_TWO.ID)) {
            return;
        }

        const { selectedPit, evaluations } = BotStrategy.chooseMove(this.gameState, this.botMode);
        this.ui.updateAiMind(evaluations, selectedPit);

        if (selectedPit === -1 || this.gameState.holes[selectedPit] === 0) {
            this.checkAndHandleGameOver(BOARD_CONFIG.PLAYER_TWO.ID);
            return;
        }

        this.ui.addLog(`idx di ambil = ${selectedPit}`);
        this.executeMove(selectedPit, BOARD_CONFIG.PLAYER_TWO.ID);
    }

    /**
     * Asynchronous step-by-step seed distribution with sound, rendering, and relay logic.
     * @param {number} startPitIndex
     * @param {number} playerId
     */
    async executeMove(startPitIndex, playerId) {
        this.isAnimating = true;
        this.ui.disableAllActionButtons();
        const sessionId = this.activeAnimationSession;

        const player = GameState.getPlayerConfig(playerId);
        const playerPrefix = playerId === BOARD_CONFIG.PLAYER_ONE.ID ? 'P1' : (this.isPvP ? 'P2' : 'B');

        let seedsInHand = this.gameState.holes[startPitIndex];
        this.gameState.holes[startPitIndex] = 0;

        this.ui.addLog(`${playerPrefix} mulai!`);
        this.ui.addLog(`${playerPrefix} AMBIL= ${seedsInHand}, di= ${startPitIndex}`);

        // Initial pickup render
        this.renderer.render(this.gameState, {
            activePitIndex: -1,
            handSeeds: seedsInHand,
            handColor: player.COLOR,
        });

        let currentPit = startPitIndex;

        while (seedsInHand > 0) {
            // Wait for step delay
            await this.delay(TIMINGS.STEP_DELAY_MS);
            if (sessionId !== this.activeAnimationSession) return; // Cancelled if restarted

            // Advance to next pit, skipping opponent's store
            const nextPit = DakonEngine.getNextPitIndex(currentPit, playerId);
            if ((currentPit + 1) % BOARD_CONFIG.TOTAL_PITS === player.OPPONENT_STORE_INDEX) {
                const opponentStoreName = playerId === BOARD_CONFIG.PLAYER_ONE.ID ? 'lumbung lawan' : 'lumbung P1';
                this.ui.addLog(`${playerPrefix} lewat ${opponentStoreName}!`);
            }
            currentPit = nextPit;

            // Sow 1 seed
            this.gameState.holes[currentPit]++;
            seedsInHand--;

            // Audio & logs
            this.sound.playDrop();
            this.ui.addLog(`${playerPrefix} hand= ${seedsInHand}, idx= ${currentPit}`);
            this.ui.setNotification(playerId === BOARD_CONFIG.PLAYER_ONE.ID ? 'P1 berjalan!' : (this.isPvP ? 'P2 berjalan!' : 'Bot berjalan!'));

            // Render current step
            this.renderer.render(this.gameState, {
                activePitIndex: currentPit,
                handSeeds: seedsInHand,
                handColor: player.COLOR,
            });

            // If hand is now empty, evaluate landing condition:
            if (seedsInHand === 0) {
                await this.delay(TIMINGS.STEP_DELAY_MS);
                if (sessionId !== this.activeAnimationSession) return;

                // Case 1: Landed in own store -> Extra Turn
                if (currentPit === player.STORE_INDEX) {
                    this.renderer.render(this.gameState, {
                        activePitIndex: -1,
                        handSeeds: 0,
                        handColor: player.COLOR,
                    });

                    this.ui.addLog(`${playerPrefix} stop di LUMBUNG`);
                    this.ui.addLog(`${playerPrefix} AMBIL LAGI!`);
                    this.ui.setNotification(`${playerPrefix} ambil lagi!`);

                    this.isAnimating = false;

                    if (this.checkAndHandleGameOver(playerId)) {
                        return;
                    }

                    if (playerId === BOARD_CONFIG.PLAYER_TWO.ID && !this.isPvP) {
                        await this.delay(TIMINGS.BOT_TURN_DELAY_MS);
                        if (sessionId !== this.activeAnimationSession) return;
                        this.executeBotTurn();
                    } else {
                        this.enableCurrentPlayerControls();
                    }
                    return;
                }

                // Case 2: Landed in non-empty small pit -> Relay sow ("Ambil lagi")
                if (this.gameState.holes[currentPit] > 1) {
                    seedsInHand = this.gameState.holes[currentPit];
                    this.gameState.holes[currentPit] = 0;

                    this.ui.addLog(`${playerPrefix} LAGI= ${seedsInHand}, di= ${currentPit}`);

                    this.renderer.render(this.gameState, {
                        activePitIndex: currentPit,
                        handSeeds: seedsInHand,
                        handColor: player.COLOR,
                    });
                    continue; // Continue sowing loop with new seeds
                }

                // Case 3: Landed in empty small pit (now has 1 seed)
                const opponent = GameState.getOpponentConfig(playerId);

                if (GameState.isPlayerPit(playerId, currentPit)) {
                    // Own side -> Capture ("Nembak")
                    const oppositePit = DakonEngine.getOppositePitIndex(currentPit);
                    const oppositeSeeds = this.gameState.holes[oppositePit];
                    const captureSum = 1 + oppositeSeeds;

                    this.gameState.holes[currentPit] = 0;
                    this.gameState.holes[oppositePit] = 0;
                    this.gameState.holes[player.STORE_INDEX] += captureSum;

                    this.ui.addLog(`${playerPrefix} selesai, NEMBAK +${captureSum}`);

                    this.renderer.render(this.gameState, {
                        activePitIndex: -1,
                        handSeeds: 0,
                        handColor: opponent.COLOR,
                    });

                    this.switchTurn(opponent.ID, `${playerPrefix} nembak +${captureSum}`);
                } else {
                    // Opponent's side -> Turn ends ("Mati")
                    this.ui.addLog(`${playerPrefix} selesai, di= ${currentPit}`);

                    this.renderer.render(this.gameState, {
                        activePitIndex: -1,
                        handSeeds: 0,
                        handColor: opponent.COLOR,
                    });

                    this.switchTurn(opponent.ID);
                }
                return;
            }
        }
    }

    /**
     * Switches control to the opponent player.
     * @param {number} nextPlayerId
     * @param {string} prefixNotice
     */
    switchTurn(nextPlayerId, prefixNotice = '') {
        this.currentPlayer = nextPlayerId;
        this.isAnimating = false;

        const isP1Next = (nextPlayerId === BOARD_CONFIG.PLAYER_ONE.ID);
        const noticePfx = prefixNotice ? `${prefixNotice}, ` : '';

        if (isP1Next) {
            this.ui.addLog('PLAYER 1 TURN');
            this.ui.setNotification(`${noticePfx}Giliran P1!`);
        } else if (this.isPvP) {
            this.ui.addLog('PLAYER 2 TURN');
            this.ui.setNotification(`${noticePfx}Giliran P2!`);
        } else {
            this.ui.addLog('BOT TURN');
            this.ui.setNotification(`${noticePfx}Giliran Bot!`);
        }

        if (this.checkAndHandleGameOver(nextPlayerId)) {
            return;
        }

        if (nextPlayerId === BOARD_CONFIG.PLAYER_TWO.ID && !this.isPvP) {
            setTimeout(() => {
                if (this.currentPlayer === BOARD_CONFIG.PLAYER_TWO.ID && !this.isAnimating) {
                    this.executeBotTurn();
                }
            }, TIMINGS.BOT_TURN_DELAY_MS);
        } else {
            this.enableCurrentPlayerControls();
        }
    }

    /**
     * Checks for game-ending conditions, sweeps remaining seeds, and displays winner.
     * @param {number} playerId
     * @returns {boolean} True if game ended
     */
    checkAndHandleGameOver(playerId) {
        if (!DakonEngine.isGameOver(this.gameState, playerId)) {
            return false;
        }

        DakonEngine.sweepRemainingSeeds(this.gameState);
        const result = DakonEngine.getGameResult(this.gameState);

        this.renderer.render(this.gameState, {
            activePitIndex: -1,
            handSeeds: 0,
            gameOverResult: result,
        });

        this.ui.disableAllActionButtons();
        this.ui.setSkipButtonDisabled(true);

        this.ui.addLog('--------------');
        if (result.isTie) {
            this.ui.addLog('PERMAINAN SERI');
            this.ui.setNotification('Permainan Selesai: SERI!');
        } else if (result.winnerId === BOARD_CONFIG.PLAYER_ONE.ID) {
            this.ui.addLog('BIRU MENANG');
            this.ui.setNotification('Permainan Selesai: BIRU MENANG!');
        } else {
            this.ui.addLog('MERAH MENANG');
            this.ui.setNotification('Permainan Selesai: MERAH MENANG!');
        }
        this.ui.addLog('--------------');

        return true;
    }

    /**
     * Enables control buttons corresponding to active player
     */
    enableCurrentPlayerControls() {
        if (this.currentPlayer === BOARD_CONFIG.PLAYER_ONE.ID) {
            this.ui.setPlayer1ButtonsEnabled(true);
            this.ui.setPlayer2ButtonsEnabled(false);
        } else if (this.isPvP) {
            this.ui.setPlayer1ButtonsEnabled(false);
            this.ui.setPlayer2ButtonsEnabled(true);
        } else {
            this.ui.disableAllActionButtons();
        }
    }

    /**
     * Promise delay helper for step timing
     * @param {number} ms
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
