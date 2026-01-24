import { EventId, EventManager, MyEventListener } from "./EventManager";
import { Input, OperateManager } from "./Interaction/Input";
import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";
import { sleep, qs, qsAll, getMinElement, removeMousePointerTemporary, qsAddEvent } from "./Utils";
import * as Setting from "./Settings";
import { GameProcessing } from "./GameProcessing/GameProcessing";
import { ScreenInteractionView } from "./ScreenInteractionView";

export type MappedElement = {
    element: HTMLElement;
    coordinate: [number, number];
};

//画面のinputによる操作
class ScreenInteraction implements MyEventListener {
    private static instance: ScreenInteraction;

    private operable: boolean = true;

    private registeredInputList: Input[] = [];
    private pageOperateEvents: EventId[] = [];

    private lastOperateTime = 0;
    private readonly view = new ScreenInteractionView();

    /**
     * @param interaction すべての操作
     * @param confirmInteraction 決定などの操作　いわゆる〇ボタン
     * @param cancelInteraction キャンセルなどの操作  いわゆる×ボタン
     */
    readonly eventClassNames: string[] = ["interaction", "confirmInteraction", "cancelInteraction"];
    addEvent(classNames: string[], handler: Function): EventId {
        return EventManager.addEvent({ classNames, handler });
    }

    constructor() {
        if (ScreenInteraction.instance) {
            return ScreenInteraction.instance;
        }

        ScreenInteraction.instance = this;

        this.setEvents();
    }

    set s$operable(operable: boolean) {
        this.operable = operable;
    }

    /**
     * 次のページ変更時に何かをあらかじめfocusするか
     */
    set s$focusFlag(focusFlag: boolean) {
        this.view.focusOnPageChange = focusFlag;
    }

    get g$lastOperateTime() {
        return this.lastOperateTime;
    }

    get g$listeningInputs(): readonly Input[] {
        return this.registeredInputList.map((input) => input);
    }

    get g$selectedElement(): MappedElement | null {
        return this.view.getFocusedElement();
    }

    private hasSet = false;
    private setEvents() {
        if (this.hasSet) throw new Error("既にsetされている!");
        this.hasSet = true;

        // ページ変更ごとにそのページを操作できるイベントをinputに追加する
        pageManager.addEvent(["pageChanged"], () => {
            this.updatePageOperateEvent();
        });

        qsAddEvent("[data-mapping]", "click", () => {
            // 最後にclickを行った時間の更新
            this.lastOperateTime = Date.now();
        });

        this.view.setupMouseOperation();
        this.view.setupRangeOperation();

        // 途中追加されたinputにイベントを追加
        inputManager.addEvent(["inputAdded"], () => {
            const addedInput = inputManager.g$inputs.at(-1)!;

            if (addedInput.isAuto()) {
                return;
            }

            this.addPageOperateEventAndInput(pageManager.g$currentPageId ?? "pageStart", addedInput);
        });
    }

    private async updatePageOperateEvent() {
        // ページが開かれていなかったらリターン
        const pageId = pageManager.g$currentPageId;
        if (!pageId) return;

        // フォーカスを新しいページに移動
        this.view.shiftFocusTo(pageId);

        // イベントを削除
        EventManager.removeEvents(this.pageOperateEvents);
        this.pageOperateEvents = [];
        this.registeredInputList = [];

        //早すぎるページ遷移の禁止
        await sleep(Setting.debounceOperateTime * 2.5);

        // イベントの追加
        inputManager.g$inputs.forEach((input) => {
            if (input.isAuto()) return;
            this.addPageOperateEventAndInput(pageId, input);
        });

        // mappingが設定されたElementを更新
        this.view.updateMappedElementList(pageId);
    }

    /**
     * 指定したページを操作するEventを指定したinputに追加する
     * @param pageId ページのid
     * @param input Eventを追加するinput
     */
    private addPageOperateEventAndInput(pageId: string, input: Input): void {
        if (this.registeredInputList.includes(input)) return;
        this.registeredInputList.push(input);

        this.addPageOperateEvent(pageId, input.g$manager);
    }

    private addPageOperateEvent(pageId: string, manager: OperateManager) {
        const operationEvents = ["onKeydown", "onButtondown", "onStickActive"];

        const eventId = manager.addEvent(operationEvents, () => {
            this.onOperate(pageId, manager.g$latestPressingKey);
        });

        this.pageOperateEvents.push(eventId);
    }

