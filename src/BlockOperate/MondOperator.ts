import { BlockManager } from "./BlockManager";
import { GraphicData } from "../CanvasManager";
import { EventId, EventManager, MyEventListener } from "../EventManager";
import { MondState } from "./Monoiamond";
import { NextManager } from "./NextManager";
import { Pentiamond } from "./Pentiamond";
import * as Setting from "../Settings";
import { TrickInfo } from "../Trick";
import { BlockKind } from "./Block";

export class MondOperator implements MyEventListener {
    blockManager: BlockManager = new BlockManager();
    private hand: Pentiamond = new Pentiamond();
    private prevPosition: [number, number] | null = null;
    private prevDirection: number | null = null;
    private next: NextManager = new NextManager();
    private pausing: boolean = true;
    private lastTrick: TrickInfo | null = null;

    readonly eventClassNames: string[] = ["move", "move-left", "move-right", "move-down", "spin", "spin-left", "spin-right", "put", "unput", "removeLine", "hold"];
    eventIds: EventId[] = [];
    addEvent(classNames: string[], handler: Function): EventId {
        const eventId = EventManager.addEvent({ classNames: classNames.filter((className) => this.eventClassNames.includes(className)), handler });
        this.eventIds.push(eventId);
        return eventId;
    }

    constructor() {}

    get g$graphicData(): GraphicData {
        return {
            blockProperties: this.blockManager.g$blockProperties,
            ghostMondState: this.g$ghostState,
            next: this.next.g$next,
            hold: this.next.g$holdKind,
        };
    }

    get g$blockManager(): BlockManager {
        return this.blockManager;
    }

    get g$nextMemory(): BlockKind[] {
        return window.structuredClone(this.next.g$nextMemory);
    }

    set s$next(next: BlockKind[]) {
        if (!this.next.g$currentKind) {
            this.next.s$next = next;
        }
    }

    private get g$ghostState(): MondState[] {
        if (!this.hand.g$visible) {
            return [];
        }
        this.blockManager.removePentiamond(this.hand);
        const ghostMond = this.hand.g$copy;
        ghostMond.s$visible = false;
        this.blockManager.displayPentiamond(ghostMond);
        while (this.blockManager.fall(ghostMond));
        this.blockManager.removePentiamond(ghostMond);
        this.blockManager.displayPentiamond(this.hand);
        return ghostMond.g$states;
    }

    get g$lastTrick(): TrickInfo | null {
        return this.lastTrick;
    }

    start() {
        if (!this.next.g$currentKind) {
            this.proceed();
        }
        this.pausing = false;
        this.blockManager.displayPentiamond(this.hand);
    }

    stop() {
        this.pausing = true;
        this.blockManager.removePentiamond(this.hand);
    }

    private proceed() {
        this.next.proceed();
        this.initializeHand();
        this.blockManager.displayPentiamond(this.hand);
    }

    private initializeHand() {
        this.hand = new Pentiamond(Setting.initialX, Setting.initialY, this.next.g$currentKind!);
    }

    move(moveDirection: "right" | "left" | "down"): void {
        if (!this.isOperable()) {
            return;
        }
        if (this.blockManager.move(this.hand, moveDirection)) {
            EventManager.executeListeningEvents("move", this.eventIds);
            EventManager.executeListeningEvents("move-" + moveDirection, this.eventIds);
        }
    }

    spin(rotate: "right" | "left"): void {
        if (!this.isOperable()) {
            return;
        }
        if (this.blockManager.spin(this.hand, rotate)) {
            EventManager.executeListeningEvents("spin", this.eventIds);
            EventManager.executeListeningEvents("spin-" + rotate, this.eventIds);
        }
    }

    hold() {
        if (!this.isOperable()) {
            return;
        }
        this.blockManager.removePentiamond(this.hand);
        this.next.hold();
        this.initializeHand();
        this.blockManager.displayPentiamond(this.hand);
        EventManager.executeListeningEvents("hold", this.eventIds);
    }

    put() {
        if (!this.isOperable()) {
            return;
        }
        while (this.blockManager.fall(this.hand));
        this.prevPosition = this.hand.g$position;
        this.prevDirection = this.hand.g$direction;
        this.proceed();
        EventManager.executeListeningEvents("put", this.eventIds);
    }

    unput() {
        if (this.pausing || !this.prevPosition) {
            return;
        }
        this.blockManager.removePentiamond(this.hand);
        this.next.back();
        this.initializeHand();
        this.hand.s$position = this.prevPosition;
        this.hand.s$direction = this.prevDirection!;
        this.hand.s$visible = true;
        this.blockManager.removePentiamond(this.hand);
        this.hand.s$position = [Setting.initialX, Setting.initialY];
        this.hand.s$direction = 0;
        this.blockManager.displayPentiamond(this.hand);
        this.forgetPrev();
        EventManager.executeListeningEvents("unput", this.eventIds);
    }

    removeLine() {
        if (this.pausing) {
            return;
        }
        this.blockManager.removePentiamond(this.hand);
        this.forgetPrev();
        this.lastTrick = this.blockManager.removeLine();
        this.hand.s$position = [Setting.initialX, Setting.initialY];
        this.hand.s$direction = 0;
        this.blockManager.displayPentiamond(this.hand);
        EventManager.executeListeningEvents("removeLine", this.eventIds);
    }

    forgetPrev() {
        this.prevPosition = null;
        this.prevDirection = null;
        this.next.forgetPrev();
    }

    isOperable() {
        return this.hand.g$visible && !this.pausing;
    }

    isPausing() {
        return this.pausing;
    }
}
