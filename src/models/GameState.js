import { BOARD_CONFIG } from '../core/Constants.js';

/**
 * Encapsulates Dakon board state. Pure data model with no rendering or DOM dependencies.
 */
export class GameState {
    /**
     * @param {number} initialSeedsPerPit
     */
    constructor(initialSeedsPerPit = BOARD_CONFIG.DEFAULT_SEEDS_PER_PIT) {
        this.initialSeeds = initialSeedsPerPit;
        this.holes = new Array(BOARD_CONFIG.TOTAL_PITS).fill(0);
        this.reset(initialSeedsPerPit);
    }

    /**
     * Resets the board to starting configuration
     * @param {number} seedsPerPit
     */
    reset(seedsPerPit = this.initialSeeds) {
        this.initialSeeds = seedsPerPit;
        this.holes = new Array(BOARD_CONFIG.TOTAL_PITS).fill(0);

        // Populate small pits for Player 1 and Player 2
        for (const idx of BOARD_CONFIG.PLAYER_ONE.PITS) {
            this.holes[idx] = seedsPerPit;
        }
        for (const idx of BOARD_CONFIG.PLAYER_TWO.PITS) {
            this.holes[idx] = seedsPerPit;
        }

        // Stores start empty
        this.holes[BOARD_CONFIG.PLAYER_ONE.STORE_INDEX] = 0;
        this.holes[BOARD_CONFIG.PLAYER_TWO.STORE_INDEX] = 0;
    }

    /**
     * Deep copy of the game state for AI simulation and rollback
     * @returns {GameState}
     */
    clone() {
        const copy = new GameState(this.initialSeeds);
        copy.holes = [...this.holes];
        return copy;
    }

    /**
     * Get player definition from ID (1 or 2)
     * @param {number} playerId
     * @returns {object}
     */
    static getPlayerConfig(playerId) {
        return playerId === BOARD_CONFIG.PLAYER_ONE.ID
            ? BOARD_CONFIG.PLAYER_ONE
            : BOARD_CONFIG.PLAYER_TWO;
    }

    /**
     * Get opponent definition from ID
     * @param {number} playerId
     * @returns {object}
     */
    static getOpponentConfig(playerId) {
        return playerId === BOARD_CONFIG.PLAYER_ONE.ID
            ? BOARD_CONFIG.PLAYER_TWO
            : BOARD_CONFIG.PLAYER_ONE;
    }

    /**
     * Check if a pit belongs to a specific player
     * @param {number} playerId
     * @param {number} pitIndex
     * @returns {boolean}
     */
    static isPlayerPit(playerId, pitIndex) {
        const player = GameState.getPlayerConfig(playerId);
        return player.PITS.includes(pitIndex);
    }

    /**
     * Get total seeds currently residing in small pits of a player
     * @param {number} playerId
     * @returns {number}
     */
    getTotalSideSeeds(playerId) {
        const player = GameState.getPlayerConfig(playerId);
        return player.PITS.reduce((sum, idx) => sum + this.holes[idx], 0);
    }

    /**
     * Get total seeds across entire game
     * @returns {number}
     */
    getTotalGameSeeds() {
        return this.initialSeeds * BOARD_CONFIG.PITS_PER_PLAYER * 2;
    }

    /**
     * Check if small pits on a player's side are completely empty
     * @param {number} playerId
     * @returns {boolean}
     */
    isSideEmpty(playerId) {
        return this.getTotalSideSeeds(playerId) === 0;
    }
}
