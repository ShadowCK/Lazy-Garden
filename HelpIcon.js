/***
 * Zhao Jin, 2021/11/22
 * HelpIcon class: An icon showing information when hovered over for my mini-game Lazy Garden
 * Properties: 
     *  x, y, w, h: Number
 */

class HelpIcon {
    /**
     * Generates a help icon at the screen top right. When hovered over, shows game instructions.
     * Pre-requisite: x, y as left top coordinates – rectMode(CORNER)
     * @param {*} x X coordinate
     * @param {*} y Y coordinate
     * @param {*} w width of image
     * @param {*} h height of image
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.image = loadImage("./media/question-mark.png");
    }

    display() {
        imageMode(CORNER);
        let isHovering = this.isHovering();
        isHovering ? tint(255, 200) : tint(0, 200);
        image(this.image, this.x, this.y, this.w, this.h);
        noTint();
        // Stops drawing so all in-game elements are paused.
        if (isHovering) {
            rectMode(CORNER);
            fill(0, 155);
            rect(50, 50, 700, 900);
            image(instructionsImage, 50, 50, 700, 900);
            if (isLooping) {
                noLoop();
                deltaTime = 0;
            }
        }
    }

    isHovering() {
        return mouseInsideRect(this.x, this.y, this.w, this.h);
    }
}