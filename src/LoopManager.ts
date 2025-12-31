import { MyEventListener, EventId, EventManager } from "./EventManager.js";
import { TimeManager } from "./TimeManager.js";

export class LoopManager implements MyEventListener {
    /**
     * 目標ループ頻度(ms)
     * requestAnimationFrameの頻度が最速
     * 0なら自動的に最速
     */
    private loopFrequency: number = 0;
    private loopTimer: TimeManager | null = null;
    private lastLoopCount = 0;
    private loopId: number | null = null;
    private isLooping: boolean = false;
    /**
     * @param loop ループをしたとき
     */
    readonly eventClassNames: string[] = ["loop"];
    eventIds: EventId[] = [];
    addEvent(classNames: string[], handler: Function): EventId {
        const eventId = EventManager.addEvent({ classNames: classNames.filter((className) => this.eventClassNames.includes(className)), handler });
        this.eventIds.push(eventId);
        return eventId;
    }

    /**
     * @param startImmediately インスタンス生成後すぐに開始するかどうか
     */
    constructor(startImmediately: boolean = false) {
        if (startImmediately) {
            this.start();
        }
    }

    /**
     * ループ中かどうか
     */
    get g$isLooping() {
        return this.isLooping;
    }

    /**
     * ループ頻度
     */
    get g$loopFrequency(): number {
        return this.loopFrequency;
    }

    /**
     * @param frequency 設定したいループ頻度
     */
    set s$loopFrequency(frequency: number) {
        if (!Number.isSafeInteger(frequency) || frequency <= 0) {
            throw new Error("不正な値が入力されました: " + frequency);
        }
        this.loopFrequency = frequency;
    }

    /**
     * ループを開始する
     */
    start(): void {
        if (this.isLooping) {
            return;
        }
        this.loopId = requestAnimationFrame(this.loop.bind(this));
        if (this.loopTimer) {
            this.loopTimer.resume();
        } else {
            this.loopTimer = new TimeManager(true);
        }
        this.isLooping = true;
    }

    /**
     * ループを停止する
     */
    stop(): void {
        if (this.loopTimer) {
            this.loopTimer.pause();
        }
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
        }
        this.isLooping = false;
    }

    /**
     * ループをリセットする
     */
    reset(): void {
        this.stop();
        if (this.loopTimer) {
            this.loopTimer.reset();
            this.loopTimer = null;
        }
        this.lastLoopCount = 0;
    }

    /**
     * ループの中身
     */
    private loop() {
        if (!this.loopTimer) {
            return;
        }
        if (!this.isLooping) {
            this.stop();
            return;
        }
        const loopCount = this.loopTimer!.getGoalCount(this.loopFrequency);
        if (this.lastLoopCount != loopCount || loopCount == Infinity) {
            this.lastLoopCount = loopCount;
            EventManager.executeListeningEvents("loop", this.eventIds);
        }
        this.loopId = requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * @returns ループの合計駆動時間
     */
    get g$elapsedTime(): number {
        if (!this.loopTimer) {
            return 0;
        }
        return this.loopTimer.g$elapsedTime!;
    }

    /**
     * @param goal 目標経過時間
     * @returns 目標経過時間の達成回数
     */
    getGoalCount(goal: number): number {
        if (!this.loopTimer) {
            return 0;
        }
        return Math.floor(this.g$elapsedTime / goal);
    }
}