    private onCancel(pageId: string) {
        // ページ移動の可能性があるときはtrueにする
        this.view.focusOnPageChange = true;

        const backButton = qs(`#${pageId} .back`);

        if (!backButton) {
            return;
        }

        this.updateLastOperateTimeAndHidePointer();

        EventManager.executeEventsByClassName("cancelInteraction");

        backButton.click();
    }

    private onPushDirectionKey(direction: "up" | "down" | "right" | "left") {
        const dxdy: Record<string, [null, number] | [number, null]> = {
            up: [null, -1],
            down: [null, 1],
            right: [1, null],
            left: [-1, null],
        };

        const target = this.view.getTargetElement(dxdy[direction]);
        target.focus();

        this.updateLastOperateTimeAndHidePointer();

        if (direction === "left" || direction === "right") {
            this.operateRange(target, direction);
        }
    }

    private operateRange(target: HTMLElement, direction: "right" | "left") {
        if (!target.classList.contains("rangeContainer")) return;

        const input = target.querySelector("input")!;

        if (direction === "left") {
            input.stepDown();
        } else {
            input.stepUp();
        }

        input.dispatchEvent(new Event("input"));
    }

    private onOk() {
        if (!(document.activeElement instanceof HTMLElement)) return;

        // ページ移動の可能性があるときはtrueにする
        this.view.focusOnPageChange = true;

        this.g$selectedElement!.element.click();
        this.updateLastOperateTimeAndHidePointer();

        EventManager.executeEventsByClassName("confirmInteraction");
    }

    private handleDirectionKey(latestKey: string) {
        const upKeys = ["ArrowUp", "KeyW", "button:12", "stick:-1"];
        const downKeys = ["ArrowDown", "KeyS", "button:13", "stick:+1"];
        const leftKeys = ["ArrowLeft", "KeyA", "button:14", "stick:-0"];
        const rightKeys = ["ArrowRight", "KeyD", "button:15", "stick:+0"];

        if (upKeys.includes(latestKey)) this.onPushDirectionKey("up");
        if (downKeys.includes(latestKey)) this.onPushDirectionKey("down");
        if (leftKeys.includes(latestKey)) this.onPushDirectionKey("left");
        if (rightKeys.includes(latestKey)) this.onPushDirectionKey("right");
    }

    private onOperate(pageId: string, latestKey: string) {
        if (!this.operable) return;

        //前回の操作から間が空いていないならreturn
        if (Date.now() - this.lastOperateTime <= Setting.debounceOperateTime) {
            return;
        }

        // まだどこにもフォーカスがない場合
        if (!this.view.getFocusedElement()) {
            this.view.focusFirstElement();
            return;
        }

        EventManager.executeEventsByClassName("interaction");

        const cancelKeys = ["KeyX", "Escape", "Backspace", "button:0"];
        if (cancelKeys.includes(latestKey)) {
            this.onCancel(pageId);
            return true;
        }

        this.handleDirectionKey(latestKey);

        const okKeys = ["Enter", "Space", "KeyZ", "button:1"];
        if (okKeys.includes(latestKey)) {
            this.onOk();
        }
    }

    /**
     * 最後に操作した時間を更新する
     */
    updateLastOperateTimeAndHidePointer(): void {
        this.lastOperateTime = Date.now();
        removeMousePointerTemporary();
    }
}

export const screenInteraction = new ScreenInteraction();

screenInteraction.addEvent(["interaction"], () => {
    const id = pageManager.g$currentPageId;
    if (id == "pageStart") {
        qs("#pageStart").click();
        screenInteraction.updateLastOperateTimeAndHidePointer();
        return;
    }
    if (id == "play") {
        const pauseInteractions = ["KeyP", ...Setting.gamepadConfigPresets[0].pause];
        const requiredPause = screenInteraction.g$listeningInputs.some((input) => pauseInteractions.includes(input.g$manager.g$latestPressingKey));
        if (requiredPause) {
            const currentGame = GameProcessing.currentGame;
            if (!currentGame) throw new Error("ゲームが始められていないのにポーズされた。");

            if (GameProcessing.isReplaying() && currentGame.g$isPlaying) {
                currentGame.game.stop();
                screenInteraction.s$focusFlag = true;
                screenInteraction.updateLastOperateTimeAndHidePointer();
                pageManager.setPage("replayPause");
            }
        }
        return;
    }
});
