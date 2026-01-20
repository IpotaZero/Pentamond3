import { qs, qsAll } from "../Utils";
import { ReplayData } from "./Replay";

export class ReplayDom {
    static setupSavedReplayPage(replayDataList: ReplayData[]) {
        const container = qs("#savedReplay .options");
        container.querySelectorAll(".replayButtonContainer").forEach((element) => {
            element.remove();
        });

        const replayContainers = Array.from({ length: replayDataList.length }, () => document.createElement("div"));

        const replayButtons = Array.from({ length: replayDataList.length }, (_, i) => {
            const now = new Date(replayDataList[i].date);

            const replayButton = document.createElement("button");
            replayButton.classList.add("replayButton");
            replayButton.innerHTML = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${
                now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()
            }`;

            return replayButton;
        });

        const deleteButtons = Array.from({ length: replayDataList.length }, () => {
            const deleteButton = document.createElement("button");
            deleteButton.classList.add("replayDeleteButton");
            return deleteButton;
        });

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

        container.querySelectorAll("button").forEach((button) => {
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

        return { deleteButtons, replayButtons };
    }

    static createReplayButton(date: number) {
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

        //座標の割り振り直し
        qsAll("#replay .replayButton").forEach((button, i) => {
            button.dataset.mapping = `[0,${i}]`;
        });

        qsAll("#replay .replaySaveButton").forEach((button, i) => {
            button.dataset.mapping = `[1,${i}]`;
        });

        return { replayButton, saveButton };
    }
}
