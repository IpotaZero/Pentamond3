import { BGM } from "./BGM";
import { flagManager } from "./FlagManager";
import { pageManager } from "./PageManager";
import { screenInteraction } from "./ScreenInteraction";
import { Sound } from "./Sound";
import { qsAddEvent } from "./Utils";

export let se: Sound[];
let bgm = -1;

export function soundsInit() {
    BGM.init();
    Sound.init();
    se = [
        new Sound({ src: "assets/sounds/Pentamond3-ボタン.mp3" }),
        new Sound({ src: "assets/sounds/Pentamond3-フォーカス.mp3", volume: 0.15 }),
        new Sound({ src: "assets/sounds/モンド設置音.m4a" }),
    ];
    loadVolumeSetting();
}

qsAddEvent("button", "click", () => {
    se[0].play();
});

qsAddEvent("button", "focus", () => {
    se[1].play();
});

pageManager.addEvent(["pageChanged-pageStart"], async () => {
    if (bgm != -1) {
        pageManager.s$valid = false;
        screenInteraction.s$operable = false;
        if (BGM.isPlaying()) {
            await BGM.pause();
        }
        bgm = -1;
        pageManager.s$valid = true;
        screenInteraction.s$operable = true;
    }
});

pageManager.addEvent(["pageChanged-title"], async () => {
    if (bgm != 0) {
        pageManager.s$valid = false;
        screenInteraction.s$operable = false;
        await BGM.pause();
        await BGM.fetch({ src: "assets/musics/つみきのおしろ.m4a" });
        await BGM.play();
        bgm = 0;
        pageManager.s$valid = true;
        screenInteraction.s$operable = true;
    }
});

pageManager.addEvent(["pageChanged-startEffect"], async () => {
    if (bgm != 1) {
        pageManager.s$valid = false;
        screenInteraction.s$operable = false;
        await BGM.pause();
        await BGM.fetch({ src: "assets/musics/ならべてトライアングル.m4a" });
        await BGM.play();
        bgm = 1;
        pageManager.s$valid = true;
        screenInteraction.s$operable = true;
    }
});

//ローディング画面
pageManager.addEvent(["pageBecomeValid"], () => {
    flagManager.remove("invalid");
    // if (pageManager.g$currentPageId == "talk") {
    //     talkPanel.start();
    // }
});

pageManager.addEvent(["pageBecomeInvalid"], () => {
    flagManager.add("invalid");
});

//設定関連
qsAddEvent("#bgmVolume", "input", (element) => {
    const value: number = parseInt((element as HTMLInputElement).value);
    BGM.setVolume(value / 10);
    saveVolumeSetting();
});

qsAddEvent("#seVolume", "input", (element) => {
    console.log("se");
    const value: number = parseInt((element as HTMLInputElement).value);
    Sound.setWholeVolume(value / 10);
    saveVolumeSetting();
});

qsAddEvent('input[type="range"]', "input", () => {
    se[0].play();
});

function saveVolumeSetting() {
    localStorage.setItem("Pentamond3-volumeSetting", (Math.round(BGM.getVolume() * 10) * 11 + Math.round(Sound.getWholeVolume() * 10)).toString(36));
}

function loadVolumeSetting() {
    const volumeData = localStorage.getItem("Pentamond3-volumeSetting");
    if (volumeData) {
        const numberVolumeData = Number.parseInt(volumeData, 36);
        BGM.setVolume(Math.floor(numberVolumeData / 11) / 10);
        Sound.setWholeVolume((numberVolumeData % 11) / 10);
    }
}
