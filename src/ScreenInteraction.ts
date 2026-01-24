import { EventId, EventManager, MyEventListener } from "./EventManager";
import { Input } from "./Interaction/Input";
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
    private mappedElements: MappedElement[] = [];
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
        return this.mappedElements.find(({ element: option }) => option == document.activeElement) ?? null;
    }

    private addInteractionEvents() {
        //ページ変更ごとにそのページを操作できるイベントをinputに追加する
        pageManager.addEvent(["pageChanged"], async () => {
            const page = pageManager.g$currentPage;
            if (!page) {
                return;
            }
            const id = page.id;
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            //情報を更新する
            EventManager.removeEvents(this.pageOperateEvents);
            this.pageOperateEvents.length = 0;
            this.listeningInputs.length = 0;
            //ページのボタンを最初にfocusするか
            if (this.focusFlag) {
                qs(`#${id} [data-mapping]`)?.focus();
                this.focusFlag = false;
            }
            //早すぎるページ遷移の禁止
            await sleep(Setting.debounceOperateTime * 2.5);
            //イベントの追加
            inputManager.g$inputs.forEach((input) => {
                if (input.isAuto()) {
                    return;
                }
                this.addPageOperateEvent(id, input);
            });
            //mappingが設定されたElementを取得
            this.setMappedElements(id);
        });

        //マウス操作との整合
        qsAll("[data-mapping]")
            .filter((e) => e instanceof HTMLElement)
            .forEach((button) => {
                this.setHoverHighlight(button);
            });

        //最後にclickを行った時間の更新
        qsAddEvent("[data-mapping]", "click", () => {
            this.lastOperateTime = Date.now();
        });

        //途中追加されたinputにイベントの追加
        inputManager.addEvent(["inputAdded"], () => {
            const latestInput = inputManager.g$inputs.at(-1)!;
            if (latestInput.isAuto()) {
                return;
            }
            this.addPageOperateEvent(pageManager.g$currentPageId ?? "pageStart", latestInput);
        });

        //input要素を触った後にそれを含む要素にfocusさせる
        qsAll(".rangeContainer[data-mapping]").forEach((container) => {
            container.querySelectorAll("input").forEach((element) => {
                element.addEventListener("click", () => {
                    container.focus();
                });
            });
        });
    }

    /**
     * 指定したページを操作するEventを指定したinputに追加する
     * @param id ページのid
     * @param input Eventを追加するinput
     */
    private addPageOperateEvent(id: string, input: Input): void {
        if (this.listeningInputs.includes(input)) {
            return;
        }
        const manager = input.g$manager;
        const eventId = manager.addEvent(["onKeydown", "onButtondown", "onStickActive"], () => {
            //前回の操作から間が空いていないならreturn
            if (Date.now() - this.lastOperateTime <= Setting.debounceOperateTime || !this.operable) {
                return;
            }
            const latestKey = manager.g$latestPressingKey;
            if (["KeyX", "Escape", "Backspace", "button:0"].includes(latestKey)) {
                this.focusFlag = true;
                const backElement = qs(`#${id} .back`);
                if (!backElement) {
                    EventManager.executeEventsByClassName("interaction");
                    return;
                }
                this.updateLastOperateTime();
                EventManager.executeEventsByClassName("interaction");
                EventManager.executeEventsByClassName("cancelInteraction");
                backElement.click();
                return;
            }
            if (!this.g$selectedElement) {
                if (this.mappedElements.length) {
                    this.mappedElements[0].element.focus();
                }
                EventManager.executeEventsByClassName("interaction");
                return;
            }
            if (["ArrowUp", "KeyW", "button:12", "stick:-1"].includes(latestKey)) {
                const element = this.getMoveElement([null, -1]);
                element.focus();
                this.updateLastOperateTime();
            }
            if (["ArrowDown", "KeyS", "button:13", "stick:+1"].includes(latestKey)) {
                const element = this.getMoveElement([null, 1]);
                element.focus();
                this.updateLastOperateTime();
            }
            if (["ArrowLeft", "KeyA", "button:14", "stick:-0"].includes(latestKey)) {
                const element = this.getMoveElement([-1, null]);
                if (element.classList.contains("rangeContainer")) {
                    const input = element.querySelector<HTMLInputElement>("input")!;
                    input.stepDown();
                    input.dispatchEvent(new Event("input"));
                }
                element.focus();
                this.updateLastOperateTime();
            }
            if (["ArrowRight", "KeyD", "button:15", "stick:+0"].includes(latestKey)) {
                const element = this.getMoveElement([1, null]);
                if (element.classList.contains("rangeContainer")) {
                    const input = element.querySelector<HTMLInputElement>("input")!;
                    input.stepUp();
                    input.dispatchEvent(new Event("input"));
                }
                element.focus();
                this.updateLastOperateTime();
            }
            if (["Enter", "Space", "KeyZ", "button:1"].includes(latestKey)) {
                if (document.activeElement instanceof HTMLElement) {
                    this.focusFlag = true;
                    this.g$selectedElement.element.click();
                    this.updateLastOperateTime();
                    EventManager.executeEventsByClassName("confirmInteraction");
                }
            }
            EventManager.executeEventsByClassName("interaction");
        });
        this.pageOperateEvents.push(eventId);
        this.listeningInputs.push(input);
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
     * @param id ページのid
     */
    private setMappedElements(id: string) {
        const elements = qsAll(`#${id} [data-mapping]`);
        this.mappedElements = elements.map(
            (element) =>
                ({
                    element: element,
                    coordinate: JSON.parse(element.dataset.mapping!),
                }) as MappedElement
        );
    }

    /**
     * 現在選択している要素から、移動先の要素を返す
     * 何も選択していなければ適当なmappingが設定されている要素、なければbodyを返す
     * @param param0 相対的な移動先
     * @returns 移動先のHTMLElement
     */
    private getMoveElement([dx, dy]: [number | null, number | null]): HTMLElement {
        const selectedElement = this.g$selectedElement;
        if (!selectedElement) {
            return this.mappedElements.length ? this.mappedElements[0].element : document.body;
        }
        let [sx, sy] = selectedElement.coordinate;
        let move = getMinElement(
            this.mappedElements
                .filter(({ coordinate: [x, y] }) => x == sx + (dx ?? x - sx) && y == sy + (dy ?? y - sy))
                .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: Math.hypot(x - sx, y - sy) }))
        );
        if (!move) {
            move = getMinElement(
                this.mappedElements
                    .filter(({ coordinate: [x, y] }) => x == (dx ? x : sx) && y == (dy ? y : sy))
                    .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: (dx ? 0 : Math.sign(dy ?? 0) * y) + (dy ? 0 : Math.sign(dx ?? 0) * x) }))
            );
        }
        if (!move) {
            move = selectedElement.element;
        }
        return move;
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
