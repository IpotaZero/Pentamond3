import { Input } from "../Interaction/Input";
import { AutoKeyboardManager } from "../Interaction/AutoKeyboardManager";
import { pageManager } from "../PageManager";
import { qs, sleep, qsAll } from "../Utils";
import { Replay, ReplayData } from "./Replay";
import { ReplayDataHandler } from "./ReplayDataHandler";
import { inputManager } from "../Interaction/InputManager";
import { Game } from "../Game";

export class ReplayEvents {
    static startReplay(data: ReplayData) {
        const readingReplayData = data;
        const playSetting = window.structuredClone(readingReplayData.playSetting);

        Game.playSetting = playSetting;
        Game.replay = true;
        Game.readingReplayData = readingReplayData;

        inputManager.removeVirtualInputs();
        inputManager.resetRegister();
        inputManager.s$maxInputNumber = readingReplayData.playSetting.playerNumber;

        const inputs = Array.from({ length: readingReplayData.playSetting.playerNumber }, () => new Input("autoKeyboard"));
        inputs.forEach((input, i) => {
            if (!(input.g$manager instanceof AutoKeyboardManager)) {
                return;
            }
            input.g$manager.s$inputData = readingReplayData!.inputData[i];
            inputManager.register(input);
        });

        Game.start();
    }

    static setupTempReplayPage(tempDataList: ReplayData[], { replayButton, saveButton }: { replayButton: HTMLButtonElement; saveButton: HTMLButtonElement }) {
        replayButton.addEventListener("click", () => {
            const replayButtons = qsAll("#replay .replayButton");
            const index = replayButtons.findIndex((button) => button == replayButton);
            // lastOperateTime = Date.now();
            Replay.startReplay(tempDataList.at(-index - 1)!);
        });

        saveButton.addEventListener("click", () => {
            const saveButtons = qsAll("#replay .replaySaveButton");
            const index = saveButtons.findIndex((button) => button == saveButton);

            // lastOperateTime = Date.now();
            if (Replay.save(tempDataList.at(-index - 1)!)) {
                Replay.setupSavedReplayPage();
                saveButton.classList.add("replaySavedButton");
            }
        });

        qs("#replay .back").dataset.mapping = `[0,${ReplayDataHandler.tempDataList.length}]`;
    }

    static setupSavedReplayPage(replayDataList: ReplayData[], { replayButtons, deleteButtons }: { replayButtons: HTMLButtonElement[]; deleteButtons: HTMLButtonElement[] }) {
        replayButtons.forEach((replayButton, i) => {
            replayButton.addEventListener("click", () => {
                // lastOperateTime = Date.now();
                this.startReplay(replayDataList[i]);
            });
        });

        deleteButtons.forEach((deleteButton, i) => {
            deleteButton.addEventListener("click", async () => {
                const approved = await this.checkApprove();

                if (!approved) return;

                // lastOperateTime = Date.now();
                ReplayDataHandler.removeSavedReplayData(replayDataList[i]);
                pageManager.backPages(2, { eventIgnore: true });
                Replay.setupSavedReplayPage();

                const index = ReplayDataHandler.tempDataList.findIndex((data) => data.date == replayDataList[i].date);
                qsAll(".replaySaveButton")[ReplayDataHandler.tempDataList.length - index - 1]?.classList.remove("replaySavedButton");
                pageManager.setPage("savedReplay");
            });
        });
    }

    private static checkApprove() {
        pageManager.setPage("replayDeleteAlert");

        const confirmButton = qs("#replayDeleteConfirmButton") as HTMLButtonElement;
        confirmButton.disabled = true;
        confirmButton.style.opacity = "0";

        const back = qs("#replayDeleteAlert .back") as HTMLButtonElement;

        // 承認は1.5秒経たないとできない
        sleep(1500).then(() => {
            confirmButton.disabled = false;
            confirmButton.style.opacity = "1";
        });

        return new Promise<boolean>((resolve) => {
            const ac = new AbortController();

            confirmButton.addEventListener(
                "click",
                () => {
                    resolve(true);
                    ac.abort();
                },
                { signal: ac.signal }
            );

            back.addEventListener(
                "click",
                () => {
                    resolve(false);
                    ac.abort();
                },
                { signal: ac.signal }
            );
        });
    }
}
