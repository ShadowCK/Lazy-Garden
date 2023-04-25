/***
 * Zhao Jin, 2021/11/7
 * TextBubble class: A text bubble that pops up for notifications for my mini-game Lazy Garden
 * Properties: 
     * text: String
     * x, y, duration: Number
     * color: Number[]
 */

class TextBubble {
    /**
     * Generates a text bubble at given coordinates.
     * @param {*} text Text to display
     * @param {*} x X coordinate for the text to start off
     * @param {*} y X coordinate for the text to start off
     * @param {*} duration How long the text would exist.
     * @param {*} color Color of the text. Black by default.
     */
    constructor(text, x, y, duration, color = [0, 0, 0]) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.timer = duration;

        this.color = color;
        this.transparency = 255;
    }

    draw() {
        if (this.timer > 0) {
            noStroke();
            fill(this.color[0], this.color[1], this.color[2], this.transparency);
            textSize(15);
            text(this.text, this.x, this.y);
            this.y -= deltaTime / 1000 * 100;
            this.transparency = map(this.timer, 0, this.duration, 80, 255, true);
        }
        this.timer = max(this.timer - deltaTime, 0);
    }
}