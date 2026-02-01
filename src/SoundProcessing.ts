import { BGM } from "./BGM";
import { flagManager } from "./UtilManagers/FlagManager";
import { pageManager } from "./UtilManagers/PageManager";
import { screenInteraction } from "./ScreenInteraction/ScreenInteraction";
import { Sound } from "./Sound";
import { qs, qsAddEvent, sleep } from "./Utils";
import { elementManager } from "./UtilManagers/ElementManager";

export let se: Sound[];
let bgm: string = "";
const bgmSrc = [
    { src: "assets/musics/つみきのおしろ.m4a" },
    { src: "assets/musics/ならべてトライアングル.m4a", sourceVolume: 0.6 },
    { src: "assets/musics/おかたづけ.m4a" },
    { src: "assets/musics/さよならさんかく.m4a" },
    { src: "assets/musics/Top of the Pyramid.m4a" },
];

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

qsAddEvent("#pageStart", "click", () => {
    se[0].play();
});

qsAddEvent("button", "click", () => {
    se[0].play();
});

qsAddEvent("button", "focus", () => {
    se[1].play();
});

qsAddEvent('input[type="range"]', "input", () => {
    se[0].play();
});

pageManager.addEvent(["pageChanged-pageStart"], async () => {
    await setBGM({});
});

pageManager.addEvent(["pageChanged-title"], async () => {
    setBGM(bgmSrc[0]);
});

pageManager.addEvent(["pageChanged-musicSetting"], async () => {
    setBGM(bgmSrc[0]);
});

pageManager.addEvent(["pageChanged-startEffect"], async () => {
    await startSelectedBgm("bgmSelector1");
});

pageManager.addEvent(["pageChanged-result"], async () => {
    await setBGM(bgmSrc[2]);
});

async function setBGM({ src, loopStart, loopEnd, sourceVolume = 1 }: { src?: string; loopStart?: number; loopEnd?: number; sourceVolume?: number }): Promise<void> {
    if (!src) {
        pageManager.s$valid = false;
        screenInteraction.s$operable = false;
        if (BGM.isPlaying()) {
            await BGM.pause();
        }
        bgm = "";
        pageManager.s$valid = true;
        screenInteraction.s$operable = true;
        return;
    }
    if (bgm != src) {
        pageManager.s$valid = false;
        screenInteraction.s$operable = false;
        await BGM.pause();
        await BGM.fetch({ src, loopStart, loopEnd, sourceVolume });
        await BGM.play();
        bgm = src;
        pageManager.s$valid = true;
        screenInteraction.s$operable = true;
    }
}

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
    const value: number = parseInt((element as HTMLInputElement).value);
    Sound.setWholeVolume(value / 10);
    saveVolumeSetting();
});

elementManager.addEvent(["selectorChanged-bgmSelector1"], () => {
    startSelectedBgm("bgmSelector1");
});

function startSelectedBgm(selectorName: string) {
    const bgmName = qs(`[data-page="${selectorName}"]`)!.innerText;
    const bgmData = bgmSrc.find((data) => {
        return data.src.includes(bgmName);
    });
    if (bgmData) {
        bgm = "";
        return setBGM(bgmData);
    }
}

function saveVolumeSetting() {
    localStorage.setItem("Pentamond3-volumeSetting", (Math.round(BGM.getVolume() * 10) * 11 + Math.round(Sound.getWholeVolume() * 10)).toString(36));
}

function loadVolumeSetting() {
    const volumeData = localStorage.getItem("Pentamond3-volumeSetting");
    if (volumeData) {
        const numberVolumeData = Number.parseInt(volumeData, 36);
        const bgmVolume = Math.floor(numberVolumeData / 11);
        const seVolume = numberVolumeData % 11;
        BGM.setVolume(bgmVolume / 10);
        Sound.setWholeVolume(seVolume / 10);
        document.querySelector<HTMLInputElement>("#bgmVolume")!.value = bgmVolume + "";
        document.querySelector<HTMLInputElement>("#seVolume")!.value = seVolume + "";
    }
}
