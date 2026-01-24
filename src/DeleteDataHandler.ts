import { pageManager } from "./PageManager";
import { qs, sleep, qsAddEvent } from "./Utils";

export class DeleteDataHandler {
    static setEvents() {
        pageManager.addEvent(["setPage-dataSetting"], () => {
            const dataSize = this.getAllDataSize();
            qs("#dataInformation").innerHTML = `全データの容量：${dataSize} B`;
        });

        pageManager.addEvent(["setPage-allDataDeleteAlert"], async () => {
            const confirmButton = qs("#allDataDeleteConfirmButton") as HTMLButtonElement;
            confirmButton.disabled = true;
            confirmButton.style.opacity = "0";

            await sleep(1500);

            confirmButton.disabled = false;
            confirmButton.style.opacity = "1";
        });

        qsAddEvent("#allDataDeleteConfirmButton", "click", async () => {
            this.removeAllData();
            pageManager.backPages(2, { eventIgnore: true });
            pageManager.setPage("dataSetting");
        });
    }

    private static getAllDataSize() {
        return new Blob([
            localStorage.getItem("Pentamond3-replayData") ?? "",
            localStorage.getItem("Pentamond3-graphicSetting") ?? "",
            localStorage.getItem("Pentamond3-volumeSetting") ?? "",
            //
        ]).size;
    }

    private static removeAllData() {
        localStorage.removeItem("Pentamond3-replayData");
        localStorage.removeItem("Pentamond3-graphicSetting");
        localStorage.removeItem("Pentamond3-volumeSetting");
    }
}
