import { BGM } from "./BGM";
import { pageManager } from "./PageManager";
import { Sound } from "./Sound";
import { qs, qsAddEvent, qsAll, sleep } from "./Utils";
import { inputManager } from "./Interaction/InputManager";
import * as Setting from "./Settings";
import "./ScreenInteraction";
import { Replay } from "./Replay/Replay";
import { Game } from "./Game";

//ゲーム開始
export type PlaySetting = {
    playerNumber: number;
    mode: number;
    maxGameTime: number;
    handy: number[];
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
    Replay.setupSavedReplayPage();
    console.log(`The sum of size of replayData is ${Replay.getDataSize()}byte`);
});

const debug = false;

qsAddEvent(".playStart", "click", () => {
    pageManager.backLatestPage("playPrepare", { eventIgnore: true });
    Game.start();
});

qsAddEvent("#resumeButton", "click", () => {
    Game.game?.start();
});

//コントローラー登録
export let gamepadConfigs: Setting.GamepadConfig[] = [];

pageManager.addEvent(["setPage-playerRegister"], () => {
    Game.replay = false;
    if (inputManager.g$registeredInputNumber) {
        inputManager.removeVirtualInputs();
        inputManager.resetRegister();
    }
    Array.from(qs("#connectionLabel").children).forEach((element) => {
        element.remove();
    });
    qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${Game.playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;
    gamepadConfigs = [];
    inputManager.s$maxInputNumber = Game.playSetting.playerNumber;
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
    qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${Game.playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;
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
    pageManager.backPages(Game.playSetting.playerNumber == 1 ? 1 : 2, { eventIgnore: true });
    pageManager.setPage("playPrepare");
    qsAll("#playerRegister button").forEach((element) => {
        (element as HTMLButtonElement).disabled = false;
    });
    inputManager.start();
});

//モード読み込み
qsAddEvent("button[data-mode]", "click", (element) => {
    Game.playSetting.mode = +element.dataset.mode!;
});

qsAddEvent("button[data-player]", "click", (element) => {
    Game.playSetting.playerNumber = +element.dataset.player!;
});

qsAddEvent("#replayPause button:not(#replayResumeButton)", "click", () => {
    inputManager.removeVirtualInputs();
});

qsAddEvent("#replayResumeButton", "click", () => {
    Game.game?.start();
});

qsAddEvent(".replayStart", "click", () => {
    pageManager.backLatestPage("replay", { eventIgnore: true });
    Replay.startReplay(Game.readingReplayData!);
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
