import { EventId, EventManager, MyEventListener } from "./EventManager";
import { Input, OperateManager } from "./Interaction/Input";
import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";
import { sleep, qs, qsAll, getMinElement, removeMousePointerTemporary, qsAddEvent } from "./Utils";
import * as Setting from "./Settings";
import { GameProcessing } from "./GameProcessing/GameProcessing";

type MappedElement = {
    element: HTMLElement;
    coordinate: [number, number];
};

//画面のinputによる操作
class ScreenInteraction implements MyEventListener {
    private listeningInputs: Input[] = [];
    private pageOperateEvents: EventId[] = [];
    private operable: boolean = true;
    private focusFlag = false;
    private lastOperateTime = 0;
    /**現在のページのMappedElements */
    private currentMappedElements: MappedElement[] = [];
    private static instance: ScreenInteraction;

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
        this.addInteractionEvents();
    }

    set s$operable(operable: boolean) {
        this.operable = operable;
    }

    /**
     * 次のページ変更時に何かをあらかじめfocusするか
     */
    set s$focusFlag(focusFlag: boolean) {
        this.focusFlag = focusFlag;
    }

    get g$lastOperateTime() {
        return this.lastOperateTime;
    }

    get g$listeningInputs(): readonly Input[] {
        return this.listeningInputs.map((input) => input);
    }

    get g$selectedElement(): MappedElement | null {
        return this.currentMappedElements.find(({ element: option }) => option == document.activeElement) ?? null;
    }

    private addInteractionEvents() {
        //ページ変更ごとにそのページを操作できるイベントをinputに追加する
        pageManager.addEvent(["pageChanged"], () => {
            this.onPageChanged();
        });

        this.setupDataMapping();

        //途中追加されたinputにイベントの追加
        inputManager.addEvent(["inputAdded"], () => {
            const latestInput = inputManager.g$inputs.at(-1)!;
            if (latestInput.isAuto()) {
                return;
            }
            this.addPageOperateEvent(pageManager.g$currentPageId ?? "pageStart", latestInput);
        });
    }

    private setupDataMapping() {
        //マウス操作との整合
        qsAll("[data-mapping]")
            .filter((e) => e instanceof HTMLElement)
            .forEach((button) => {
                this.setHoverHighlight(button);
            });

        //input要素を触った後にそれを含む要素にfocusさせる
        qsAll(".rangeContainer[data-mapping]").forEach((container) => {
            container.querySelectorAll("input").forEach((element) => {
                element.addEventListener("click", () => {
                    container.focus();
                });
            });
        });

        //最後にclickを行った時間の更新
        qsAddEvent("[data-mapping]", "click", () => {
            this.lastOperateTime = Date.now();
        });
    }

    private async onPageChanged() {
        const id = pageManager.g$currentPageId;
        if (!id) return;

        this.shiftFocusElement(id);

        //情報を更新する
        EventManager.removeEvents(this.pageOperateEvents);
        this.pageOperateEvents.length = 0;
        this.listeningInputs.length = 0;

        //早すぎるページ遷移の禁止
        await sleep(Setting.debounceOperateTime * 2.5);

        //イベントの追加
        inputManager.g$inputs.forEach((input) => {
            if (input.isAuto()) return;

            this.addPageOperateEvent(id, input);
        });

        //mappingが設定されたElementを取得
        this.currentMappedElements = this.createMappedElements(id);
    }

    private shiftFocusElement(id: string) {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        //ページのボタンを最初にfocusするか
        if (this.focusFlag) {
            qs(`#${id} [data-mapping]`)?.focus();
            this.focusFlag = false;
        }
    }

    /**
     * 指定したページを操作するEventを指定したinputに追加する
     * @param pageId ページのid
     * @param input Eventを追加するinput
     */
    private addPageOperateEvent(pageId: string, input: Input): void {
        if (this.listeningInputs.includes(input)) {
            return;
        }

        const manager = input.g$manager;

        const eventId = manager.addEvent(["onKeydown", "onButtondown", "onStickActive"], () => {
            this.onInput(pageId, manager.g$latestPressingKey);
        });
        this.pageOperateEvents.push(eventId);
        this.listeningInputs.push(input);
    }

    private onFirstOperation() {
        this.currentMappedElements[0]?.element.focus();
        EventManager.executeEventsByClassName("interaction");
    }

    private onCancel(pageId: string) {
        this.focusFlag = true;

        const backElement = qs(`#${pageId} .back`);

        if (!backElement) {
            EventManager.executeEventsByClassName("interaction");
            return;
        }

        this.updateLastOperateTime();

        EventManager.executeEventsByClassName("interaction");
        EventManager.executeEventsByClassName("cancelInteraction");

        backElement.click();
    }

    private onInput(pageId: string, latestKey: string) {
        if (!this.operable) {
            return;
        }

        //前回の操作から間が空いていないならreturn
        if (Date.now() - this.lastOperateTime <= Setting.debounceOperateTime) {
            return;
        }

        // まだどこにもフォーカスがない場合
        if (!this.g$selectedElement) {
            this.onFirstOperation();
            return;
        }

        const cancelKeys = ["KeyX", "Escape", "Backspace", "button:0"];
        const upKeys = ["ArrowUp", "KeyW", "button:12", "stick:-1"];
        const downKeys = ["ArrowDown", "KeyS", "button:13", "stick:+1"];
        const leftKeys = ["ArrowLeft", "KeyA", "button:14", "stick:-0"];
        const rightKeys = ["ArrowRight", "KeyD", "button:15", "stick:+0"];
        const okKeys = ["Enter", "Space", "KeyZ", "button:1"];

        if (cancelKeys.includes(latestKey)) {
            this.onCancel(pageId);
            return;
        }

        if (upKeys.includes(latestKey)) {
            const element = this.getTargetElement([null, -1]);
            element.focus();
            this.updateLastOperateTime();
        }

        if (downKeys.includes(latestKey)) {
            const element = this.getTargetElement([null, 1]);
            element.focus();
            this.updateLastOperateTime();
        }

        if (leftKeys.includes(latestKey)) {
            const element = this.getTargetElement([-1, null]);

            if (element.classList.contains("rangeContainer")) {
                const input = element.querySelector<HTMLInputElement>("input")!;
                input.stepDown();
                input.dispatchEvent(new Event("input"));
            }

            element.focus();
            this.updateLastOperateTime();
        }

        if (rightKeys.includes(latestKey)) {
            const element = this.getTargetElement([1, null]);

            if (element.classList.contains("rangeContainer")) {
                const input = element.querySelector<HTMLInputElement>("input")!;
                input.stepUp();
                input.dispatchEvent(new Event("input"));
            }

            element.focus();
            this.updateLastOperateTime();
        }

        if (okKeys.includes(latestKey)) {
            if (document.activeElement instanceof HTMLElement) {
                this.focusFlag = true;
                this.g$selectedElement.element.click();
                this.updateLastOperateTime();
                EventManager.executeEventsByClassName("confirmInteraction");
            }
        }

        EventManager.executeEventsByClassName("interaction");
    }

    /**
     * 最後に操作した時間を更新する
     */
    updateLastOperateTime(): void {
        this.lastOperateTime = Date.now();
        removeMousePointerTemporary();
    }

    setHoverHighlight(button: HTMLElement): void {
        button.addEventListener("mouseover", () => {
            button.focus();
        });

        button.addEventListener("mouseleave", () => {
            if (document.activeElement == button) {
                button.blur();
            }
        });
    }

    /**
     * 指定したページのmappingが設定されている要素を取得する
     * @param pageId ページのid
     */
    private createMappedElements(pageId: string): MappedElement[] {
        const elements = qsAll(`#${pageId} [data-mapping]`);

        return elements.map((element) => ({
            element: element,
            coordinate: JSON.parse(element.dataset.mapping!) as [number, number],
        }));
    }

    /**
     * 現在選択している要素から、移動先の要素を返す
     * 何も選択していなければ適当なmappingが設定されている要素、なければbodyを返す
     * @param param0 相対的な移動先
     * @returns 移動先のHTMLElement
     */
    private getTargetElement([dx, dy]: [number | null, number | null]): HTMLElement {
        const selectedElement = this.g$selectedElement;

        if (!selectedElement) {
            if (this.currentMappedElements.length > 0) {
                return this.currentMappedElements[0].element;
            } else {
                return document.body;
            }
        }

        let [sx, sy] = selectedElement.coordinate;

        let target = getMinElement(
            this.currentMappedElements
                .filter(({ coordinate: [x, y] }) => x == sx + (dx ?? x - sx) && y == sy + (dy ?? y - sy))
                .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: Math.hypot(x - sx, y - sy) }))
        );

        if (!target) {
            target = getMinElement(
                this.currentMappedElements
                    .filter(({ coordinate: [x, y] }) => x == (dx ? x : sx) && y == (dy ? y : sy))
                    .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: (dx ? 0 : Math.sign(dy ?? 0) * y) + (dy ? 0 : Math.sign(dx ?? 0) * x) }))
            );
        }

        if (!target) {
            target = selectedElement.element;
        }

        return target;
    }
}

export const screenInteraction = new ScreenInteraction();

screenInteraction.addEvent(["interaction"], () => {
    const id = pageManager.g$currentPageId;
    if (id == "pageStart") {
        qs("#pageStart").click();
        screenInteraction.updateLastOperateTime();
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
                screenInteraction.updateLastOperateTime();
                pageManager.setPage("replayPause");
            }
        }
        return;
    }
});
