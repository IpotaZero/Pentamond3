import { qs } from "../Utils";

export function countDown(countString: string[]) {
    let r = () => {};

    const handler = () => {
        const startEffectLabel = document.createElement("div");
        startEffectLabel.classList.add("startEffectLabel");
        startEffectLabel.innerHTML = countString.shift() ?? "";

        if (countString.length == 0) {
            startEffectLabel.id = "startLabel";
        } else if (startEffectLabel.innerHTML != "") {
        }

        qs("#startEffectBase").appendChild(startEffectLabel);

        startEffectLabel.onanimationend = () => {
            startEffectLabel.remove();

            if (countString.length) {
                handler();
            } else {
                r();
            }
        };
    };

    return new Promise<void>((resolve) => {
        r = resolve;
    });
}
