import { GameMode } from "../Game/GameMode";

import { ResultPageHandler } from "./ResultPageHandler";
import { qs, sleep } from "../Utils";
import { countDown } from "./countDown";
import { GamePlayer } from "../Game/GamePlayer";
import { Input } from "../Interaction/Input";
import { GameProcessing } from "./GameProcessing";
import { PlaySetting } from "../BeforePlay";
import { ReplayData } from "../Replay/Replay";

/**
 * ゲームのセッティングから片付けまでやって捨てられるクラス
 */
export class DisposableGame {
    readonly players: GamePlayer[];
    readonly game: GameMode;

    readonly playSetting: PlaySetting;
    readonly replayData?: ReplayData;

    onFinished = () => {};

    constructor(inputs: Input[], inoutCount: number, { playSetting, replayData }: { playSetting?: PlaySetting; replayData?: ReplayData }) {
        if (replayData) {
            this.replayData = replayData;
            this.playSetting = replayData.playSetting;
        } else if (playSetting) {
            this.playSetting = structuredClone(playSetting);
        } else {
            throw new Error("引数不足");
        }

        //登録されているinputをもとにplayersを作成する
        this.players = DisposableGame.createPlayers(this.playSetting.maxGameTime, inputs, inoutCount, { replayData: this.replayData });

        // 画面にappend
        const playContainer = qs("#play");
        this.players.forEach((player) => {
            playContainer.appendChild(player.g$element);
        });

        // ゲームを作成
        const CurrentMode = GameProcessing.ModeClassList[this.playSetting.mode - 1];
        this.game = new CurrentMode(this.players);
        this.game.addEvent(["gameFinish"], async () => {
            await this.onGameFinish();
        });
    }

    isReplay() {
        return !!this.replayData;
    }

    async start() {
        this.game.start();
    }

    private async onGameFinish() {
        if (this.isReplay()) {
            this.onFinishReplay();
        }

        await sleep(1000);
        this.game.remove();
        this.onFinished();
    }

    private onFinishReplay() {
        const data = this.replayData;

        if (!data) throw new Error("この関数はリプレイ時のみ実行されるはず");

        // Timeを上書き
        data.finishPlayers.forEach((index) => {
            const player = this.players![index - 1];
            player.playInfo.playTime = data.finishTime;
            player.label.updateContents({ playTime: (data.finishTime / 1000).toFixed(2) });
        });
    }

    private static createPlayers(maxGameTime: number, inputs: Input[], inputCount: number, { replayData }: { replayData?: ReplayData }) {
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
            if (replayData) {
                player.operator.s$next = replayData.nextData[i];
                player.nuisanceMondManager.s$spawnCoordinates = replayData.nuisanceBlockData[i];
            }
        });

        return players;
    }
}
