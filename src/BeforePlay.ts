import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";
import { qs, qsAddEvent, qsAll, sleep } from "./Utils";

import * as Setting from "./Settings";
import { debug } from "./Run";
import { GameProcessing } from "./GameProcessing/GameProcessing";

export type PlaySetting = {
    playerNumber: number;
    mode: number;
    maxGameTime: number;
    handy: number[];
};

/**
 * ゲームが始まる直前の人数とかルールとか決めたり、コントローラーの登録をしたりする
 *  */
export class BeforePlay {
    static gamepadConfigs: Setting.GamepadConfig[] = [];

    static playSetting: PlaySetting = {
        playerNumber: 1,
        mode: 1,
        maxGameTime: 150,
        handy: [1],
    };

    static setEvents() {
        // モードを決める
        qsAddEvent("button[data-mode]", "click", (element) => {
            // 一人プレイの時は聞かれないので1にしておく
            this.playSetting.playerNumber = 1;
            this.playSetting.mode = Number(element.dataset.mode);
        });

        // 人数を決める
        qsAddEvent("button[data-player]", "click", (element) => {
            this.playSetting.playerNumber = Number(element.dataset.player);
        });

        // コントローラーの登録の準備
        pageManager.addEvent(["setPage-playerRegister"], () => {
            this.startControllerRegistration();
        });

        // キャンセル時
        qsAddEvent("#playerRegister .back", "click", () => {
            inputManager.resetRegister();
        });

        // キャンセル時
        qsAddEvent("#playPrepare .back", "click", () => {
            inputManager.resetRegister();
        });

        // 登録されたとき
        inputManager.addEvent(["inputRegistered"], () => {
            // アイコンをだす
            this.onInputRegistered();
        });

        inputManager.addEvent(["finishRegister"], () => {
            qs("#registerText").innerHTML = '<div style="color:#d66">完了！</div>';
        });

        qsAddEvent("#registerButton", "click", () => {
            this.onClickOk();
        });
    }

    private static async onClickOk() {
        // まだ全員登録し終わっていないならリターン
        if (inputManager.g$registering) {
            if (debug) {
                inputManager.finishRegister();
            } else {
                return;
            }
        }

        // ここまで来たらタイトルには戻れない

        inputManager.stop();

        this.enablePlayerRegisterButtons(false);

        // 何のため?
        await sleep(500);

        const backDepth = this.playSetting.playerNumber == 1 ? 1 : 2;
        pageManager.backPages(backDepth, { eventIgnore: true });
        pageManager.setPage("playPrepare");

        this.enablePlayerRegisterButtons(true);

        inputManager.start();
    }

    private static enablePlayerRegisterButtons(available: boolean) {
        qsAll("#playerRegister button").forEach((element) => {
            (element as HTMLButtonElement).disabled = !available;
        });
    }

    // normalを準備
    private static startControllerRegistration() {
        // 今から行うのはreplayではない
        GameProcessing.readingReplayData = null;

        // 既に登録されているものを外す
        if (inputManager.g$registeredInputNumber > 0) {
            inputManager.removeVirtualInputs();
            inputManager.resetRegister();
        }

        // 前の表示を消す
        Array.from(qs("#connectionLabel").children).forEach((element) => {
            element.remove();
        });

        qs("#registerText").innerText = `
            登録したい入力機器のボタンを押してください：
            あと${this.playSetting.playerNumber - inputManager.g$registeredInputNumber}人
        `;

        this.gamepadConfigs = [];

        inputManager.s$maxInputNumber = this.playSetting.playerNumber;
        inputManager.startRegister();
    }

    // コントローラーが登録されたときアイコンを出す
    private static onInputRegistered() {
        const registerInputs = inputManager.g$registeredInputs;

        const typeIcon = document.createElement("div");
        typeIcon.dataset.inputType = registerInputs[registerInputs.length - 1].g$type;
        typeIcon.classList.add("inputTypeIcon");
        // typeIcon.innerHTML = registerInputs[registerInputs.length - 1].g$type;
        qs("#connectionLabel").appendChild(typeIcon);

        qs("#registerText").innerText = `
            登録したい入力機器のボタンを押してください：
            あと${this.playSetting.playerNumber - inputManager.g$registeredInputNumber}人
        `;

        this.gamepadConfigs.push(Setting.gamepadConfigPresets[0]);
    }
}
