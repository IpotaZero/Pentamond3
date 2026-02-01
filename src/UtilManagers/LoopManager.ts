import { MyEventListener, EventId, EventManager } from "./EventManager.js";
import { TimeManager } from "./TimeManager.js";

export class LoopManager implements MyEventListener {
    /**
     * 目標ループ頻度(ms)
     * requestAnimationFrameより早い場合自動的にある程度辻褄合わせする
     * 0ならrequestAnimationFrameと同じ頻度
     */
    private loopFrequency: number = 0;
    private loopTimer: TimeManager | null = null;
    private loopCount = 0;
    private loopId: number | null = null;
    private isLooping: boolean = false;
    private speedMagnification = 1;
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
     * ループ回数
     */
    get g$loopCount(): number {
        return this.loopCount;
    }

    /**
     * 現実時間に対するループスピードの倍率
     */
    get g$speedMagnification(): number {
        return this.speedMagnification;
    }

    /**
     * @param frequency 設定したいループ頻度
     */
    set s$loopFrequency(frequency: number) {
        if (Number.isNaN(frequency) || !Number.isFinite(frequency) || frequency <= 0) {
            throw new Error("不正な値が入力されました: " + frequency);
        }
        this.loopFrequency = frequency;
    }

    /**
     * @param speedMagnification 現実時間に対するループスピードの倍率
     */
    set s$speedMagnification(speedMagnification: number) {
        if (Number.isNaN(speedMagnification) || !Number.isFinite(speedMagnification) || speedMagnification <= 0) {
            throw new Error("不正な値が入力されました: " + speedMagnification);
        }
        if (this.isLooping) {
            console.error("ループ中にはスピード倍率を変更できません");
            return;
        }
        this.speedMagnification = speedMagnification;
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
        this.loopCount = 0;
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
        const goalLoopCount = this.loopTimer!.getGoalCount(this.loopFrequency);
        if (this.loopCount != goalLoopCount) {
            if (goalLoopCount == Infinity) {
                EventManager.executeListeningEvents("loop", this.eventIds);
                this.loopCount++;
            } else {
                while (this.loopCount < goalLoopCount) {
                    EventManager.executeListeningEvents("loop", this.eventIds);
                    this.loopCount++;
                }
            }
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
        return this.loopTimer.g$elapsedTime! * this.speedMagnification;
    }

    /**
     * @param goal 目標経過時間
     * @returns 目標経過時間の達成回数
     */
    getGoalCount(goal: number): number {
        if (!this.loopTimer) {
            return 0;
        }
        return Math.floor((this.g$elapsedTime * this.speedMagnification) / goal);
    }
}
