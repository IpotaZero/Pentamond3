import { setHoverHighlight } from "../ScreenInteraction";
import { qs, qsAll } from "../Utils";
import { ReplayData } from "./Replay";

export class ReplayDom {
    static setupSavedReplayPage(replayDataList: ReplayData[]) {
        const container = qs("#savedReplay .options");
        container.querySelectorAll(".replayButtonContainer").forEach((element) => {
            element.remove();
        });

        const replayButtons: HTMLButtonElement[] = [];
        const deleteButtons: HTMLButtonElement[] = [];

        for (const replayData of replayDataList) {
            const { replayDataContainer, replayButton, deleteButton } = this.createReplayDataContainer(replayData);

            container.prepend(replayDataContainer);

            replayButtons.push(replayButton);
            deleteButtons.push(deleteButton);
        }

        container.querySelectorAll("button").forEach((button) => {
            setHoverHighlight(button);
        });

        //座標の割り振り
        qsAll("#savedReplay .replayButton").forEach((button, i) => {
            button.dataset.mapping = `[0,${i}]`;
        });

        qsAll("#savedReplay .replayDeleteButton").forEach((button, i) => {
            button.dataset.mapping = `[1,${i}]`;
        });

        qs("#savedReplay .back").dataset.mapping = `[0,${replayDataList.length}]`;

        return { deleteButtons, replayButtons };
    }

    private static createReplayDataContainer(replayData: ReplayData) {
        const replayDataContainer = document.createElement("div");

        const now = new Date(replayData.date);
        const replayButton = document.createElement("button");
        replayButton.classList.add("replayButton");
        replayButton.innerHTML = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${
            now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()
        }`;

        const replayDataDescription = document.createElement("div");
        replayDataDescription.classList.add("replayDataDescription");
        replayDataDescription.innerHTML = this.createReplayDataDescription(replayData);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("replayDeleteButton");

        replayDataContainer.appendChild(replayButton);
        replayDataContainer.appendChild(replayDataDescription);
        replayDataContainer.appendChild(deleteButton);

        return { replayButton, deleteButton, replayDataContainer };
    }

    private static createReplayDataDescription(replayData: ReplayData) {
        const solo = replayData.nextData.length == 1 ? "ソロ" : "マルチ";
        const mode = this.stringifyMode(replayData.playSetting.mode);
        const time = (replayData.finishTime / 1000).toFixed(2);

        return `${solo} : ${mode}<br>時間: ${time}`;
    }

    private static stringifyMode(mode: number) {
        switch (mode) {
            case 1:
                return "サバイバル";
            case 2:
                return "十五列揃え";
            default:
                return "不明なモード";
        }
    }

    static createTempReplayButton(date: number) {
        const now = new Date(date);

        const replayButton = document.createElement("button");
        replayButton.classList.add("replayButton");
        replayButton.innerHTML = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${
            now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()
        }`;

        const saveButton = document.createElement("button");
        saveButton.classList.add("replaySaveButton");

        //リプレイボタンの追加
        const replayContainer = document.createElement("div");
        replayContainer.classList = "replayButtonContainer";
        replayContainer.appendChild(replayButton);
        replayContainer.appendChild(saveButton);
        replayContainer.querySelectorAll("button").forEach((button) => {
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

        let tempDataListLength = 0;

        //座標の割り振り直し
        qsAll("#replay .replayButton").forEach((button, i) => {
            button.dataset.mapping = `[0,${i}]`;
            tempDataListLength++;
        });

        qsAll("#replay .replaySaveButton").forEach((button, i) => {
            button.dataset.mapping = `[1,${i}]`;
        });

        qs("#replay .back").dataset.mapping = `[0,${tempDataListLength}]`;

        return { replayButton, saveButton };
    }
}
