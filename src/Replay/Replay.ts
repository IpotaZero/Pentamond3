import { BlockKind } from "../BlockOperate/Block";
import { AutoKeyboardInputData, AutoKeyboardManager } from "../Interaction/AutoKeyboardManager";
import * as Setting from "../Settings";
import { GamePlayer } from "../Game/GamePlayer";
import { GameMode } from "../Game/GameMode";

import { ReplayDom } from "./ReplayDom";
import { ReplayDataHandler } from "./ReplayDataHandler";
import { pageManager } from "../PageManager";
import { Game, PlaySetting } from "../Game";
import { Input } from "../Interaction/Input";
import { inputManager } from "../Interaction/InputManager";
import { ReplayEventSetter } from "./ReplayEventSetter";

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

/**
 * replay関係のインターフェース
 * これ以外は触ってはいけない
 * 親から子へ命令を送る
 * 子が親または兄弟の情報を使うべきではない
 *
 * まだそれは為されていない
 *
 * model: DataHandler
 * view: Dom
 * controller: Replay, EventSetter
 */
export class Replay {
    static getDataSize() {
        return ReplayDataHandler.getDataSize();
    }

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

    static setupSavedReplayPage() {
        const replayDataList = ReplayDataHandler.getReplayDataList();

        // Dom
        const buttons = ReplayDom.setupSavedReplayPage(replayDataList);

        // Event
        ReplayEventSetter.setSavedReplayPageEvent(replayDataList, buttons);
    }

    static addTempData(players: GamePlayer[], game: GameMode, playSetting: PlaySetting) {
        const replayData = ReplayDataHandler.createReplayData(players, game, playSetting);

        ReplayDataHandler.addTempData(replayData, Setting.maximumTemporaryReplaySavable);

        const buttons = ReplayDom.createTempReplayButton(replayData.date);
        ReplayEventSetter.setTempReplayPageEvent(ReplayDataHandler.tempDataList, buttons);
    }

    static save(replayData: ReplayData) {
        return ReplayDataHandler.saveReplayData(replayData, {
            onOverMax: () => {
                pageManager.setPage("replaySaveAlert");
            },
            onError: () => {
                pageManager.setPage("replaySaveAlert2");
            },
        });
    }

    static saveLastOne() {
        return this.save(ReplayDataHandler.tempDataList.at(-1)!);
    }
}
