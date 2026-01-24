import { AutoKeyboardManager } from "./AutoKeyboardManager";
import { GamepadManager } from "./GamepadManager";
import { KeyboardManager } from "./KeyboardManager";

type InputType = "keyboard" | "gamepad" | "autoKeyboard";

export class Input {
    manager: KeyboardManager | GamepadManager | AutoKeyboardManager;
    type: InputType;
    index: number;
    constructor(type: InputType = "keyboard", index = 0) {
        this.type = type;
        this.index = index;
        if (type == "keyboard") {
            this.manager = new KeyboardManager();
        } else if (type == "gamepad") {
            this.manager = new GamepadManager(index);
        } else if (type == "autoKeyboard") {
            this.manager = new AutoKeyboardManager();
        } else {
            const never: never = type;

            console.log("不明なinput形式を指定されました");
            this.type = "keyboard";
            this.manager = new KeyboardManager();
        }
    }

    get g$manager() {
        return this.manager;
    }

    get g$type() {
        return this.type;
    }

    isAuto(): this is Input & { g$manager: AutoKeyboardManager } {
        return this.manager instanceof AutoKeyboardManager;
    }
}
