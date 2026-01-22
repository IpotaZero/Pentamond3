import { BGM } from "./BGM";
import { pageManager } from "./PageManager";
import { Sound } from "./Sound";
import { qs, qsAddEvent, qsAll, sleep } from "./Utils";
import { inputManager } from "./Interaction/InputManager";
import * as Setting from "./Settings";
import "./ScreenInteraction";
import { Replay } from "./Replay/Replay";
import { GameProcessing } from "./GameProcessing";
import { GraphicSetting } from "./GraphicSetting";
import { soundsInit } from "./SoundProcessing";
import { LoopManager } from "./LoopManager";

//不正なページ遷移の防止
document.addEventListener("keydown", (e) => {
    if (["Tab", "Space", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
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
    soundsInit();
    inputManager.s$maxInputNumber = 1;
    Replay.setupSavedReplayPage();
    console.log(`The sum of size of replayData is ${Replay.getDataSize()}byte`);
});

const debug = false;

qsAddEvent(".playStart", "click", () => {
    pageManager.backLatestPage("playPrepare", { eventIgnore: true });
    GameProcessing.start();
});

qsAddEvent("#resumeButton", "click", () => {
    GameProcessing.game?.start();
});

//コントローラー登録
export let gamepadConfigs: Setting.GamepadConfig[] = [];

pageManager.addEvent(["setPage-playerRegister"], () => {
    GameProcessing.replay = false;
    if (inputManager.g$registeredInputNumber) {
        inputManager.removeVirtualInputs();
        inputManager.resetRegister();
    }
    Array.from(qs("#connectionLabel").children).forEach((element) => {
        element.remove();
    });
    qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${GameProcessing.playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;
    gamepadConfigs = [];
    inputManager.s$maxInputNumber = GameProcessing.playSetting.playerNumber;
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
    qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${GameProcessing.playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;
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
    pageManager.backPages(GameProcessing.playSetting.playerNumber == 1 ? 1 : 2, { eventIgnore: true });
    pageManager.setPage("playPrepare");
    qsAll("#playerRegister button").forEach((element) => {
        (element as HTMLButtonElement).disabled = false;
    });
    inputManager.start();
});

//モード読み込み
qsAddEvent("button[data-mode]", "click", (element) => {
    GameProcessing.playSetting.mode = +element.dataset.mode!;
});

qsAddEvent("button[data-player]", "click", (element) => {
    GameProcessing.playSetting.playerNumber = +element.dataset.player!;
});

qsAddEvent("#replayPause button:not(#replayResumeButton)", "click", () => {
    inputManager.removeVirtualInputs();
});

qsAddEvent("#replayResumeButton", "click", () => {
    GameProcessing.game?.start();
});

qsAddEvent(".replayStart", "click", () => {
    pageManager.backLatestPage("replay", { eventIgnore: true });
    Replay.startReplay(GameProcessing.readingReplayData!);
});

// localStorage.removeItem("Pentamond3-replayData");

GraphicSetting.init();

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
    pageManager.backPages(2, { eventIgnore: true });
    pageManager.setPage("dataSetting");
});

// let count = 0;
// const loop = new LoopManager();
// const loop2 = new LoopManager();
// loop.s$loopFrequency = 1000;
// loop.addEvent(["loop"], () => {
//     console.log(count);
//     count = 0;
// });
// loop2.addEvent(["loop"], () => {
//     count++;
// });
// loop.start();
// loop2.start();

// let a = performance.now();
// const A = (currentTime: number) => {
//     console.log((1000 / (currentTime - a)).toFixed(0));
//     a = currentTime;
//     requestAnimationFrame(A);
// };
// requestAnimationFrame(A);
