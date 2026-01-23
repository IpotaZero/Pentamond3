import { pageManager } from "../PageManager";
import { qsAddEvent } from "../Utils";
import { GameProcessing } from "./GameProcessing";
import { inputManager } from "../Interaction/InputManager";
import { PlaySettingSetter } from "../BeforePlaying/PlaySettingSetter";

export class GameStartEventSetter {
    static setEvents() {
        this.normal();
        this.replay();
    }

    private static normal() {
        // 「スタート!」
        qsAddEvent(".playStart", "click", () => {
            GameProcessing.startNormal(PlaySettingSetter.getPlaySetting());
        });

        // ポーズ画面の「もう一度」・リザルト画面の「もう一度」
        qsAddEvent(".restart", "click", () => {
            pageManager.backLatestPage("playPrepare", { eventIgnore: true });
            GameProcessing.restartNormal();
        });

        // ポーズ画面の「再開する」
        qsAddEvent("#resumeButton", "click", () => {
            GameProcessing.resume();
        });
    }

    private static replay() {
        // replayを終了する
        qsAddEvent("#replayPause button:not(#replayResumeButton)", "click", () => {
            inputManager.removeVirtualInputs();
        });

        // ポーズ画面の「再開する」
        qsAddEvent("#replayResumeButton", "click", () => {
            GameProcessing.resume();
        });

        // ポーズ画面の「もう一度」・リザルト画面の「もう一度」
        qsAddEvent(".replayStart", "click", async () => {
            pageManager.backPages(2, { eventIgnore: true });
            GameProcessing.restartReplay();
        });
    }
}
