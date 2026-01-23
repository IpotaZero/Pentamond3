import { EventId, EventManager } from "./EventManager";
import { Input } from "./Interaction/Input";
import { inputManager } from "./Interaction/InputManager";
import { pageManager } from "./PageManager";
import { sleep, qs, qsAll, getMinElement, removeMousePointerTemporary, qsAddEvent } from "./Utils";
import * as Setting from "./Settings";
import { GameProcessing } from "./GameProcessing/GameProcessing";

//画面のinputによる操作
const pageOperateEvents: EventId[] = [];
const listeningInputs: Input[] = [];
let focusFlag = false;
let lastOperateTime = 0;
export let ScreenInteractionSetting = {
    operable: true,
};

pageManager.addEvent(["pageChanged"], async () => {
    const page = pageManager.g$currentPage;
    if (!page) {
        return;
    }
    const id = page.id;
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
    //情報を更新する
    EventManager.removeEvents(pageOperateEvents);
    // console.log("remove:" + id);
    pageOperateEvents.length = 0;
    listeningInputs.length = 0;
    listeningInputs.concat(inputManager.g$inputs);
    //ページのボタンを最初にfocusするか
    if (focusFlag) {
        qs(`#${id} [data-mapping]`)?.focus();
        focusFlag = false;
    }
    //早すぎるページ遷移の禁止
    await sleep(300);
    //イベントの追加
    inputManager.g$inputs.forEach((input) => {
        addPageOperateEvent(id, input);
    });
});

function addPageOperateEvent(id: string, input: Input) {
    if (listeningInputs.includes(input)) {
        return;
    }
    const manager = input.g$manager;

    //pageStartの処理
    if (id == "pageStart") {
        const eventId = manager.addEvent(["onKeydown", "onButtondown", "onStickActive"], () => {
            focusFlag = false;
            qs("#pageStart").click();
            operateWithInput();
        });
        pageOperateEvents.push(eventId);
        return;
    }

    const eventId = manager.addEvent(["onKeydown", "onButtondown", "onStickActive"], () => {
        //前回の操作から間が空いていないならreturn
        if (Date.now() - lastOperateTime <= Setting.debounceOperateTime || !ScreenInteractionSetting.operable) {
            return;
        }

        const options = qsAll(`#${id} [data-mapping]`);
        const optionInfos = options.map((option) => ({
            element: option as HTMLElement,
            coordinate: JSON.parse(option.dataset.mapping!) as [number, number],
        }));

        const latestKey = manager.g$latestPressingKey;
        if (["KeyX", "Escape", "Backspace", "button:0"].includes(latestKey)) {
            focusFlag = true;
            qs(`#${id} .back`)?.click();
            operateWithInput();
            return;
        }

        // 何を行っている?
        if (id == "play") {
            const isPushPauseButton = ["KeyP", ...Setting.gamepadConfigPresets[0].pause].includes(latestKey);
            if (isPushPauseButton) {
                focusFlag = true;
                operateWithInput();

                const currentGame = GameProcessing.currentGame;

                if (!currentGame) throw new Error("ゲームが始められていないのにポーズされた。");

                // currentGameの中身はできるだけprivateにしたいのでここら辺何とかしたい
                if (GameProcessing.isReplay() && currentGame.players[0].loop.g$isLooping) {
                    currentGame.game.stop();
                    pageManager.setPage("replayPause");
                }
            }
        }

        const selectElement = optionInfos.find(({ element: option }) => option == document.activeElement);
        if (!selectElement) {
            if (options.length) {
                options[0].focus();
            }
            return;
        }
        const getMoveElement = ([dx, dy]: [number | null, number | null]) => {
            let [sx, sy] = selectElement.coordinate;
            let move = getMinElement(
                optionInfos
                    .filter(({ coordinate: [x, y] }) => x == sx + (dx ?? x - sx) && y == sy + (dy ?? y - sy))
                    .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: Math.hypot(x - sx, y - sy) }))
            );
            if (!move) {
                move = getMinElement(
                    optionInfos
                        .filter(({ coordinate: [x, y] }) => x == (dx ? x : sx) && y == (dy ? y : sy))
                        .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: (dx ? 0 : Math.sign(dy ?? 0) * y) + (dy ? 0 : Math.sign(dx ?? 0) * x) }))
                );
            }
            if (!move) {
                move = selectElement.element;
            }
            return move as HTMLElement;
        };
        if (["ArrowUp", "KeyW", "button:12", "stick:-1"].includes(latestKey)) {
            const element = getMoveElement([null, -1]);
            element.focus();
            operateWithInput();
        }
        if (["ArrowDown", "KeyS", "button:13", "stick:+1"].includes(latestKey)) {
            getMoveElement([null, 1]).focus();
            operateWithInput();
        }
        if (["ArrowLeft", "KeyA", "button:14", "stick:-0"].includes(latestKey)) {
            const element = getMoveElement([-1, null]);
            if (element.classList.contains("rangeContainer")) {
                const input = element.querySelector<HTMLInputElement>("input")!;
                input.stepDown();
                input.dispatchEvent(new Event("input"));
            }
            element.focus();
            operateWithInput();
        }
        if (["ArrowRight", "KeyD", "button:15", "stick:+0"].includes(latestKey)) {
            const element = getMoveElement([1, null]);
            if (element.classList.contains("rangeContainer")) {
                const input = element.querySelector<HTMLInputElement>("input")!;
                input.stepUp();
                input.dispatchEvent(new Event("input"));
            }
            element.focus();
            operateWithInput();
        }
        if (["Tab"].includes(latestKey)) {
            getMoveElement([1, 1]).focus();
            operateWithInput();
        }
        if (["Enter", "Space", "KeyZ", "button:1"].includes(latestKey)) {
            if (document.activeElement instanceof HTMLElement) {
                focusFlag = true;
                document.activeElement.click();
                operateWithInput();
            }
        }
    });

    pageOperateEvents.push(eventId);
}

function operateWithInput() {
    lastOperateTime = Date.now();
    removeMousePointerTemporary();
}

inputManager.addEvent(["inputAdded"], () => {
    addPageOperateEvent(pageManager.g$currentPageId ?? "pageStart", inputManager.g$inputs.at(-1)!);
});

//マウス操作との整合
qsAll("[data-mapping]")
    .filter((e) => e instanceof HTMLElement)
    .forEach((button) => {
        setHoverHighlight(button);
    });

export function setHoverHighlight(button: HTMLElement) {
    button.addEventListener("mouseover", () => {
        button.focus();
    });

    button.addEventListener("mouseleave", () => {
        if (document.activeElement == button) {
            button.blur();
        }
    });
}

qsAddEvent("[data-mapping]", "click", () => {
    lastOperateTime = Date.now();
});

//input要素を触った後にそれを含む要素にfocusさせる
qsAll(".rangeContainer[data-mapping]").forEach((container) => {
    container.querySelectorAll("input").forEach((element) => {
        element.addEventListener("click", () => {
            container.focus();
        });
    });
});
