import { BlockKind } from "../BlockOperate/Block";
import { AutoKeyboardInputData, AutoKeyboardManager } from "../Interaction/AutoKeyboardManager";
import { game, gameStart, players, playSetting, PlaySetting, replay, set } from "../Run";
import * as Setting from "../Settings";
import { qs, qsAll, sleep } from "../Utils";
import { GamePlayer } from "../Game/GamePlayer";
import { GameMode } from "../Game/GameMode";

import { ReplayEvents } from "./ReplayEvents";
import { ReplayDom } from "./ReplayDom";
import { ReplayDataHandler } from "./ReplayDataHandler";
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

/**
 * replay関係のインターフェース
 * これ以外は触ってはいけない
 * 親から子へ命令を送る
 * 子が親または兄弟の情報を使うべきではない
 *
 * まだそれは為されていない
 *
 * 依存関係
 * Replay   ->  DataHandler
 *          ->  Dom
 *          ->  Events
 */
export class Replay {
    static getDataSize() {
        return ReplayDataHandler.getDataSize();
    }

    static startReplay(data: ReplayData) {
        ReplayEvents.startReplay(data);
    }

    static setupSavedReplayPage() {
        const replayDataList = ReplayDataHandler.getReplayDataList();

        // Dom
        const buttons = ReplayDom.setupSavedReplayPage(replayDataList);

        // Event
        ReplayEvents.setupSavedReplayPage(replayDataList, buttons);
    }

    static addTempData(players: GamePlayer[], game: GameMode) {
        const replayData = ReplayDataHandler.createReplayData(players, game, playSetting);

        ReplayDataHandler.addTempData(replayData, Setting.maximumTemporaryReplaySavable);

        const buttons = ReplayDom.createTempReplayButton(replayData.date);
        ReplayEvents.setupTempReplayPage(ReplayDataHandler.tempDataList, buttons);
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

    static removeSavedReplayData(data: ReplayData) {
        ReplayDataHandler.removeSavedReplayData(data);
    }
}
