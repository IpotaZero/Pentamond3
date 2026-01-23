import { GameProcessing } from "../GameProcessing/GameProcessing";
import { pageManager } from "../PageManager";
import { qsAll, qs, sleep } from "../Utils";
import { ReplayData, Replay } from "./Replay";
import { ReplayDataHandler } from "./ReplayDataHandler";

export class ReplayEventSetter {
    static setTempReplayPageEvent(tempDataList: ReplayData[], { replayButton, saveButton }: { replayButton: HTMLButtonElement; saveButton: HTMLButtonElement }) {
        replayButton.addEventListener("click", () => {
            const replayButtons = qsAll("#replay .replayButton");
            const index = replayButtons.findIndex((button) => button == replayButton);
            // lastOperateTime = Date.now();
            GameProcessing.startReplay(tempDataList.at(-index - 1)!);
        });

        saveButton.addEventListener("click", async () => {
            const saveButtons = qsAll("#replay .replaySaveButton");
            const index = saveButtons.findIndex((button) => button == saveButton);

            // lastOperateTime = Date.now();
            const succeed = await Replay.save(tempDataList.at(-index - 1)!);
            if (succeed) {
                Replay.setupSavedReplayPage();
                saveButton.classList.add("replaySavedButton");
            }
        });
    }

    static setSavedReplayPageEvent(replayDataList: ReplayData[], { replayButtons, deleteButtons }: { replayButtons: HTMLButtonElement[]; deleteButtons: HTMLButtonElement[] }) {
        replayButtons.forEach((replayButton, i) => {
            replayButton.addEventListener("click", () => {
                // lastOperateTime = Date.now();
                GameProcessing.startReplay(replayDataList[i]);
            });
        });

        deleteButtons.forEach((deleteButton, i) => {
            deleteButton.addEventListener("click", () => {
                this.onClickDeleteButton(replayDataList[i]);
            });
        });
    }

    private static async onClickDeleteButton(replayData: ReplayData) {
        const approved = await this.checkApprove();
        if (!approved) return;

        const index = ReplayDataHandler.tempDataList.findIndex((data) => data.date == replayData.date);
        qsAll(".replaySaveButton")[ReplayDataHandler.tempDataList.length - index - 1]?.classList.remove("replaySavedButton");

        // lastOperateTime = Date.now();
        await ReplayDataHandler.removeSavedReplayData(replayData);

        pageManager.backPages(2, { eventIgnore: true });

        await Replay.setupSavedReplayPage();

        pageManager.setPage("savedReplay");
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
