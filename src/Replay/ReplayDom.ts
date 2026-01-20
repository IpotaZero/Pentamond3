import { pageManager } from "../PageManager";
import { qs, sleep, qsAll } from "../Utils";
import { Replay, ReplayData } from "./Replay";
import { ReplayDataHandler } from "./ReplayDataHandler";

export class ReplayDom {
    static setupSavedReplay(replayDataList: ReplayData[]) {
        const container = qs("#savedReplay .options");
        container.querySelectorAll(".replayButtonContainer").forEach((element) => {
            element.remove();
        });

        const replayContainers = Array.from({ length: replayDataList.length }, () => document.createElement("div"));
        const replayButtons = Array.from({ length: replayDataList.length }, () => document.createElement("button"));
        const deleteButtons = Array.from({ length: replayDataList.length }, () => document.createElement("button"));

        replayContainers.forEach((element, i) => {
            element.classList.add("replayButtonContainer");
            element.appendChild(replayButtons[i]);

            const time = document.createElement("span");
            time.classList.add("replayDataDescription");
            time.style.fontSize = "0.5em";
            time.style.width = "40%";
            time.innerHTML = `Mode: ${replayDataList[i].playSetting.mode}<br>Time: ${replayDataList[i].finishTime / 1000}s`;
            element.appendChild(time);

            element.appendChild(deleteButtons[i]);

            container.prepend(element);
        });

        deleteButtons.forEach((deleteButton, i) => {
            deleteButton.classList.add("replayDeleteButton");
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
                        Replay.remove(replayDataList[i]);
                        pageManager.backPages(2, { eventIgnore: true });
                        Replay.setupSavedReplayData();
                        const index = ReplayDataHandler.temporaryReplayData.findIndex((data) => data.date == replayDataList[i].date);
                        qsAll(".replaySaveButton")[ReplayDataHandler.temporaryReplayData.length - index - 1]?.classList.remove("replaySavedButton");
                        pageManager.setPage("savedReplay");
                    },
                    () => {}
                );
            });
        });

        replayButtons.forEach((replayButton, i) => {
            replayButton.classList.add("replayButton");
            const now = new Date(replayDataList[i].date);
            replayButton.innerHTML = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${
                now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()
            }`;

            replayButton.addEventListener("click", () => {
                // lastOperateTime = Date.now();
                Replay.startReplay(replayDataList[i]);
            });
        });

        container.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
            button.addEventListener("mouseover", () => {
                button.focus();
            });
            button.addEventListener("mouseleave", () => {
                if (document.activeElement == button) {
                    (button as HTMLButtonElement).blur();
                }
            });
        });

        //座標の割り振り
        qsAll("#savedReplay .replayButton").forEach((button, i) => {
            button.dataset.mapping = `[0,${i}]`;
        });

        qsAll("#savedReplay .replayDeleteButton").forEach((button, i) => {
            button.dataset.mapping = `[1,${i}]`;
        });

        qs("#savedReplay .back").dataset.mapping = `[0,${replayDataList.length}]`;
    }

    static setupReplay(date: number) {
        //リプレイボタンの追加
        const replayContainer = document.createElement("div");
        replayContainer.classList = "replayButtonContainer";
        const replayButton = document.createElement("button");
        replayButton.classList.add("replayButton");
        const now = new Date(date);
        replayButton.innerHTML = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${
            now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()
        }`;

        replayButton.addEventListener("click", () => {
            const replayButtons = qsAll("#replay .replayButton");
            const index = replayButtons.findIndex((button) => button == replayButton);
            // lastOperateTime = Date.now();
            Replay.startReplay(ReplayDataHandler.temporaryReplayData.at(-index - 1)!);
        });

        const saveButton = document.createElement("button");
        saveButton.classList.add("replaySaveButton");
        saveButton.addEventListener("click", () => {
            const saveButtons = qsAll("#replay .replaySaveButton");
            const index = saveButtons.findIndex((button) => button == saveButton);
            // lastOperateTime = Date.now();
            if (Replay.save(ReplayDataHandler.temporaryReplayData.at(-index - 1)!)) {
                Replay.setupSavedReplayData();
                saveButton.classList.add("replaySavedButton");
            }
        });

        replayContainer.appendChild(replayButton);
        replayContainer.appendChild(saveButton);
        replayContainer.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
            button.addEventListener("mouseover", () => {
                button.focus();
            });
            button.addEventListener("mouseleave", () => {
                if (document.activeElement == button) {
                    (button as HTMLButtonElement).blur();
                }
            });
        });

        qs("#replay .options").prepend(replayContainer);

        //座標の割り振り直し
        qsAll("#replay .replayButton").forEach((button, i) => {
            button.dataset.mapping = `[0,${i}]`;
        });

        qsAll("#replay .replaySaveButton").forEach((button, i) => {
            button.dataset.mapping = `[1,${i}]`;
        });

        qs("#replay .back").dataset.mapping = `[0,${ReplayDataHandler.temporaryReplayData.length}]`;
    }
}
