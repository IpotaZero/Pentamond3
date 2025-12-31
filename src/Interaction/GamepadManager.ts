import { MyEventListener, EventId, EventManager } from "../EventManager";
import { GamepadInput } from "./GamepadInput";

export class GamepadManager implements MyEventListener {
    private input: GamepadInput;
    private pressingKeys: string[] = [];
    private pressTimes: number[] = [];
    private valid: boolean = false;
    //keyCodeはbutton:*buttonIndex*、stick:+*axisIndex*、stick:-*axisIndex*の形

    readonly eventClassNames: string[] = ["onButtondown", "onButtonup", "onStickActive", "onStickInactive"];
    eventIds: EventId[] = [];
    addEvent(classNames: string[], handler: Function): EventId {
        const eventId = EventManager.addEvent({ classNames: classNames.filter((className) => this.eventClassNames.includes(className)), handler });
        this.eventIds.push(eventId);
        return eventId;
    }

    constructor(index: number) {
        this.input = new GamepadInput(index);
        this.input.onButtonDown = (e) => {
            if (!this.pressingKeys.includes("button:" + e.buttonIndex)) {
                this.pressingKeys.push("button:" + e.buttonIndex);
                this.pressTimes.push(Date.now());
                EventManager.executeListeningEvents("onButtondown", this.eventIds);
                // console.log("Pressed:" + e.buttonIndex);
            }
        };
        this.input.onButtonUp = (e) => {
            this.pressingKeys = this.pressingKeys.filter((keys, i) => {
                if (keys == "button:" + e.buttonIndex) {
                    this.pressTimes[i] = -1;
                }
                return keys != "button:" + e.buttonIndex;
            });
            this.pressTimes = this.pressTimes.filter((time) => time != -1);
            EventManager.executeListeningEvents("onButtonup", this.eventIds);
            // console.log("Unpressed:" + e.buttonIndex);
        };
        this.input.onAxisActive = (e) => {
            if (e.value > 0) {
                if (!this.pressingKeys.includes("stick:+" + e.axisIndex)) {
                    this.pressingKeys.push("stick:+" + e.axisIndex);
                    this.pressTimes.push(Date.now());
                    EventManager.executeListeningEvents("onStickActive", this.eventIds);
                    // console.log("Activated:+" + e.axisIndex);
                }
            } else {
                if (!this.pressingKeys.includes("stick:-" + e.axisIndex)) {
                    this.pressingKeys.push("stick:-" + e.axisIndex);
                    this.pressTimes.push(Date.now());
                    EventManager.executeListeningEvents("onStickActive", this.eventIds);
                    // console.log("Activated:-" + e.axisIndex);
                }
            }
        };
        this.input.onAxisInactive = (e) => {
            if (e.value > 0) {
                this.pressingKeys = this.pressingKeys.filter((keys, i) => {
                    if (keys == "stick:+" + e.axisIndex) {
                        this.pressTimes[i] = -1;
                    }
                    return keys != "stick:+" + e.axisIndex;
                });
                this.pressTimes = this.pressTimes.filter((time) => time != -1);
                EventManager.executeListeningEvents("onStickInactive", this.eventIds);
                // console.log("Inactivated:+" + e.axisIndex);
            } else {
                this.pressingKeys = this.pressingKeys.filter((keys, i) => {
                    if (keys == "stick:-" + e.axisIndex) {
                        this.pressTimes[i] = -1;
                    }
                    return keys != "stick:-" + e.axisIndex;
                });
                this.pressTimes = this.pressTimes.filter((time) => time != -1);
                EventManager.executeListeningEvents("onStickInactive", this.eventIds);
                // console.log("Inactivated:-" + e.axisIndex);
            }
        };
    }

    //有効かどうか
    get g$isValid(): boolean {
        return this.valid;
    }

    //押された最新のキー
    get g$latestPressingKey(): string {
        return this.pressingKeys.length != 0 ? this.pressingKeys[this.pressingKeys.length - 1] : "";
    }

    //押された最古のキー
    get g$oldestPressingKey(): string {
        return this.pressingKeys.length != 0 ? this.pressingKeys[0] : "";
    }

    //まだ押されているキーのうちの押された最古の時間
    get g$latestPressTime(): number {
        return this.pressTimes.length != 0 ? this.pressTimes[this.pressTimes.length - 1] : -1;
    }

    //まだ押されているキーのうちの押された最新の時間
    get g$oldestPressTime(): number {
        return this.pressTimes.length != 0 ? this.pressTimes[0] : -1;
    }

    //入力を受け取るのを開始する
    start() {
        if (this.valid) {
            return;
        }
        this.input.start();
        this.valid = true;
    }

    //入力を受け取るのを停止する
    stop() {
        if (!this.valid) {
            return;
        }
        this.valid = false;
        this.input.stop();
        this.pressingKeys = [];
        this.pressTimes = [];
    }

    //指定したキーが押されているか
    isPressing(keyCode: string): boolean {
        return this.pressingKeys.includes(keyCode);
    }

    //指定した複数のキーがすべて押されているか
    arePressing(keyCodes: string[]): boolean {
        let arePressing = true;
        keyCodes.forEach((keyCode) => {
            arePressing = arePressing && this.isPressing(keyCode);
        });
        return arePressing;
    }

    //指定した複数のキーのどれかが押されているか
    existsPressingKey(keyCodes: string[]) {
        let existsPressingKey = false;
        keyCodes.forEach((keyCode) => {
            existsPressingKey = existsPressingKey || this.isPressing(keyCode);
        });
        return existsPressingKey;
    }

    //指定したキーが押された時間を返す
    //選択されていない場合は-1を返す
    getPressTime(keyCode: string): number {
        if (this.pressingKeys.indexOf(keyCode) == -1) {
            return -1;
        }
        return this.pressTimes[this.pressingKeys.indexOf(keyCode)];
    }

    //指定した複数のキーの中で最も遅くに押されたものを返す
    //どれも押されていない場合は空文字を返す
    getLatestPressingKey(keyCodes: string[]): string {
        let index = -1;
        keyCodes.forEach((keyCode) => {
            const i = this.pressingKeys.indexOf(keyCode);
            if (index < i) {
                index = i;
            }
        });
        return index == -1 ? "" : this.pressingKeys[index];
    }

    //指定した複数のキーの中で最も早くに押されたものを返す
    //どれも押されていない場合は空文字を返す
    getOldestPressingKey(keyCodes: string[]): string {
        let index = Infinity;
        keyCodes.forEach((keyCode) => {
            const i = this.pressingKeys.indexOf(keyCode);
            if (i < index && i != -1) {
                index = i;
            }
        });
        return index == -1 ? "" : this.pressingKeys[index];
    }

    //指定した複数のキーの中で押されているものをすべて返す
    getAllPressingKeys(keyCodes: string[]): string[] {
        return this.pressingKeys.filter((keyCode) => keyCodes.includes(keyCode));
    }
}
