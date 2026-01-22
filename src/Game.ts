import { GameMode } from "./Game/GameMode";
import { GamePlayer } from "./Game/GamePlayer";
import { Mode1 } from "./Game/Modes/Mode1";
import { Mode2 } from "./Game/Modes/Mode2";
import { AutoKeyboardManager } from "./Interaction/AutoKeyboardManager";
import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";
import { playBackground } from "./PlayBackground";
import { Replay, ReplayData } from "./Replay/Replay";
import { qs, qsAll, sleep } from "./Utils";

//ゲーム開始
export type PlaySetting = {
    playerNumber: number;
    mode: number;
    maxGameTime: number;
    handy: number[];
};

export class Game {
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

    static start() {
        //プレイが終了していない場合は終了させる
        if (this.game) {
            this.game.stop();
            this.game.remove();
        }

        playBackground.reset();

        //登録されているinputをもとにGameModeを作成する
        this.players = inputManager.g$registeredInputs.map((input) => new GamePlayer(input));

        this.game = new this.ModeClassList[this.playSetting.mode - 1](this.players);

        this.players.forEach((player) => {
            if (inputManager.g$registeredInputNumber == 1) {
                player.g$element.style.flex = "none";
                player.g$element.style.height = "100%";
                player.g$element.style.width = "";
            } else {
                player.g$element.style.flex = "";
                player.g$element.style.height = "";
                player.g$element.style.width = `0px`;
            }
            qs("#play").appendChild(player.g$element);
            player.playInfo.maxGameTime = this.playSetting.maxGameTime;
            player.playInfo.gameTime = this.playSetting.maxGameTime;
        });

        //リプレイ情報の読み込み
        if (this.replay && this.readingReplayData) {
            this.players.forEach((player, i) => {
                player.operator.s$next = this.readingReplayData!.nextData[i];
                player.nuisanceMondManager.s$spawnCoordinates = this.readingReplayData!.nuisanceBlockData[i];
            });
        }

        //ゲーム終了時処理
        this.game.addEvent(["gameFinish"], async () => {
            if (!this.game) {
                return;
            }

            if (this.replay && this.readingReplayData) {
                this.readingReplayData.finishPlayers.forEach((index) => {
                    this.players![index - 1].playInfo.playTime = this.readingReplayData!.finishTime;
                    this.players![index - 1].label.updateContents({ playTime: (this.readingReplayData!.finishTime / 1000).toFixed(2) });
                });

                qsAll(".resultLabel").forEach((resultLabel) => {
                    if (resultLabel.innerHTML.includes("Time")) {
                        resultLabel.innerHTML = `Time : ${(this.readingReplayData!.finishTime / 1000).toFixed(2)}`;
                    }
                });
            } else {
                Replay.addTempData(this.players!, this.game!, this.playSetting);

                const saveButton = qs("#result .saveReplayButton");
                saveButton.innerText = "保存!";
                saveButton.onclick = () => {
                    if (Replay.saveLastOne()) {
                        Replay.setupSavedReplayPage();
                        saveButton.innerText = "保存した!";
                        saveButton.onclick = () => {};
                    } else {
                        alert("save失敗!");
                    }
                };
            }

            this.createDetailedResult();

            inputManager.removeVirtualInputs();

            await sleep(1000);
            if (this.replay) {
                pageManager.setPage("replayResult");
            } else {
                pageManager.setPage("result");
            }

            this.game.remove();
            this.game = null;
        });

        //開始演出
        const countString: string[] = ["", "3", "2", "1", "START!"];
        const countDown = () => {
            const startEffectLabel = document.createElement("div");
            startEffectLabel.classList.add("startEffectLabel");
            startEffectLabel.innerHTML = countString.shift() ?? "";
            if (countString.length == 0) {
                startEffectLabel.id = "startLabel";
            } else if (startEffectLabel.innerHTML != "") {
            }
            qs("#startEffectBase").appendChild(startEffectLabel);
            startEffectLabel.onanimationend = () => {
                startEffectLabel.remove();
                if (countString.length) {
                    countDown();
                } else {
                    pageManager.backPages(1);
                    this.game!.start();
                    inputManager.g$registeredInputs.forEach((input) => {
                        if (input.g$type == "autoKeyboard") {
                            (input.g$manager as AutoKeyboardManager).playReset();
                            (input.g$manager as AutoKeyboardManager).playStart();
                        }
                    });
                }
            };
        };

        pageManager.setPage("play", { eventIgnore: true });
        pageManager.setPage("startEffect");
        countDown();
    }

    //詳細結果の中身を作成する
    static createDetailedResult() {
        if (!Game.players) {
            return;
        }
        qsAll("#detailedResult .subPage").forEach((subPage) => {
            subPage.remove();
        });
        const subPageController = qs("#detailedResult .subPageController");
        const subPage = document.createElement("div");
        subPage.classList.add("subPage");
        const text = document.createElement("div");
        text.classList.add("text");
        subPage.appendChild(text);
        text.innerHTML =
            `Player人数 : ${Game.players.length}<br />` +
            `モード : ${Game.playSetting.mode == 1 ? "サバイバル" : "十五列揃え"}<br />` +
            (Game.players.length != 1 ? `勝者 : ${qs(".resultLabel").innerHTML}<br />` : "");
        subPageController.before(subPage);

        Game.players.forEach((p, i) => {
            const subPage = document.createElement("div");
            subPage.classList.add("subPage");
            const text = document.createElement("div");
            text.classList.add("text");
            subPage.appendChild(text);
            const text2 = document.createElement("div");
            text2.classList.add("text");
            subPage.appendChild(text2);
            const text3 = document.createElement("div");
            text3.classList.add("text");
            subPage.appendChild(text3);

            text.innerHTML =
                `Player : ${i + 1}<br />` +
                ([1].includes(Game.playSetting.mode) ? `開始Time : ${p.playInfo.maxGameTime}<br />` : "") +
                ([1].includes(Game.playSetting.mode) ? `残りTime : ${p.playInfo.gameTime}<br />` : "") +
                `プレイ時間 : ${(p.playInfo.playTime / 1000).toFixed(2)}<br />` +
                `役の回数 : ${p.playInfo.trickCount}<br />` +
                `一列揃え : ${p.playInfo.line}<br />` +
                `最大Chain : ${p.playInfo.maxChain}<br />` +
                `Score : ${p.playInfo.score}<br />`;

            text2.innerHTML =
                `ペナルティ : ${p.playInfo.penalty}<br />` +
                `回復 : ${p.playInfo.recovery}<br />` +
                `余剰回復 : ${p.playInfo.surplus}<br />` +
                `設置 : ${p.playInfo.put}<br />` +
                `ホールド : ${p.playInfo.hold}<br />` +
                `一手戻し : ${p.playInfo.unput}<br />` +
                `消去 : ${p.playInfo.remove}<br />`;
            text3.innerHTML = `合計ダメージ : ${p.damageInfo.totalDamage}<br />` + `合計攻撃 : ${p.damageInfo.totalAttack}<br />` + `ハンデ : ×${p.playInfo.handy}<br />`;
            subPageController.before(subPage);
        });
    }
}
