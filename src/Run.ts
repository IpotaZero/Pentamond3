import { pageManager } from "./PageManager";
import { Sound } from "./Sound";
import { qs, qsAddEvent, qsAll, sleep } from "./Utils";
import { inputManager } from "./Interaction/InputManager";
import "./ScreenInteraction";
import { Replay } from "./Replay/Replay";
import { GraphicSetting } from "./GraphicSetting";
import { soundsInit } from "./SoundProcessing";
import { BeforePlay } from "./BeforePlay";
import { DeleteDataHandler } from "./DeleteDataHandler";
import { GameStarter } from "./GameProcessing/GameStarter";

//不正なページ遷移の防止
setupInputBehavior();
function setupInputBehavior() {
    document.addEventListener("keydown", (e) => {
        if (["Tab", "Space", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }
    });

    qsAll("button").forEach((button) => {
        button.tabIndex = -1;
    });

    qsAll("input").forEach((button) => {
        button.tabIndex = -1;
    });

    qsAll("div[data-mapping]").forEach((button) => {
        button.tabIndex = 0;
    });
}

//クリックによる開始
qsAddEvent("#pageStart", "click", () => {
    pageManager.setPage("title");
    // se[0].play();
});

//起動時処理
export let se: Sound[] = [];
document.addEventListener("DOMContentLoaded", async () => {
    pageManager.init();
    inputManager.s$maxInputNumber = 1;

    GameStarter.setEvents();

    //コントローラー登録
    BeforePlay.setEvents();

    soundsInit();

    // グラフィック設定
    GraphicSetting.init();

    // データ消去イベントの設定
    DeleteDataHandler.setEvents();

    // リプレイのイベントの設定と、リプレイページの設定
    Replay.setupSavedReplayPage();
    console.log(`The sum of size of replayData is ${Replay.getDataSize()}byte`);
});

export const debug = false;

// localStorage.removeItem("Pentamond3-replayData");

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
