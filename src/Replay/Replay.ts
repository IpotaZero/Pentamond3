import { BlockKind } from "../BlockOperate/Block";
import { AutoKeyboardInputData, AutoKeyboardManager } from "../Interaction/AutoKeyboardManager";
import { game, gameStart, players, playSetting, PlaySetting, replay, set } from "../Run";
import { ReplayDataHandler } from "./ReplayDataHandler";
import { ReplayDom } from "./ReplayDom";
import * as Setting from "../Settings";
import { qs, qsAll, sleep } from "../Utils";
import { Input } from "../Interaction/Input";
import { inputManager } from "../Interaction/InputManager";
import { GamePlayer } from "../Game/GamePlayer";
import { GameMode } from "../Game/GameMode";
import { pageManager } from "../PageManager";

//リプレイ
export type ReplayData = {
    inputData: AutoKeyboardInputData[][];
    nextData: BlockKind[][];
    playSetting: PlaySetting;
    finishTime: number;
    finishPlayers: number[];
    nuisanceBlockData: number[][];
    date: number;
};

export class Replay {
    static startReplay(data: ReplayData) {
        const readingReplayData = data;
        const playSetting = window.structuredClone(readingReplayData.playSetting);
        const replay = true;

        set({ playSetting, replay, readingReplayData });

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

        gameStart();
    }

    static setupSavedReplayPage() {
        const replayDataList = ReplayDataHandler.getReplayDataList();
        const { replayButtons, deleteButtons } = ReplayDom.setupSavedReplayPage(replayDataList);

        replayButtons.forEach((replayButton, i) => {
            replayButton.addEventListener("click", () => {
                // lastOperateTime = Date.now();
                Replay.startReplay(replayDataList[i]);
            });
        });

        deleteButtons.forEach((deleteButton, i) => {
            deleteButton.addEventListener("click", () => {
                const confirmButton = qs("#replayDeleteConfirmButton") as HTMLButtonElement;
                const back = qs("#replayDeleteAlert .back") as HTMLButtonElement;
                pageManager.setPage("replayDeleteAlert");

                confirmButton.disabled = true;
                confirmButton.style.opacity = "0";

                sleep(1500).then(() => {
                    confirmButton.disabled = false;
                    confirmButton.style.opacity = "1";
                });

                new Promise<void>((resolve, reject) => {
                    let resolveFunc: any;
                    let rejectFunc: any;

                    resolveFunc = () => {
                        resolve();
                        confirmButton.removeEventListener("click", resolveFunc);
                        back.removeEventListener("click", rejectFunc);
                    };

                    rejectFunc = () => {
                        reject();
                        confirmButton.removeEventListener("click", resolveFunc);
                        back.removeEventListener("click", rejectFunc);
                    };

                    confirmButton.addEventListener("click", resolveFunc);
                    back.addEventListener("click", rejectFunc);
                }).then(
                    () => {
                        // lastOperateTime = Date.now();
                        Replay.removeSavedReplayData(replayDataList[i]);
                        pageManager.backPages(2, { eventIgnore: true });
                        Replay.setupSavedReplayPage();
                        const index = ReplayDataHandler.temporaryReplayData.findIndex((data) => data.date == replayDataList[i].date);
                        qsAll(".replaySaveButton")[ReplayDataHandler.temporaryReplayData.length - index - 1]?.classList.remove("replaySavedButton");
                        pageManager.setPage("savedReplay");
                    },
                    () => {}
                );
            });
        });
    }

    static addReplayData(players: GamePlayer[], game: GameMode) {
        const replayData = ReplayDataHandler.createReplayData(players, game, playSetting);
        ReplayDataHandler.temporaryReplayData.push(replayData);

        if (ReplayDataHandler.temporaryReplayData.length == Setting.maximumTemporaryReplaySavable + 1) {
            ReplayDataHandler.temporaryReplayData.shift();
            qs("#replay .replayButtonContainer:first-child").remove();
        }

        this.addReplayButton(replayData);
    }

    private static addReplayButton(replayData: ReplayData) {
        const { replayButton, saveButton } = ReplayDom.createReplayButton(replayData.date);

        replayButton.addEventListener("click", () => {
            const replayButtons = qsAll("#replay .replayButton");
            const index = replayButtons.findIndex((button) => button == replayButton);
            // lastOperateTime = Date.now();
            Replay.startReplay(ReplayDataHandler.temporaryReplayData.at(-index - 1)!);
        });

        saveButton.addEventListener("click", () => {
            const saveButtons = qsAll("#replay .replaySaveButton");
            const index = saveButtons.findIndex((button) => button == saveButton);
            // lastOperateTime = Date.now();
            if (Replay.save(ReplayDataHandler.temporaryReplayData.at(-index - 1)!)) {
                Replay.setupSavedReplayPage();
                saveButton.classList.add("replaySavedButton");
            }
        });

        qs("#replay .back").dataset.mapping = `[0,${ReplayDataHandler.temporaryReplayData.length}]`;
    }

    static save(replayData: ReplayData) {
        return ReplayDataHandler.saveReplayData(replayData);
    }

    static saveLastOne() {
        return ReplayDataHandler.saveReplayData(ReplayDataHandler.temporaryReplayData.at(-1)!);
    }

    static removeSavedReplayData(data: ReplayData) {
        ReplayDataHandler.removeReplayData(data);
    }
}
