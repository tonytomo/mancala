import { BOARD_CONFIG, CANVAS_CONFIG } from '../core/Constants.js';

/**
 * HTML5 Canvas renderer for the Dakon board, pits, seeds, active highlights, and endgame badge.
 */
export class BoardRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pitPositions = this.calculatePitPositions();
    }

    /**
     * Pre-computes exact coordinate metrics for all 16 pits.
     * @returns {Array<{ x: number, y: number, radius: number, defaultColor: string, activeColor: string }>}
     */
    calculatePitPositions() {
        const positions = new Array(BOARD_CONFIG.TOTAL_PITS);

        // Player 2 Small Pits: indices 0..6 (Left to Right on top row)
        for (let i = 0; i < 7; i++) {
            positions[i] = {
                x: 200 + i * 100,
                y: 100,
                radius: CANVAS_CONFIG.SMALL_PIT_RADIUS,
                defaultColor: BOARD_CONFIG.PLAYER_TWO.COLOR,
                activeColor: BOARD_CONFIG.PLAYER_TWO.ACTIVE_COLOR,
            };
        }

        // Player 2 Store: index 7 (Right side large circle)
        positions[7] = {
            x: 900,
            y: 200,
            radius: CANVAS_CONFIG.STORE_RADIUS,
            defaultColor: BOARD_CONFIG.PLAYER_TWO.COLOR,
            activeColor: BOARD_CONFIG.PLAYER_TWO.ACTIVE_COLOR,
        };

        // Player 1 Small Pits: indices 8..14 (Right to Left on bottom row)
        for (let i = 0; i < 7; i++) {
            positions[8 + i] = {
                x: 800 - i * 100,
                y: 300,
                radius: CANVAS_CONFIG.SMALL_PIT_RADIUS,
                defaultColor: BOARD_CONFIG.PLAYER_ONE.COLOR,
                activeColor: BOARD_CONFIG.PLAYER_ONE.ACTIVE_COLOR,
            };
        }

        // Player 1 Store: index 15 (Left side large circle)
        positions[15] = {
            x: 100,
            y: 200,
            radius: CANVAS_CONFIG.STORE_RADIUS,
            defaultColor: BOARD_CONFIG.PLAYER_ONE.COLOR,
            activeColor: BOARD_CONFIG.PLAYER_ONE.ACTIVE_COLOR,
        };

        return positions;
    }

    /**
     * Clears entire canvas area
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Renders the complete board state
     * @param {GameState} gameState
     * @param {object} visualState
     */
    render(gameState, visualState = {}) {
        const {
            activePitIndex = -1,
            handSeeds = 0,
            handColor = '#414141',
            gameOverResult = null,
        } = visualState;

        this.clear();

        // 1. Draw Hand indicator (top-left)
        this.drawCircleWithText(
            CANVAS_CONFIG.HAND_POS.x,
            CANVAS_CONFIG.HAND_POS.y,
            CANVAS_CONFIG.HAND_INDICATOR_RADIUS,
            handColor,
            handSeeds.toString()
        );

        // 2. Draw all 16 board pits
        for (let i = 0; i < BOARD_CONFIG.TOTAL_PITS; i++) {
            const pos = this.pitPositions[i];
            const isActive = (i === activePitIndex);
            const color = isActive ? pos.activeColor : pos.defaultColor;
            const seeds = gameState.holes[i];

            this.drawCircleWithText(pos.x, pos.y, pos.radius, color, seeds.toString());
        }

        // 3. Draw Game Over badge if terminal state reached
        if (gameOverResult) {
            this.drawGameOverBadge(gameOverResult);
        }
    }

    /**
     * Draws a filled circle with centered text
     */
    drawCircleWithText(x, y, radius, fillColor, text) {
        const { ctx } = this;

        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 40px ${CANVAS_CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y + 2);
        ctx.restore();
    }

    /**
     * Draws large centered game over overlay badge
     */
    drawGameOverBadge(result) {
        const { ctx } = this;
        let badgeColor = '#414141';
        let badgeText = 'TIE';

        if (!result.isTie) {
            if (result.winnerId === BOARD_CONFIG.PLAYER_ONE.ID) {
                badgeColor = BOARD_CONFIG.PLAYER_ONE.ACTIVE_COLOR;
                badgeText = 'BLUE WIN';
            } else {
                badgeColor = BOARD_CONFIG.PLAYER_TWO.ACTIVE_COLOR;
                badgeText = 'RED WIN';
            }
        }

        ctx.save();
        // Drop shadow for modern depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(500, 200, 120, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 38px ${CANVAS_CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, 500, 202);
        ctx.restore();
    }
}
