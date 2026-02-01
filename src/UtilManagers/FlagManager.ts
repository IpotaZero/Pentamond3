import { EventId, EventManager, MyEventListener } from "./EventManager";

/**
 * フラグを管理する
 * フラグの変更時にイベント検知できる
 */
export class FlagManager implements MyEventListener {
    private static instance: FlagManager;
    private flags: Set<string> = new Set<string>();

    /**
     * @param flagAdd -フラグ名　フラグが追加されたとき
     * @param flagRemove -フラグ名　フラグが削除されたとき
     * @param flagChanged フラグが変更されたとき
     */
    readonly eventClassNames: string[] = ["flagAdd", "flagRemove", "flagChanged"];
    addEvent(classNames: string[], handler: Function): EventId {
        return EventManager.addEvent({ classNames: classNames, handler });
    }

    constructor() {
        if (FlagManager.instance) {
            return FlagManager.instance;
        }
        FlagManager.instance = this;
    }

    get g$size(): number {
        return this.flags.size;
    }

    get g$flagNames(): Set<string> {
        return structuredClone(this.flags);
    }

    add(flag: string): boolean {
        if (this.flags.has(flag)) {
            return false;
        }
        this.flags.add(flag);
        EventManager.executeEventsByClassName("flagAdd");
        EventManager.executeEventsByClassName("flagAdd-" + flag);
        EventManager.executeEventsByClassName("flagChanged");
        return true;
    }

    remove(flag: string): boolean {
        if (this.flags.delete(flag)) {
            EventManager.executeEventsByClassName("flagRemove");
            EventManager.executeEventsByClassName("flagRemove-" + flag);
            EventManager.executeEventsByClassName("flagChanged");
            return true;
        }
        return false;
    }

    has(flag: string): boolean {
        return this.flags.has(flag);
    }

    hasAll(...flags: string[]): boolean {
        return new Set(flags).isSubsetOf(this.flags);
    }

    hasAny(...flags: string[]): boolean {
        let result = false;
        flags.forEach((flag) => {
            if (this.flags.has(flag)) {
                result = true;
                return;
            }
        });
        return result;
    }
}

export const flagManager = new FlagManager();
