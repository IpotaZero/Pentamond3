import { AutoKeyboardManager } from "./AutoKeyboardManager";
import { GamepadManager } from "./GamepadManager";
import { KeyboardManager } from "./KeyboardManager";

export class Input {
    manager: KeyboardManager | GamepadManager | AutoKeyboardManager;
    type: string;
    index: number;
    constructor(type: string = "keyboard", index = 0) {
        this.type = type;
        this.index = index;
        if (type == "keyboard") {
            this.manager = new KeyboardManager();
        } else if (type == "gamepad") {
            this.manager = new GamepadManager(index);
        } else if (type == "autoKeyboard") {
            this.manager = new AutoKeyboardManager();
        } else {
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
}
