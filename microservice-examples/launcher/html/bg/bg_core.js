import { AttractorWasgl } from "./webgl/v3/attractor_wasgl/main.js";

/**
 * Class used to control the background canvas, swapping between different modes using bgSwap events
 */
export class BackgroundCore {

    init() {
        window.addEventListener("bgSwap", (msg) => {
            this.swapBackground(msg.detail);
        });

        window.addEventListener("configWindowLoaded", _ => {
            window.dispatchEvent(new CustomEvent(
                "notifySelectedBackground", {
                    detail: "attractor_wasgl"
                }
            ));
        });

        this.engine = new AttractorWasgl();
        this.engine.init();
    }

    async swapBackground(bgName) {
        // Destroy the engine locally
        const asyncTeardown = this.engine.destroy();
        if (asyncTeardown !== undefined) {
            await asyncTeardown
        }
        // Remove the canvas
        const bgCont = document.getElementsByClassName("bg-container")[0];
        for (let i = bgCont.childNodes.length - 1; i >= 0; i--) {
            bgCont.removeChild(bgCont.childNodes[i]);
        }

        switch (bgName) {
            case 'attractor_wasgl':
                this.engine = new AttractorWasgl;
                break;
            default:
                break;
        }
        this.engine.init();
    }
}