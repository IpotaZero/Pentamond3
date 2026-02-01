import { EventManager } from "../UtilManagers/EventManager";
import { ScreenInteractionView } from "./ScreenInteractionView";
import { qsAddEvent, removeMousePointerTemporary, qs } from "../Utils";
import * as Setting from "../Settings";
import { pageManager } from "../UtilManagers/PageManager";

export class ScreenInteractionOperationRunner {
    private lastOperateTime = 0;

    constructor(private readonly view: ScreenInteractionView) {}

    /**
     * mappedElementをクリックしたら操作とみなしてlastOperateTimeを更新する
     */
    setEvents() {
        qsAddEvent("[data-mapping]", "click", () => {
            this.lastOperateTime = Date.now();
        });
    }

    getLastOperationTime() {
        return this.lastOperateTime;
    }

    run(pushedKey: string) {
        //前回の操作から間が空いていないならreturn
        if (Date.now() - this.lastOperateTime <= Setting.debounceOperateTime) {
            return;
        }

        EventManager.executeEventsByClassName("interaction");
        EventManager.executeEventsByClassName(`interaction-${pageManager.g$currentPageId}`);

        // まだどこにもフォーカスがない場合
        if (!this.view.getFocusedElement()) {
            this.view.focusFirstElement();
            return;
        }

        const cancelKeys = ["KeyX", "Escape", "Backspace", "button:0"];
        if (cancelKeys.includes(pushedKey)) {
            this.onCancel();
            return;
        }

        this.handleDirectionKey(pushedKey);

        const okKeys = ["Enter", "Space", "KeyZ", "button:1"];
        if (okKeys.includes(pushedKey)) {
            this.onOk();
        }
    }

    /**
     * 最後に操作した時間を更新し、ポインターを一時的に隠す
     */
    updateLastOperationTimeAndHidePointer(): void {
        this.lastOperateTime = Date.now();
        removeMousePointerTemporary();
    }

    private onCancel() {
        // ページ移動の可能性があるときはtrueにする
        this.view.focusOnPageChange = true;

        const backButton = pageManager.g$currentPage?.querySelector<HTMLElement>(".back");

        if (!backButton) {
            return;
        }

        this.updateLastOperationTimeAndHidePointer();

        EventManager.executeEventsByClassName("cancelInteraction");
        EventManager.executeEventsByClassName(`cancelInteraction-${pageManager.g$currentPageId}`);

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

        this.updateLastOperationTimeAndHidePointer();

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

        this.view.getFocusedElement()!.element.click();
        this.updateLastOperationTimeAndHidePointer();

        EventManager.executeEventsByClassName("confirmInteraction");
        EventManager.executeEventsByClassName(`confirmInteraction-${pageManager.g$currentPageId}`);
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
}
