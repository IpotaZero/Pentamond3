/**
 * 実際の時間に即したタイマー
 */
export class TimeManager {
    //時間はすべてmsで管理される

    private startTime: number | null = null;
    private lastPauseTime: number | null = null;
    private pauseSpan: number = 0;
    private hasStarted: boolean = false;
    private isPausing: boolean = false;

    /**
     * @param startImmediately インスタンス生成後すぐに開始するかどうか
     */
    constructor(startImmediately: boolean = false) {
        if (startImmediately) {
            this.start();
        }
    }

    /**
     * 開始時間
     * まだ開始していない場合はnull
     */
    get g$startTime(): number | null {
        return this.startTime;
    }

    /**
     * 最後に中断した時間
     * まだ中断したことがない場合はnull
     */
    get g$lastPauseTime(): number | null {
        return this.lastPauseTime;
    }

    /**
     * 開始されているかどうか
     */
    get g$hasStarted(): boolean {
        return this.hasStarted;
    }

    /**
     * 中断中かどうか
     */
    get g$isPausing(): boolean {
        return this.isPausing;
    }

    /**
     * 中断時間の合計
     */
    get g$pauseSpan(): number {
        return this.pauseSpan;
    }

    /**
     * 時間の計測を開始する
     */
    start(): void {
        if (this.hasStarted) {
            return;
        }
        this.startTime = Date.now();
        this.hasStarted = true;
        this.isPausing = false;
    }

    /**
     * 時間の計測を中断する
     */
    pause(): void {
        if (!this.hasStarted || this.isPausing) {
            return;
        }
        this.lastPauseTime = Date.now();
        this.isPausing = true;
    }

    /**
     * 時間の計測を再開する
     */
    resume(): void {
        if (!this.hasStarted || !this.isPausing) {
            return;
        }
        this.pauseSpan += Date.now() - this.lastPauseTime!;
        this.isPausing = false;
    }

    /**
     * 時間の計測をリセットする
     * @param startImmediately リセット後すぐに開始するかどうか
     */
    reset(startImmediately: boolean = false): void {
        this.startTime = null;
        this.lastPauseTime = null;
        this.pauseSpan = 0;
        this.hasStarted = false;
        this.isPausing = false;
        if (startImmediately) {
            this.start();
        }
    }

    /**
     * 経過時間
     * 開始していなければnullを返す
     * @returns 経過時間
     */
    get g$elapsedTime(): number | null {
        if (!this.hasStarted) {
            return null;
        }
        if (this.isPausing) {
            return this.lastPauseTime! - this.pauseSpan - this.startTime!;
        }
        return Date.now() - this.pauseSpan - this.startTime!;
    }

    /**
     * @param goal 目標経過時間
     * @returns 目標経過時間の達成回数
     */
    getGoalCount(goal: number): number {
        if (!this.hasStarted) {
            return 0;
        }
        return Math.floor(this.g$elapsedTime! / goal);
    }
}
