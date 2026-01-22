import { GameProcessing } from "./GameProcessing/GameProcessing";
import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";
import { qs, qsAddEvent, qsAll, sleep } from "./Utils";

import * as Setting from "./Settings";
import { debug } from "./Run";

export class PlayerRegister {
    static gamepadConfigs: Setting.GamepadConfig[] = [];

    static setEvents() {
        pageManager.addEvent(["setPage-playerRegister"], () => {
            this.registerPlayer();
        });

        qsAddEvent("#playerRegister .back", "click", () => {
            inputManager.resetRegister();
        });

        qsAddEvent("#playPrepare .back", "click", () => {
            inputManager.resetRegister();
        });

        inputManager.addEvent(["inputRegistered"], () => {
            this.onInputRegistered();
        });

        inputManager.addEvent(["finishRegister"], () => {
            qs("#registerText").innerHTML = '<font style="color:#d66">完了！</font>';
        });

        qsAddEvent("#registerButton", "click", () => {
            this.onRegisterInput();
        });
    }

    private static async onRegisterInput() {
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
    }

    private static registerPlayer() {
        GameProcessing.replay = false;

        if (inputManager.g$registeredInputNumber) {
            inputManager.removeVirtualInputs();
            inputManager.resetRegister();
        }

        Array.from(qs("#connectionLabel").children).forEach((element) => {
            element.remove();
        });

        qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${GameProcessing.playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;

        this.gamepadConfigs = [];

        inputManager.s$maxInputNumber = GameProcessing.playSetting.playerNumber;
        inputManager.startRegister();
    }

    private static onInputRegistered() {
        const registerInputs = inputManager.g$registeredInputs;

        const typeIcon = document.createElement("div");
        typeIcon.dataset.inputType = registerInputs[registerInputs.length - 1].g$type;
        typeIcon.classList.add("inputTypeIcon");
        // typeIcon.innerHTML = registerInputs[registerInputs.length - 1].g$type;
        qs("#connectionLabel").appendChild(typeIcon);

        qs("#registerText").innerHTML = `登録したい入力機器のボタンを押してください：あと${GameProcessing.playSetting.playerNumber - inputManager.g$registeredInputNumber}人`;

        this.gamepadConfigs.push(Setting.gamepadConfigPresets[0]);
    }
}
