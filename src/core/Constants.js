/**
 * Constants and Game Configurations for Dakon / Mancala
 */

export const BOARD_CONFIG = Object.freeze({
    PITS_PER_PLAYER: 7,
    TOTAL_PITS: 16,
    PLAYER_ONE: {
        ID: 1,
        NAME: 'Player 1',
        COLOR: '#021e55',
        ACTIVE_COLOR: '#1e4388',
        PITS: [8, 9, 10, 11, 12, 13, 14],
        STORE_INDEX: 15,
        OPPONENT_STORE_INDEX: 7,
    },
    PLAYER_TWO: {
        ID: 2,
        NAME: 'Player 2',
        COLOR: '#611414',
        ACTIVE_COLOR: '#921f1f',
        PITS: [0, 1, 2, 3, 4, 5, 6],
        STORE_INDEX: 7,
        OPPONENT_STORE_INDEX: 15,
    },
    DEFAULT_SEEDS_PER_PIT: 7,
});

export const GAME_MODE = Object.freeze({
    EASY: 0,
    MEDIUM: 1,
    EXPERT: 2,
});

export const GAME_MODE_DETAILS = Object.freeze({
    [GAME_MODE.EASY]: {
        label: 'EASY',
        color: '#005c02',
        description: 'Random valid moves',
    },
    [GAME_MODE.MEDIUM]: {
        label: 'MEDIUM',
        color: '#021e55',
        description: 'Prioritizes landing in own store',
    },
    [GAME_MODE.EXPERT]: {
        label: 'EXPERT',
        color: '#490f70',
        description: 'Store-priority with minimax opponent minimization',
    },
});

export const TIMINGS = Object.freeze({
    STEP_DELAY_MS: 400,
    BOT_TURN_DELAY_MS: 1000,
});

export const CANVAS_CONFIG = Object.freeze({
    WIDTH: 1000,
    HEIGHT: 400,
    SMALL_PIT_RADIUS: 40,
    STORE_RADIUS: 60,
    HAND_INDICATOR_RADIUS: 40,
    HAND_POS: { x: 50, y: 50 },
    FONT_FAMILY: 'Arial, sans-serif',
});
