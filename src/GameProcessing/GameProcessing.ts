import { Mode1 } from "../Game/Modes/Mode1";
import { Mode2 } from "../Game/Modes/Mode2";
import { Input } from "../Interaction/Input";
import { inputManager } from "../Interaction/InputManager";
import { pageManager } from "../PageManager";
import { playBackground } from "../PlayBackground";
import { PlaySetting } from "../BeforePlay";
import { Replay, ReplayData } from "../Replay/Replay";
import { DisposableGame } from "./DisposableGame";
import { ResultPageHandler } from "./ResultPageHandler";
import { countDown } from "./countDown";
import { qs } from "../Utils";

//ゲーム開始
export class GameProcessing {
    private static readonly ModeClassList = [Mode1, Mode2];

    static currentGame: DisposableGame | null = null;

    static resume() {
        if (!this.currentGame) throw new Error("プレイ中ではない");
        this.currentGame.game.start();
    }

    static isReplaying(): this is GameProcessing & { currentGame: DisposableGame & { replayData: ReplayData } } {
        if (!this.currentGame) throw new Error("プレイ中ではない");
        return this.currentGame.isReplay();
    }

    static restartReplay() {
        if (!this.isReplaying()) throw new Error("リプレイ中ではない");
        this.startReplay(this.currentGame.replayData);
    }

    static async startNormal(playSetting: PlaySetting) {
        this.beforeStart();

        this.currentGame = new DisposableGame(
            this.ModeClassList,
            inputManager.g$registeredInputs,
            inputManager.g$maxInputNumber,

            { playSetting }
        );

        this.currentGame.onFinished = () => {
            this.onFinishNormal();
        };

        // 画面にappend
        this.currentGame.appendPlayersTo(qs("#play"));

        await this.countDownAndStart();
    }

    static async startReplay(replayData: ReplayData) {
        this.beforeStart();

        inputManager.removeVirtualInputs();
        inputManager.resetRegister();
        inputManager.s$maxInputNumber = replayData.playSetting.playerNumber;

        const playerNumber = replayData.playSetting.playerNumber;
        for (let i = 0; i < playerNumber; i++) {
            const input = new Input("autoKeyboard");

            if (!input.isAuto()) throw new Error("あ");

            input.g$manager.s$inputData = replayData.inputData[i];
            inputManager.register(input);
        }

        this.currentGame = new DisposableGame(
            this.ModeClassList,
            inputManager.g$registeredInputs,
            inputManager.g$maxInputNumber,

            { replayData }
        );

        this.currentGame.onFinished = () => {
            this.onFinishReplay();
        };

        this.currentGame.appendPlayersTo(qs("#play"));

        await this.countDownAndStart();

        inputManager.g$registeredInputs.forEach((input) => {
            if (!input.isAuto()) throw new Error("あ");

            input.g$manager.playReset();
            input.g$manager.playStart();
        });
    }

    private static onFinishNormal() {
        pageManager.setPage("result");
        inputManager.removeVirtualInputs();

        Replay.addTempData(this.currentGame!);
        ResultPageHandler.setSaveButton();
        ResultPageHandler.updateDetailedResultPage(this.currentGame!);

        this.currentGame = null;
    }

    private static onFinishReplay() {
        pageManager.setPage("replayResult");
        inputManager.removeVirtualInputs();

        ResultPageHandler.OverWriteTime(this.currentGame!.replayData!.finishTime);
        ResultPageHandler.updateDetailedResultPage(this.currentGame!);

        this.currentGame = null;
    }

    private static async countDownAndStart() {
        //開始演出
        await countDown(["", "3", "2", "1", "START!"]);

        this.currentGame!.start();

        pageManager.backPages(1);
    }

    private static beforeStart() {
        // 背景をリセット
        playBackground.reset();

        // ページ移動
        pageManager.setPage("play", { eventIgnore: true });
        pageManager.setPage("startEffect");
    }
}
