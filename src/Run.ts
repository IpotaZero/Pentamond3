import { BGM } from "./BGM";
import { pageManager } from "./PageManager";
import { Sound } from "./Sound";
import { getMinElement, qs, qsAddEvent, qsAll, removeMousePointerTemporary, sleep } from "./Utils";
import { inputManager } from "./Interaction/InputManager";
import { Mode1 } from "./Game/Modes/Mode1";
import { Mode2 } from "./Game/Modes/Mode2";
import { GamePlayer } from "./Game/GamePlayer";
import * as Setting from "./Settings";
import { GameMode, OperateName } from "./Game/GameMode";
import { playBackground } from "./PlayBackground";
import { AutoKeyboardInputData, AutoKeyboardManager } from "./Interaction/AutoKeyboardManager";
import "./ScreenInteraction";
import { Replay, ReplayData } from "./Replay/Replay";

//ゲーム開始
export type PlaySetting = {
    playerNumber: number;
    mode: number;
    maxGameTime: number;
    handy: number[];
};

export let playSetting = {
    playerNumber: 1,
    mode: 1,
    maxGameTime: 50,
    handy: [1],
};

//不正なページ遷移の防止
document.addEventListener("keydown", (e) => {
    if (e.code == "Tab" || e.code == "Space" || e.code == "Enter") {
        e.preventDefault();
    }
});

export function removeAllData() {
    localStorage.removeItem("Pentamond3-replayData");
    localStorage.removeItem("Pentamond3-graphicSetting");
}

qsAll("button").forEach((button) => {
    button.tabIndex = -1;
});
qsAll("input").forEach((button) => {
    button.tabIndex = -1;
});
qsAll("div[data-mapping]").forEach((button) => {
    button.tabIndex = 0;
});

//クリックによる開始
qsAddEvent("#pageStart", "click", () => {
    pageManager.setPage("title");
    // se[0].play();
});

//起動時処理
export let se: Sound[] = [];
document.addEventListener("DOMContentLoaded", async () => {
    pageManager.init();
    BGM.init();
    Sound.init();
    // se = [new Sound({ src: "assets/sounds/決定ボタンを押す32.mp3" }), new Sound({ src: "assets/sounds/カーソル移動9.mp3" }), new Sound({ src: "assets/sounds/正解のときの音.mp3" })];
    inputManager.s$maxInputNumber = 1;
    Replay.setupReplayData();
    Replay.setupSavedReplayData();
    console.log(`The sum of size of replayData is ${new Blob([localStorage.getItem("Pentamond3-replayData") ?? "[]"]).size}byte`);
});

const modeClass = [Mode1, Mode2];
export let game: GameMode | null;
export let players: GamePlayer[] | null;
const debug = false;
export let replay = false;

let readingReplayData: ReplayData | null = null as ReplayData | null;

export function set(option: { playSetting?: PlaySetting; replay?: boolean; readingReplayData?: ReplayData }) {
    playSetting = option.playSetting ?? playSetting;
    replay = option.replay ?? replay;
    readingReplayData = option.readingReplayData ?? readingReplayData;
}

qsAddEvent(".playStart", "click", () => {
    pageManager.backLatestPage("playPrepare", { eventIgnore: true });
    gameStart();
});

