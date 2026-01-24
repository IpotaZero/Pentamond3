import { EventId, EventManager } from "./EventManager";
import { Input } from "./Interaction/Input";
import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";

export class ScreenInteractionInputHandler {
    private registeredInputList: Input[] = [];
    private pageOperateEvents: EventId[] = [];

    /**
     * 登録されたinputが何かしらの操作を行ったとき呼ばれる
     * @param pushedKey
     */
    onOperate = (pushedKey: string) => {};

    /**
     * 途中追加されたinputを登録するイベント
     */
    setEvents() {
        inputManager.addEvent(["inputAdded"], () => {
            const addedInput = inputManager.g$inputs.at(-1)!;

            if (addedInput.isAuto()) {
                return;
            }

            const pageId = pageManager.g$currentPageId ?? "pageStart";
            this.registerInput(addedInput);
        });
    }

    areOperated(interactions: string[]) {
        return this.registeredInputList.some((input) => interactions.includes(input.g$manager.g$latestPressingKey));
    }

    removeInput() {
        EventManager.removeEvents(this.pageOperateEvents);
        this.pageOperateEvents = [];
        this.registeredInputList = [];
    }

    /**
     * 指定したページを操作するEventを指定したinputに追加する
     * @param pageId ページのid
     * @param input Eventを追加するinput
     */
    registerInput(input: Input): void {
        // すでに登録されているならリターン
        if (this.registeredInputList.includes(input)) return;
        this.registeredInputList.push(input);

        const manager = input.g$manager;

        const operationEvents = ["onKeydown", "onButtondown", "onStickActive"];

        const eventId = manager.addEvent(operationEvents, () => this.onOperate(manager.g$latestPressingKey));

        this.pageOperateEvents.push(eventId);
    }
}
