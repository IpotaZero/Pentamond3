import { BlockKind } from "../BlockOperate/Block";
import { AutoKeyboardInputData, AutoKeyboardManager } from "../Interaction/AutoKeyboardManager";
import { game, gameStart, players, playSetting, PlaySetting, replay, set } from "../Run";
import { ReplayDataHandler } from "./ReplayDataHandler";
import { ReplayDom } from "./ReplayDom";
import * as Setting from "../Settings";
import { qs } from "../Utils";
import { Input } from "../Interaction/Input";
import { inputManager } from "../Interaction/InputManager";

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
        // console.log(`${new Blob([replayDataEncryption(data)]).size}byte`);
        inputManager.removeVirtualInputs();
        inputManager.resetRegister();

        const readingReplayData = data;
        const playSetting = window.structuredClone(readingReplayData.playSetting);
        const replay = true;

        set({ playSetting, replay, readingReplayData });

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

    static setupSavedReplayData() {
        const replayData = ReplayDataHandler.getReplayData();

        ReplayDom.setupSavedReplay(replayData);
    }

    static setupReplayData() {
        if (!players || !game) return;

        const replayData = ReplayDataHandler.createReplayData(players, game, playSetting);
        ReplayDataHandler.temporaryReplayData.push(replayData);

        if (ReplayDataHandler.temporaryReplayData.length == Setting.maximumTemporaryReplaySavable + 1) {
            ReplayDataHandler.temporaryReplayData.shift();
            qs("#replay .replayButtonContainer:first-child").remove();
        }

        ReplayDom.setupReplay(replayData.date);
    }

    static save(replayData: ReplayData) {
        return ReplayDataHandler.saveReplayData(replayData);
    }

    static saveLastOne() {
        return ReplayDataHandler.saveReplayData(ReplayDataHandler.temporaryReplayData.at(-1)!);
    }

    static remove(data: ReplayData) {
        ReplayDataHandler.removeReplayData(data);
    }
}
