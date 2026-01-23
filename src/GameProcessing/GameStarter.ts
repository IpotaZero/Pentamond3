import { pageManager } from "../PageManager";
import { qsAddEvent } from "../Utils";
import { GameProcessing } from "./GameProcessing";
import { inputManager } from "../Interaction/InputManager";
import { BeforePlay } from "../BeforePlay";

export class GameStartEventSetter {
    static setEvents() {
        this.normal();
        this.replay();
    }

    private static normal() {
        qsAddEvent(".playStart", "click", () => {
            pageManager.backLatestPage("playPrepare", { eventIgnore: true });
            GameProcessing.startNormal(BeforePlay.playSetting);
        });

        qsAddEvent("#resumeButton", "click", () => {
            GameProcessing.resume();
        });
    }

    private static replay() {
        // replayを終了する
        qsAddEvent("#replayPause button:not(#replayResumeButton)", "click", () => {
            inputManager.removeVirtualInputs();
        });

        qsAddEvent("#replayResumeButton", "click", () => {
            GameProcessing.resume();
        });

        // replayPauseとreplayResultの「もう一度」
        qsAddEvent(".replayStart", "click", () => {
            pageManager.backLatestPage("replay", { eventIgnore: true });
            GameProcessing.restartReplay();
        });
    }
}
