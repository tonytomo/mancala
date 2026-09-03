import { BOARD_CONFIG, GAME_MODE } from '../core/Constants.js';
import { DakonEngine } from '../engine/DakonEngine.js';

/**
 * Encapsulates AI Bot decision-making and evaluation algorithms.
 */
export class BotStrategy {
    /**
     * Selects a move index for the Bot (Player 2) based on the specified difficulty.
     * @param {GameState} gameState
     * @param {number} mode (GAME_MODE.EASY | MEDIUM | EXPERT)
     * @returns {{ selectedPit: number, evaluations: number[] }}
     */
    static chooseMove(gameState, mode) {
        switch (mode) {
            case GAME_MODE.EXPERT:
                return BotStrategy.evaluateExpert(gameState);
            case GAME_MODE.MEDIUM:
                return BotStrategy.evaluateMedium(gameState);
            case GAME_MODE.EASY:
            default:
                return BotStrategy.evaluateEasy(gameState);
        }
    }

    /**
     * Easy: Picks a random non-empty pit.
     * @param {GameState} gameState
     * @returns {{ selectedPit: number, evaluations: number[] }}
     */
    static evaluateEasy(gameState) {
        const validMoves = DakonEngine.getValidMoves(gameState, BOARD_CONFIG.PLAYER_TWO.ID);
        if (validMoves.length === 0) {
            return { selectedPit: -1, evaluations: new Array(7).fill(0) };
        }

        const selectedPit = validMoves[Math.floor(Math.random() * validMoves.length)];
        const evaluations = new Array(7).fill(0);
        evaluations[selectedPit] = 1;

        return { selectedPit, evaluations };
    }

    /**
     * Medium: Prioritizes moves that end in own store (granting another turn).
     * If none or multiple, chooses randomly.
     * @param {GameState} gameState
     * @returns {{ selectedPit: number, evaluations: number[] }}
     */
    static evaluateMedium(gameState) {
        const validMoves = DakonEngine.getValidMoves(gameState, BOARD_CONFIG.PLAYER_TWO.ID);
        if (validMoves.length === 0) {
            return { selectedPit: -1, evaluations: new Array(7).fill(0) };
        }

        const totalSeeds = gameState.getTotalGameSeeds();
        const evaluations = new Array(7).fill(0.5);
        const storeLandedMoves = [];

        for (const pit of validMoves) {
            const simulation = DakonEngine.simulateMove(gameState, BOARD_CONFIG.PLAYER_TWO.ID, pit);
            if (simulation.extraTurn) {
                storeLandedMoves.push(pit);
                evaluations[pit] = Number(((totalSeeds - simulation.state.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX]) / totalSeeds).toFixed(1));
            } else {
                evaluations[pit] = Number((simulation.state.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX] / totalSeeds).toFixed(1));
            }
        }

        let selectedPit;
        if (storeLandedMoves.length > 0) {
            selectedPit = storeLandedMoves[Math.floor(Math.random() * storeLandedMoves.length)];
        } else {
            selectedPit = validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        return { selectedPit, evaluations };
    }

    /**
     * Expert: Minimax-style 2-ply lookahead.
     * 1. If store-landing moves exist: chooses the one that minimizes Player 1's best response.
     * 2. If no store-landing moves: chooses the move that maximizes Bot's store score.
     * @param {GameState} gameState
     * @returns {{ selectedPit: number, evaluations: number[] }}
     */
    static evaluateExpert(gameState) {
        const validMoves = DakonEngine.getValidMoves(gameState, BOARD_CONFIG.PLAYER_TWO.ID);
        if (validMoves.length === 0) {
            return { selectedPit: -1, evaluations: new Array(7).fill(0) };
        }

        const totalSeeds = gameState.getTotalGameSeeds();
        const evaluations = new Array(7).fill(0.5);
        const storeMoves = [];

        for (const pit of validMoves) {
            const botSim = DakonEngine.simulateMove(gameState, BOARD_CONFIG.PLAYER_TWO.ID, pit);
            if (botSim.extraTurn) {
                storeMoves.push(pit);
            }
        }

        let selectedPit = validMoves[0];

        if (storeMoves.length > 0) {
            if (storeMoves.length === 1) {
                selectedPit = storeMoves[0];
            } else {
                let minOpponentMax = Infinity;
                for (const pit of storeMoves) {
                    const botSim = DakonEngine.simulateMove(gameState, BOARD_CONFIG.PLAYER_TWO.ID, pit);
                    // Find Player 1's best response (maximizing Player 1's store)
                    const p1Moves = DakonEngine.getValidMoves(botSim.state, BOARD_CONFIG.PLAYER_ONE.ID);
                    let maxP1Store = botSim.state.holes[BOARD_CONFIG.PLAYER_ONE.STORE_INDEX];

                    for (const p1Pit of p1Moves) {
                        const p1Sim = DakonEngine.simulateMove(botSim.state, BOARD_CONFIG.PLAYER_ONE.ID, p1Pit);
                        const storeVal = p1Sim.state.holes[BOARD_CONFIG.PLAYER_ONE.STORE_INDEX];
                        if (storeVal > maxP1Store) {
                            maxP1Store = storeVal;
                        }
                    }

                    evaluations[pit] = Number(((totalSeeds - maxP1Store) / totalSeeds).toFixed(1));
                    if (maxP1Store < minOpponentMax) {
                        minOpponentMax = maxP1Store;
                        selectedPit = pit;
                    }
                }
            }
        } else {
            // No store-landing move: maximize Bot's own store
            let maxStore = -1;
            for (const pit of validMoves) {
                const botSim = DakonEngine.simulateMove(gameState, BOARD_CONFIG.PLAYER_TWO.ID, pit);
                const storeVal = botSim.state.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX];
                evaluations[pit] = Number((storeVal / totalSeeds).toFixed(1));

                if (storeVal > maxStore) {
                    maxStore = storeVal;
                    selectedPit = pit;
                }
            }
        }

        return { selectedPit, evaluations };
    }
}
