import { pageManager } from "../PageManager";
import { qsAddEvent } from "../Utils";
import { GameProcessing } from "./GameProcessing";
import { CurrentState } from "../CurrentState";
import { inputManager } from "../Interaction/InputManager";
import { BeforePlay } from "../BeforePlay";

export class GameStarter {
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
        qsAddEvent("#replayPause button:not(#replayResumeButton)", "click", () => {
            inputManager.removeVirtualInputs();
        });

        qsAddEvent("#replayResumeButton", "click", () => {
            GameProcessing.resume();
        });

        // replayPauseとreplayResultの「もう一度」
        qsAddEvent(".replayStart", "click", () => {
            pageManager.backLatestPage("replay", { eventIgnore: true });

            if (!CurrentState.readingReplayData) throw new Error("リプレイデータが選択されていません。");

            GameProcessing.startReplay(CurrentState.readingReplayData);
        });
    }
}
