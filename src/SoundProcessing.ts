import { BGM } from "./BGM";
import { flagManager } from "./FlagManager";
import { pageManager } from "./PageManager";
import { ScreenInteractionSetting } from "./ScreenInteraction";
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
        ScreenInteractionSetting.operable = false;
        if (BGM.isPlaying()) {
            await BGM.pause();
        }
        bgm = -1;
        pageManager.s$valid = true;
        ScreenInteractionSetting.operable = true;
    }
});

pageManager.addEvent(["pageChanged-title"], async () => {
    if (bgm != 0) {
        pageManager.s$valid = false;
        ScreenInteractionSetting.operable = false;
        await BGM.pause();
        await BGM.fetch({ src: "/assets/musics/つみきのおしろ.m4a" });
        await BGM.play();
        bgm = 0;
        pageManager.s$valid = true;
        ScreenInteractionSetting.operable = true;
    }
});

pageManager.addEvent(["pageChanged-startEffect"], async () => {
    if (bgm != 1) {
        pageManager.s$valid = false;
        ScreenInteractionSetting.operable = false;
        await BGM.pause();
        await BGM.fetch({ src: "/assets/musics/ならべてトライアングル.m4a" });
        await BGM.play();
        bgm = 1;
        pageManager.s$valid = true;
        ScreenInteractionSetting.operable = true;
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
});

qsAddEvent("#seVolume", "input", (element) => {
    console.log("se");
    const value: number = parseInt((element as HTMLInputElement).value);
    Sound.setWholeVolume(value / 10);
});

qsAddEvent('input[type="range"]', "input", () => {
    se[0].play();
});