export function gameStart() {
    //プレイが終了していない場合は終了させる
    if (game) {
        game.stop();
        game.remove();
    }
    playBackground.reset();
    //登録されているinputをもとにGameModeを作成する
    players = inputManager.g$registeredInputs.map((input) => new GamePlayer(input));
    game = new modeClass[playSetting.mode - 1](players);
    players.forEach((player) => {
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
        player.playInfo.maxGameTime = playSetting.maxGameTime;
        player.playInfo.gameTime = playSetting.maxGameTime;
    });
    //リプレイ情報の読み込み
    if (replay && readingReplayData) {
        players.forEach((player, i) => {
            player.operator.s$next = readingReplayData!.nextData[i];
            player.nuisanceMondManager.s$spawnCoordinates = readingReplayData!.nuisanceBlockData[i];
        });
    }

    //ゲーム終了時処理
    game.addEvent(["gameFinish"], async () => {
        if (!game) {
            return;
        }

        if (replay && readingReplayData) {
            readingReplayData.finishPlayers.forEach((index) => {
                players![index - 1].playInfo.playTime = readingReplayData!.finishTime;
                players![index - 1].label.updateContents({ playTime: (readingReplayData!.finishTime / 1000).toFixed(2) });
            });

            qsAll(".resultLabel").forEach((resultLabel) => {
                if (resultLabel.innerHTML.includes("Time")) {
                    resultLabel.innerHTML = `Time : ${(readingReplayData!.finishTime / 1000).toFixed(2)}`;
                }
            });
        } else {
            Replay.setupReplayData();
        }

        createDetailedResult();

        inputManager.removeVirtualInputs();

        const saveButton = qs("#result .saveReplayButton");
        saveButton.innerText = "保存!";
        saveButton.onclick = () => {
            Replay.saveLastOne();
            Replay.setupSavedReplayData();
            saveButton.innerText = "保存した!";
            saveButton.onclick = () => {};
        };

        await sleep(1000);
        if (replay) {
            pageManager.setPage("replayResult");
        } else {
            pageManager.setPage("result");
        }
        game.remove();
        game = null;
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
                game!.start();
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

qsAddEvent("#resumeButton", "click", () => {
    game?.start();
});

//コントローラー登録
export let gamepadConfigs: Setting.GamepadConfig[] = [];

pageManager.addEvent(["setPage-playerRegister"], () => {
    replay = false;
    if (inputManager.g$registeredInputNumber) {
        inputManager.removeVirtualInputs();
        inputManager.resetRegister();
    }
    Array.from(qs("#connectionLabel").children).forEach((element) => {
        element.remove();
    });
    qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;
    gamepadConfigs = [];
    inputManager.s$maxInputNumber = playSetting.playerNumber;
    inputManager.startRegister();
});

qsAddEvent("#playerRegister .back", "click", () => {
    inputManager.resetRegister();
});

qsAddEvent("#playPrepare .back", "click", () => {
    inputManager.resetRegister();
});

inputManager.addEvent(["inputRegistered"], () => {
    const registerInputs = inputManager.g$registeredInputs;
    const typeIcon = document.createElement("div");
    // typeIcon.innerHTML = registerInputs[registerInputs.length - 1].g$type;
    typeIcon.dataset.inputType = registerInputs[registerInputs.length - 1].g$type;
    typeIcon.classList.add("inputTypeIcon");
    qs("#connectionLabel").appendChild(typeIcon);
    gamepadConfigs.push(Setting.gamepadConfigPresets[0]);
    qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;
});

inputManager.addEvent(["finishRegister"], () => {
    qs("#registerText").innerHTML = '<font style="color:#d66">完了！</font>';
});

qsAddEvent("#registerButton", "click", async () => {
    if (inputManager.g$registering) {
        if (debug) {
            inputManager.finishRegister();
        } else {
            return;
        }
    }
    inputManager.stop();
    qsAll("#playerRegister button").forEach((element) => {
        (element as HTMLButtonElement).disabled = true;
    });
    await sleep(500);
    pageManager.backPages(playSetting.playerNumber == 1 ? 1 : 2, { eventIgnore: true });
    pageManager.setPage("playPrepare");
    qsAll("#playerRegister button").forEach((element) => {
        (element as HTMLButtonElement).disabled = false;
    });
    inputManager.start();
});

//モード読み込み
qsAddEvent("button[data-mode]", "click", (element) => {
    playSetting.mode = +element.dataset.mode!;
});

qsAddEvent("button[data-player]", "click", (element) => {
    playSetting.playerNumber = +element.dataset.player!;
});

//詳細結果の中身を作成する
function createDetailedResult() {
    if (!players) {
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
        `Player人数 : ${players.length}<br />` + `モード : ${playSetting.mode == 1 ? "サバイバル" : "十五列揃え"}<br />` + (players.length != 1 ? `勝者 : ${qs(".resultLabel").innerHTML}<br />` : "");
    subPageController.before(subPage);

    players.forEach((p, i) => {
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
            ([1].includes(playSetting.mode) ? `開始Time : ${p.playInfo.maxGameTime}<br />` : "") +
            ([1].includes(playSetting.mode) ? `残りTime : ${p.playInfo.gameTime}<br />` : "") +
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

qsAddEvent("#replayPause button:not(#replayResumeButton)", "click", () => {
    inputManager.removeVirtualInputs();
});

qsAddEvent("#replayResumeButton", "click", () => {
    game?.start();
});

qsAddEvent(".replayStart", "click", () => {
    pageManager.backLatestPage("replay", { eventIgnore: true });
    Replay.startReplay(readingReplayData!);
});

// localStorage.removeItem("Pentamond3-replayData");

//グラフィック設定
export let graphicSetting = {
    putShake: true,
    removeShake: true,
    playBackground: true,
};

if (localStorage.getItem("Pentamond3-graphicSetting")) {
    const data = Number.parseInt(localStorage.getItem("Pentamond3-graphicSetting")!, 10)
        .toString(2)
        .split("")
        .map((word) => (word == "0" ? false : true));
    for (let i = 0; 3 - data.length; i++) {
        data.unshift(false);
    }
    graphicSetting.putShake = data[0];
    graphicSetting.removeShake = data[1];
    graphicSetting.playBackground = data[2];
    qs("#putShake" + (data[0] ? "On" : "Off")).style.color = "#ee8888";
    qs("#removeShake" + (data[1] ? "On" : "Off")).style.color = "#ee8888";
    qs("#playBackground" + (data[2] ? "On" : "Off")).style.color = "#ee8888";
} else {
    saveGraphicSetting();
}

function saveGraphicSetting() {
    const data = Number.parseInt([graphicSetting.putShake ? "1" : "0", graphicSetting.removeShake ? "1" : "0", graphicSetting.playBackground ? "1" : "0"].join(""), 2) + "";
    try {
        localStorage.setItem("Pentamond3-graphicSetting", data);
    } catch (error) {
        console.error("何らかの理由により設定の保存に失敗しました");
    }
    qs("#putShakeOn").style.color = graphicSetting.putShake ? "#ee8888" : "";
    qs("#putShakeOff").style.color = graphicSetting.putShake ? "" : "#ee8888";
    qs("#removeShakeOn").style.color = graphicSetting.removeShake ? "#ee8888" : "";
    qs("#removeShakeOff").style.color = graphicSetting.removeShake ? "" : "#ee8888";
    qs("#playBackgroundOn").style.color = graphicSetting.playBackground ? "#ee8888" : "";
    qs("#playBackgroundOff").style.color = graphicSetting.playBackground ? "" : "#ee8888";
}

qsAddEvent("#putShakeOn", "click", () => {
    if (graphicSetting.putShake) {
        return;
    }
    graphicSetting.putShake = true;
});
qsAddEvent("#putShakeOff", "click", () => {
    if (!graphicSetting.putShake) {
        return;
    }
    graphicSetting.putShake = false;
});
qsAddEvent("#removeShakeOn", "click", () => {
    if (graphicSetting.removeShake) {
        return;
    }
    graphicSetting.removeShake = true;
});
qsAddEvent("#removeShakeOff", "click", () => {
    if (!graphicSetting.removeShake) {
        return;
    }
    graphicSetting.removeShake = false;
});
qsAddEvent("#playBackgroundOn", "click", () => {
    if (graphicSetting.playBackground) {
        return;
    }
    graphicSetting.playBackground = true;
});
qsAddEvent("#playBackgroundOff", "click", () => {
    if (!graphicSetting.playBackground) {
        return;
    }
    graphicSetting.playBackground = false;
});

qsAddEvent("#graphicSetting button", "click", () => {
    saveGraphicSetting();
});

pageManager.addEvent(["setPage-dataSetting"], () => {
    const dataSize = new Blob([localStorage.getItem("Pentamond3-replayData") ?? "", localStorage.getItem("Pentamond3-graphicSetting") ?? ""]).size;
    qs("#dataInformation").innerHTML = `全データの容量：${dataSize} B`;
});

pageManager.addEvent(["setPage-allDataDeleteAlert"], () => {
    const confirmButton = qs("#allDataDeleteConfirmButton") as HTMLButtonElement;
    confirmButton.disabled = true;
    confirmButton.style.opacity = "0";
    sleep(1500).then(() => {
        confirmButton.disabled = false;
        confirmButton.style.opacity = "1";
    });
});

qsAddEvent("#allDataDeleteConfirmButton", "click", () => {
    removeAllData();
    pageManager.backPages(2);
    pageManager.setPage("dataSetting");
});
