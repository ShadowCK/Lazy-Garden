/***
 * Zhao Jin, 2021/11/7
 * ClickIndicator class: A click indicator that shows where you clicked for my mini-game Lazy Garden
 * Properties: 
     *  x, y, timer: Number
 */

class ClickIndicator {
    /**
     * Generates a click indicator with mouse coordinates when cast, to display for duration long.
     * @param {*} duration How long the indicator exists.
     */
    constructor(duration) {
        this.x = mouseX;
        this.y = mouseY;
        this.timer = duration;
    }

    draw() {
        if (this.timer > 0) {
            noStroke();
            fill(255, 255, 0, 60);
            // Size is correspondent to 1000 max time;
            circle(this.x, this.y, map(this.timer, 0, 1000, 10, 100, true));
        }
        this.timer = max(this.timer - deltaTime, 0);
    }
}