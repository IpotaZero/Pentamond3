import { replayDataDecryption, replayDataEncryption } from "../DataCompression";
import { GameMode, OperateName } from "../Game/GameMode";
import { GamePlayer } from "../Game/GamePlayer";
import { pageManager } from "../PageManager";
import { PlaySetting } from "../Run";
import { ReplayData } from "./Replay";

export class ReplayDataHandler {
    static temporaryReplayData: ReplayData[] = [];

    static createReplayData(players: GamePlayer[], game: GameMode, playSetting: PlaySetting) {
        const convertOperateName = (operateName: OperateName) => {
            return operateName == "put"
                ? "ArrowUp"
                : operateName == "move-left"
                  ? "ArrowLeft"
                  : operateName == "move-right"
                    ? "ArrowRight"
                    : operateName == "move-down"
                      ? "ArrowDown"
                      : operateName == "spin-left"
                        ? "KeyC"
                        : operateName == "spin-right"
                          ? "KeyV"
                          : operateName == "unput"
                            ? "KeyB"
                            : operateName == "hold"
                              ? "Space"
                              : operateName == "removeLine"
                                ? "Enter"
                                : "";
        };

        const inputData = game.operateMemories.map((operateMemory) => operateMemory.map(({ time, operateName }) => ({ time: time, keyCode: convertOperateName(operateName), type: "downup" })));
        const nextData = players.map((p) => p.operator.g$nextMemory);
        const finishTime = Math.max(...players.map((player) => player.playInfo.playTime));
        const finishPlayers = players.map((player, i) => (player.playInfo.playTime == finishTime ? i + 1 : -1)).filter((value) => value != -1);
        const nuisanceBlockData = players.map((player) => player.nuisanceMondManager.g$spawnCoordinateMemory);

        const replayData = structuredClone({
            inputData,
            playSetting,
            nextData,
            finishTime,
            finishPlayers,
            nuisanceBlockData,
            date: Date.now(),
        }) as ReplayData;

        return replayData;
    }

    static removeReplayData(data: ReplayData) {
        const replayData = this.getReplayDataList();

        const json = JSON.stringify(replayData.filter((value) => value.date != data.date).map((d) => replayDataEncryption(d)));

        localStorage.setItem("Pentamond3-replayData", json);
    }

    static getReplayDataList(): ReplayData[] {
        const json = localStorage.getItem("Pentamond3-replayData");

        const encodedDataList: string[] = json ? JSON.parse(json) : [];

        const replayData = encodedDataList.map((encodedData) => replayDataDecryption(encodedData));

        return replayData;
    }

    static saveReplayData(data: ReplayData) {
        const replayDataList = ReplayDataHandler.getReplayDataList();

        // 同じデータを保存しない
        if (replayDataList.map((data) => data.date).includes(data.date)) {
            return false;
        }

        // 11件以上保存しない
        if (replayDataList.length == 10) {
            pageManager.setPage("replaySaveAlert");
            return false;
        }

        // 降順に並べる
        replayDataList.push(data);
        replayDataList.sort((a, b) => a.date - b.date);

        // 11件以上になったら古いものから消していく
        if (replayDataList.length == 11) {
            replayDataList.shift();
        }

        const encodedList = replayDataList.map((data) => replayDataEncryption(data));
        // dataArray.forEach((dataString) => {
        //     const data = replayDataDecryption(dataString);
        //     const now = new Date(data.date);
        //     const date = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()}:${
        //         now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds()
        //     }`;
        //     const size = new Blob([dataString]).size;
        //     console.log(`The size of ${date} is ${size}`);
        // });

        try {
            localStorage.setItem("Pentamond3-replayData", JSON.stringify(encodedList));
        } catch (error) {
            pageManager.setPage("replaySaveAlert2");
            return false;
        }

        const dataSize = new Blob([localStorage.getItem("Pentamond3-replayData") ?? "[]"]).size;
        console.log(`The sum of size of replayData is ${dataSize}byte`);
        return true;
    }
}
