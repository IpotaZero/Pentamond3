import { GameMode } from "../Game/GameMode";
import { Mode1 } from "../Game/Modes/Mode1";
import { Mode2 } from "../Game/Modes/Mode2";
import { AutoKeyboardManager } from "../Interaction/AutoKeyboardManager";
import { inputManager } from "../Interaction/InputManager";
import { pageManager } from "../PageManager";
import { playBackground } from "../PlayBackground";
import { Replay, ReplayData } from "../Replay/Replay";
import { ResultPageHandler } from "./ResultPageHandler";
import { qs, qsAll, sleep } from "../Utils";
import { countDown } from "./countDown";
import { GamePlayer } from "../Game/GamePlayer";
import { Input } from "../Interaction/Input";

//ゲーム開始
export type PlaySetting = {
    playerNumber: number;
    mode: number;
    maxGameTime: number;
    handy: number[];
};

export class GameProcessing {
    private static readonly ModeClassList = [Mode1, Mode2];

    static playSetting: PlaySetting = {
        playerNumber: 1,
        mode: 1,
        maxGameTime: 300,
        handy: [1],
    };

    static game: GameMode | null = null;

    static players: GamePlayer[] = [];

    static replay = false;
    static readingReplayData: ReplayData | null = null;

    static async start() {
        //プレイが終了していない場合は終了させる
        if (this.game) {
            this.game.stop();
            this.game.remove();
        }

        // 背景をリセット
        playBackground.reset();

        //登録されているinputをもとにplayersを作成する
        this.players = this.createPlayers(
            this.playSetting.maxGameTime,
            inputManager.g$registeredInputs,
            inputManager.g$maxInputNumber,

            { readingReplayData: this.replay ? this.readingReplayData : null }
        );

        // ゲームを作成
        const CurrentMode = this.ModeClassList[this.playSetting.mode - 1];
        this.game = new CurrentMode(this.players);
        this.game.addEvent(["gameFinish"], async () => {
            await this.onGameFinish();
        });

        // ページ移動
        pageManager.setPage("play", { eventIgnore: true });
        pageManager.setPage("startEffect");

        //開始演出
        await countDown(["", "3", "2", "1", "START!"]);

        // 開始
        this.startGame();
    }

    static createPlayers(maxGameTime: number, inputs: Input[], inputCount: number, { readingReplayData }: { readingReplayData: ReplayData | null }) {
        const players = inputs.map((input) => new GamePlayer(input));

        players.forEach((player, i) => {
            if (inputCount == 1) {
                player.g$element.style.flex = "none";
                player.g$element.style.height = "100%";
                player.g$element.style.width = "";
            } else {
                player.g$element.style.flex = "";
                player.g$element.style.height = "";
                player.g$element.style.width = `0px`;
            }

            player.playInfo.maxGameTime = maxGameTime;
            player.playInfo.gameTime = maxGameTime;

            //リプレイ情報の読み込み
            if (readingReplayData) {
                player.operator.s$next = readingReplayData!.nextData[i];
                player.nuisanceMondManager.s$spawnCoordinates = readingReplayData!.nuisanceBlockData[i];
            }
        });

        return players;
    }

    private static startGame() {
        pageManager.backPages(1);

        this.game!.start();

        inputManager.g$registeredInputs.forEach((input) => {
            if (input.g$type == "autoKeyboard") {
                (input.g$manager as AutoKeyboardManager).playReset();
                (input.g$manager as AutoKeyboardManager).playStart();
            }
        });
    }

    private static async onGameFinish() {
        if (!this.game) {
            return;
        }

        if (this.replay && this.readingReplayData) {
            this.onFinishReplay();
        } else {
            this.onFinishNormal();
        }

        ResultPageHandler.updateDetailedResultPage(this.players, this.playSetting);

        inputManager.removeVirtualInputs();

        await sleep(1000);

        if (this.replay) {
            pageManager.setPage("replayResult");
        } else {
            pageManager.setPage("result");
        }

        this.game.remove();
        this.game = null;
    }

    private static onFinishReplay() {
        const data = this.readingReplayData!;

        data.finishPlayers.forEach((index) => {
            const player = this.players![index - 1];
            player.playInfo.playTime = data.finishTime;
            player.label.updateContents({ playTime: (data.finishTime / 1000).toFixed(2) });
        });

        qsAll(".resultLabel").forEach((resultLabel) => {
            if (resultLabel.innerText.includes("Time")) {
                resultLabel.innerText = `Time : ${(this.readingReplayData!.finishTime / 1000).toFixed(2)}`;
            }
        });
    }

    private static onFinishNormal() {
        Replay.addTempData(this.players, this.game!, this.playSetting);

        const saveButton = qs("#result .saveReplayButton");
        saveButton.innerText = "リプレイを保存する";

        saveButton.onclick = () => {
            saveButton.innerText = "保存中……";

            const succeed = Replay.saveLastOne();
            if (succeed) {
                Replay.setupSavedReplayPage();
                saveButton.innerText = "保存しました";
                saveButton.onclick = () => {};
            } else {
                saveButton.innerText = "リプレイを保存する";
            }
        };
    }
}
