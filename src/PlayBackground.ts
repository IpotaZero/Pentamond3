import { LoopManager } from "./LoopManager";
import { qs } from "./Utils";

const element = qs("#playBackground");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;

element.appendChild(canvas);
canvas.width = qs("body").clientWidth;
canvas.height = qs("body").clientHeight;

class Triangle {
    x: number = 0;
    y: number = 0;
    size: number = 0;
    speed: number = 0;
    opacity: number = 0;
    angle: number = 0;
    rotationSpeed: number = 0;
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50;
        this.size = 20 + Math.random() ** 1.2 * 40;
        this.speed = 0.6 + Math.random() * 1.6;
        this.opacity = 0.2 + Math.random() * 0.5;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.y -= this.speed;
        this.angle += this.rotationSpeed;
        if (this.y < -this.size) {
            this.reset();
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.moveTo(0, (-this.size / 2) * (Math.sqrt(3) / 2));
        ctx.lineTo(-this.size / 2, (this.size / 2) * (Math.sqrt(3) / 2));
        ctx.lineTo(this.size / 2, (this.size / 2) * (Math.sqrt(3) / 2));
        ctx.closePath();

        ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
        ctx.fill();

        ctx.restore();
    }
}

const colorAnimation = element.animate(
    [
        {
            backgroundColor: "#88aaee",
        },
        {
            backgroundColor: "#aa88ee",
        },
        {
            backgroundColor: "#aaeeaa",
        },
        {
            backgroundColor: "#eeeeaa",
        },
        {
            backgroundColor: "#88aaee",
        },
    ],
    {
        duration: 25000,
        direction: "normal",
        iterations: Infinity,
    }
);

const triangles = Array.from({ length: 50 }, () => new Triangle());
const playBackgroundLoop = new LoopManager();
playBackgroundLoop.addEvent(["loop"], () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    triangles.forEach((tri) => {
        tri.update();
        tri.draw(ctx);
    });
});

export const playBackground = {
    reset: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        triangles.forEach((tri) => {
            tri.reset();
        });
        playBackgroundLoop.reset();
        colorAnimation.cancel();
    },
    start: () => {
        playBackgroundLoop.start();
        if (colorAnimation.playState != "running") {
            colorAnimation.play();
        }
    },
    stop: () => {
        playBackgroundLoop.stop();
        colorAnimation.pause();
    },
};

// ウィンドウサイズ変更対応
window.addEventListener("resize", () => {
    canvas.width = qs("body").clientWidth;
    canvas.height = qs("body").clientHeight;
});
