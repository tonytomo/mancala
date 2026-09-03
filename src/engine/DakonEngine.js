import { BOARD_CONFIG } from '../core/Constants.js';
import { GameState } from '../models/GameState.js';

/**
 * Pure game rules engine for Dakon/Mancala.
 * Contains zero UI, canvas, audio, or DOM logic.
 */
export class DakonEngine {
    /**
     * Calculates the symmetric opposite pit index for captures ("nembak").
     * Dakon board mapping: 14 <-> 0, 13 <-> 1, 12 <-> 2, etc.
     * @param {number} pitIndex
     * @returns {number}
     */
    static getOppositePitIndex(pitIndex) {
        if (pitIndex < 0 || pitIndex > 14 || pitIndex === 7) {
            throw new Error(`Invalid small pit index for opposite calculation: ${pitIndex}`);
        }
        return 14 - pitIndex;
    }

    /**
     * Determines the next pit in clockwise sowing order, skipping opponent's store.
     * @param {number} currentPit
     * @param {number} playerId
     * @returns {number}
     */
    static getNextPitIndex(currentPit, playerId) {
        const player = GameState.getPlayerConfig(playerId);
        let next = (currentPit + 1) % BOARD_CONFIG.TOTAL_PITS;
        if (next === player.OPPONENT_STORE_INDEX) {
            next = (next + 1) % BOARD_CONFIG.TOTAL_PITS;
        }
        return next;
    }

    /**
     * Retrieves all valid pit indices a player can move from.
     * @param {GameState} state
     * @param {number} playerId
     * @returns {number[]}
     */
    static getValidMoves(state, playerId) {
        const player = GameState.getPlayerConfig(playerId);
        return player.PITS.filter(idx => state.holes[idx] > 0);
    }

    /**
     * Evaluates whether the game has reached an end state:
     * 1. The current player's small pits are completely empty.
     * 2. Either player has accumulated more than half the total seeds in their store.
     * @param {GameState} state
     * @param {number} currentPlayerId
     * @returns {boolean}
     */
    static isGameOver(state, currentPlayerId) {
        if (state.isSideEmpty(currentPlayerId)) {
            return true;
        }
        const halfTotalSeeds = (state.initialSeeds * BOARD_CONFIG.PITS_PER_PLAYER * 2) / 2;
        const p1Store = state.holes[BOARD_CONFIG.PLAYER_ONE.STORE_INDEX];
        const p2Store = state.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX];

        return p1Store > halfTotalSeeds || p2Store > halfTotalSeeds;
    }

    /**
     * Sweeps all remaining seeds on each player's side into their respective stores.
     * Called when game end condition is triggered.
     * @param {GameState} state
     * @returns {{ p1Remaining: number, p2Remaining: number }}
     */
    static sweepRemainingSeeds(state) {
        let p1Sum = 0;
        let p2Sum = 0;

        for (const idx of BOARD_CONFIG.PLAYER_ONE.PITS) {
            p1Sum += state.holes[idx];
            state.holes[idx] = 0;
        }
        for (const idx of BOARD_CONFIG.PLAYER_TWO.PITS) {
            p2Sum += state.holes[idx];
            state.holes[idx] = 0;
        }

        state.holes[BOARD_CONFIG.PLAYER_ONE.STORE_INDEX] += p1Sum;
        state.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX] += p2Sum;

        return { p1Remaining: p1Sum, p2Remaining: p2Sum };
    }

    /**
     * Determines outcome after game end.
     * @param {GameState} state
     * @returns {{ winnerId: number|null, p1Score: number, p2Score: number, isTie: boolean }}
     */
    static getGameResult(state) {
        const p1Score = state.holes[BOARD_CONFIG.PLAYER_ONE.STORE_INDEX];
        const p2Score = state.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX];

        if (p1Score === p2Score) {
            return { winnerId: null, p1Score, p2Score, isTie: true };
        }
        const winnerId = p1Score > p2Score ? BOARD_CONFIG.PLAYER_ONE.ID : BOARD_CONFIG.PLAYER_TWO.ID;
        return { winnerId, p1Score, p2Score, isTie: false };
    }

    /**
     * Fully pure simulation of a complete turn sequence (sowing, relays, captures).
     * Used by AI evaluation and testing without manipulating any external state.
     * @param {GameState} initialState
     * @param {number} playerId
     * @param {number} startPitIndex
     * @returns {{
     *   state: GameState,
     *   extraTurn: boolean,
     *   capturedSeeds: number,
     *   lastLandedIndex: number
     * }}
     */
    static simulateMove(initialState, playerId, startPitIndex) {
        const state = initialState.clone();
        const player = GameState.getPlayerConfig(playerId);

        let currentPit = startPitIndex;
        let hand = state.holes[currentPit];
        state.holes[currentPit] = 0;

        let capturedSeeds = 0;
        let extraTurn = false;
        let lastLandedIndex = currentPit;

        while (hand > 0) {
            currentPit = DakonEngine.getNextPitIndex(currentPit, playerId);
            state.holes[currentPit]++;
            hand--;
            lastLandedIndex = currentPit;

            // When hand runs out:
            if (hand === 0) {
                // Landed in own store -> Extra Turn
                if (currentPit === player.STORE_INDEX) {
                    extraTurn = true;
                    break;
                }

                // Landed in a non-empty small pit -> Relay sow ("ambil lagi")
                if (state.holes[currentPit] > 1) {
                    hand = state.holes[currentPit];
                    state.holes[currentPit] = 0;
                    continue;
                }

                // Landed in an empty small pit:
                // Check if it is on the player's own side -> Capture ("nembak")
                if (GameState.isPlayerPit(playerId, currentPit)) {
                    const oppositePit = DakonEngine.getOppositePitIndex(currentPit);
                    const oppositeSeeds = state.holes[oppositePit];
                    const captureSum = 1 + oppositeSeeds;

                    state.holes[currentPit] = 0;
                    state.holes[oppositePit] = 0;
                    state.holes[player.STORE_INDEX] += captureSum;
                    capturedSeeds += captureSum;
                }
                // If on opponent's side, turn ends ("mati")
                break;
            }
        }

        return {
            state,
            extraTurn,
            capturedSeeds,
            lastLandedIndex,
        };
    }
}
