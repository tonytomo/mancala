/**
 * Encapsulates audio playback for Dakon.
 * Handles autoplay permission rejections and interruptions gracefully.
 */
export class SoundManager {
    /**
     * @param {string} soundUrl
     */
    constructor(soundUrl = 'assets/3224__edwin-p-manchester__04.wav') {
        this.soundUrl = soundUrl;
        this.audio = null;
        this.isMuted = false;
        this.initAudio();
    }

    initAudio() {
        try {
            this.audio = new Audio(this.soundUrl);
        } catch (err) {
            console.warn('Audio initialization failed:', err);
        }
    }

    /**
     * Play drop sound with rewind, ignoring browser autoplay interruptions.
     */
    playDrop() {
        if (this.isMuted || !this.audio) {
            return;
        }

        try {
            this.audio.pause();
            this.audio.currentTime = 0;
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((_err) => {
                    // Ignored: browser autoplay policy or rapid interruption
                });
            }
        } catch (_err) {
            // Audio context may not be ready
        }
    }

    setMuted(muted) {
        this.isMuted = Boolean(muted);
    }
}
