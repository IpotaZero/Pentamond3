import { EventId, EventManager } from "../UtilManagers/EventManager";
import { Input } from "./Input";

class InputManager {
    private static instance: InputManager;
    private registering = false;
    private inputTypes: string[] = ["keyboard"];
    private inputs: Input[] = [new Input("keyboard")];
    private maxInputNumber: number = 4;
    private registerEventIds: EventId[] = [];
    private registeredInputs: Input[] = [];

    readonly eventClassNames: string[] = ["inputRegistered", "finishRegister", "inputAdded"];
    addEvent(classNames: string[], handler: Function): EventId {
        return EventManager.addEvent({ classNames, handler });
    }

    constructor() {
        if (InputManager.instance) {
            return InputManager.instance;
        }
        InputManager.instance = this;

        window.addEventListener("gamepadconnected", (e) => {
            if (!this.inputTypes.includes(`gamepad:${e.gamepad.index}`)) {
                this.inputTypes.push(`gamepad:${e.gamepad.index}`);
                const input = new Input("gamepad", e.gamepad.index);
                this.inputs.push(input);
                input.g$manager.start();
                if (this.registering) {
                    this.addRegisterEvent(input);
                }
                EventManager.executeEventsByClassName("inputAdded");
            }
        });
        this.inputs[0].g$manager.start();
    }

    get g$registeredInputs() {
        return this.registeredInputs;
    }

    get g$maxInputNumber() {
        return this.maxInputNumber;
    }

    get g$registering() {
        return this.registering;
    }

    get g$registeredInputNumber() {
        return this.registeredInputs.length;
    }

    get g$inputs() {
        return this.inputs;
    }

    set s$maxInputNumber(maxInputNumber: number) {
        this.maxInputNumber = maxInputNumber;
    }

    startRegister() {
        this.registering = true;
        this.registeredInputs = [];
        this.registerEventIds = [];
        this.inputs.forEach((input) => {
            this.addRegisterEvent(input);
        });
        this.start();
    }

    finishRegister() {
        if (!this.registering) {
            return;
        }
        EventManager.removeEvents(this.registerEventIds);
        this.registering = false;
        EventManager.executeEventsByClassName("finishRegister");
    }

    private addRegisterEvent(input: Input) {
        this.registerEventIds.push(
            input.g$manager.addEvent(["onKeydown", "onButtondown", "onStickActive"], () => {
                if (!this.registeredInputs.includes(input)) {
                    this.registeredInputs.push(input);
                    EventManager.executeEventsByClassName("inputRegistered");
                }
                if (this.registeredInputs.length >= this.maxInputNumber) {
                    this.finishRegister();
                }
            })
        );
    }

    resetRegister() {
        this.registering = false;
        this.registeredInputs = [];
        EventManager.removeEvents(this.registerEventIds);
        this.inputs.forEach((input) => {
            EventManager.removeEvents(input.g$manager.eventIds);
        });
    }

    start() {
        this.inputs.forEach((input) => {
            input.g$manager.start();
        });
    }

    stop() {
        this.inputs.forEach((input) => {
            input.g$manager.stop();
        });
    }

    addInput(input: Input) {
        if (!this.inputs.includes(input)) {
            this.inputs.push(input);
            this.inputTypes.push(input.g$type);
        }
    }

    removeVirtualInputs() {
        this.inputTypes = this.inputTypes.filter((type) => type == "keyboard" || type.includes("gamepad"));
        this.inputs
            .filter((input) => !["keyboard", "gamepad"].includes(input.g$type))
            .forEach((input) => {
                input.g$manager.stop();
            });
        this.inputs = this.inputs.filter((input) => ["keyboard", "gamepad"].includes(input.g$type));
        this.registeredInputs = this.registeredInputs.filter((input) => ["keyboard", "gamepad"].includes(input.g$type));
    }

    register(input: Input) {
        if (this.registeredInputs.length >= this.maxInputNumber) {
            return;
        }
        this.addInput(input);
        if (!this.registeredInputs.includes(input)) {
            this.registeredInputs.push(input);
            EventManager.executeEventsByClassName("inputRegistered");
        }
    }
}

export const inputManager = new InputManager();
