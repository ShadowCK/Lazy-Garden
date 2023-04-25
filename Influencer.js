/***
 * Zhao Jin, 2021/11/7
 * Influencer class: Gardeners for my mini-game Lazy Garden
 * Properties: 
     *  isIdle: Boolean
     *  idle, resting, watering, weeding, harvesting: p5 images
     *  state: String
     *  x, y, speed, dir: Number
     *  path: Path.class
     *  color: Number[]
     *  selected: Boolean
     *  selectedGlowTimer: Number
     *  enduranceLimit, endurance, enduranceCost, restEfficiency: Number
 */

class Influencer {
    static r = 32; // Image radius of the unified size of all gardener pics
    /**
     * Generates a gardener at given coordinates. Should be run in the preload() function.
     * @param {*} x X coordinate where the gardener start off
     * @param {*} y Y coordinate where the gardener start off
     */
    constructor(x, y) {
        this.idle = loadImage("media/Gardener-idle.png");
        this.isIdle = true; // CURRENTLY NOT USED!!
        this.idleTimer = null; // How long every idle action should last
        this.isWorking = false; // Being in a working state does NOT mean the gardener is "working" – performing an interactive task with a flower

        this.resting = loadImage("media/Gardener-resting.png");
        this.watering = loadImage("media/Gardener-watering.png");
        this.weeding = loadImage("media/Gardener-weeding.png");
        this.harvesting = loadImage("media/Gardener-harvesting.png");
        this.state = "resting";
        this.stateBeforeAutoRest = null;

        this.x = x; // X coordinate of current position
        this.y = y; // Y coordinate of current position
        this.path = new Path(this);
        this.speed = 1; // Movement speed
        this.dir = random(360); // Movement direction

        this.color = [random(100, 255), random(100, 255), random(100, 255)]; // Color blender for the sprite that distinguishes the gardeners a bit

        this.selected = false; // Whether selected for commands
        this.selectedGlowTimer = 1000; // Period how long it glows every time

        // Gameplay settings
        this.enduranceLimit = 60;
        this.endurance = this.enduranceLimit; // Endurance in seconds. Determines availability of the gardener. Actual duration may vary, depending on both factors followed below.
        this.enduranceCost = 1; // Endurance cost per second when working
        this.restEfficiency = 1; // Endurance recovery per second when resting
    }

    /**
     * Resets the selection glow timer to the certain time left.
     * @param {*} period // How long it glows every time
     */
    resetGlowTimer(period) {
        this.selectedGlowTimer = period;
    }

    /**
     * Displays the gardener at its location.
     * Including: movement calculation, endurance update, cheer-up effects weakening and other mechanism execution.
     */
    display() {
        let stateImage; // Which image to use for display determined by state.
        if (this.state === "resting") stateImage = this.resting;
        if (this.state === "watering") stateImage = this.watering;
        if (this.state === "weeding") stateImage = this.weeding;
        if (this.state === "harvesting") stateImage = this.harvesting;

        // Mechanism execution for gardeners
        this.updateEndurance();
        this.move();
        this.getLazy();

        // Uses tint to draw a color blender over image
        tint(this.color);
        image(stateImage, this.x, this.y);
        noTint();

        // Draws the endurance bar
        rectMode(CENTER);
        stroke(0);
        strokeWeight(2);
        fill(255);
        // Draws bar background
        rect(this.x, this.y - Influencer.r, 36, 6);
        // Draws current endurance
        noStroke();
        this.restEfficiency < 1 ? fill(216, 127, 5, 220) : fill(115, 214, 41, 220);
        rect(this.x, this.y - Influencer.r, map(this.endurance, 0, this.enduranceLimit, 0, 34, true), 4);

        // Draws selection glow. Glow size is based on 1000 max time - SHOULD have duration field like TextBubble to be adjustable.
        if (this.selected) {
            noStroke();
            fill(175, 60);
            this.selectedGlowTimer = max(this.selectedGlowTimer - deltaTime, 0);
            circle(this.x, this.y, map(this.selectedGlowTimer, 0, 1000, 10, 80, true));
            if (this.selectedGlowTimer === 0) this.selectedGlowTimer = 1000;
        }
    }

    /**
     * Updates state of the gardener to the specific one. 
     * @param {*} state The state to be updated to
     */
    setState(state, manual = false) {
        this.state = state;
        if (manual) {
            this.stateBeforeAutoRest = null;
        }
    }

    ///////////////////////////////////////////////////////
    //                                                   //
    //                   Movement System                 //
    //                                                   //
    ///////////////////////////////////////////////////////

    /**
     * Calculates the gardener's movement.
     */
    move() {
        let hasGoal = this.path.hasGoal();
        if (!hasGoal) {
            let nearestFlower = null;
            if (this.getEnduranceRatio() >= 0.5) {
                // Tries to reach the nearest workable flower – this only tells the gardener where to go, NOT assuring work when it arrives.
                nearestFlower = this.getNearestWorkableFlower(Number.MAX_VALUE);
                if (nearestFlower != null) this.path.addPoint(nearestFlower.x, nearestFlower.y);
            }
            if (nearestFlower === null) { // EnduranceRatio < 0.5 OR couldn't find a workable flower
                let waypoint, distance;
                do {
                    waypoint = new Waypoint(random(this.x - 120, this.x + 120), random(this.y - 120, this.y + 120))
                    Util.checkCollision(waypoint, 3, Util.getAngle(mouseX - this.x, this.y - mouseY));
                    distance = dist(this.x, this.y, waypoint.x, waypoint.y);
                }
                while (distance < 80)
                logDebug("Waypoint Dist: " + dist, 2, true);
                this.path.addPoint(waypoint.x, waypoint.y);
            }
        }
        this.updateDir();
        let
            realSpeed = this.speed * 50 / 1000, // Movement speed in pixels in real time (per millisecond)
            speedX = realSpeed * cos(this.dir) * deltaTime, // Speed on X-axis
            speedY = realSpeed * sin(this.dir) * deltaTime; // Speed on Y-axis
        this.x += speedX;
        this.y -= speedY;

        // If gardener is close to the targeted waypoint, advance to the next.
        if (hasGoal && dist(this.x, this.y, this.path.getGoal().x, this.path.getGoal().y) <= 5) {
            this.path.nextPoint();
            if (this.state != "resting" || !this.isIdle) this.tryToWork();
        }

        // Checks if the gardener is out of bounds. If so, fixes its location.
        if (this.checkCollision() === true
            && this.path.hasGoal()) {
            // Cancels the improper goal making the gardener out of bounds. (if there is)
            this.path.nextPoint();
        }
    }

    updateDir() {
        let goal = this.path.getGoal();
        this.dir = Influencer.getAngle(goal.x - this.x, this.y - goal.y);
    }

    /**
     * Checks if any part of the gardener is out of bounds (treated as a circle). If so, fixes the location and direction of the ball.
     * @returns If it worked
     */
    checkCollision() {
        let errorAllowed = 1; /* Default angle error allowed. If the difference between CC2CC angle of the current ball
        and that of when the ball touches both sides is within the error range, the ball is regarded touching both sides.
        *CC2CC = circle center to canvas center; *CC2CC angle = the angle between the line from CC2CC and X axis */
        let
            diagonalAngle = abs(atan(((height - yFix) / 2 - Influencer.r) / (width / 2 - Influencer.r))),
            outWidth = this.x - 0 < Influencer.r || width - this.x < Influencer.r,
            outHeight = this.y - yFix < Influencer.r || height - this.y < Influencer.r;

        if (outWidth || outHeight) {
            if (outWidth) this.fixLocation(this.x - 0 < Influencer.r ? "left" : "right");
            if (outHeight) this.fixLocation(this.y - yFix < Influencer.r ? "top" : "bottom");
            let ballAngle = abs(atan((this.y - (height / 2 + yFix / 2)) / (this.x - width / 2)));
            if (ballAngle <= diagonalAngle + errorAllowed) this.fixDir(true);
            if (ballAngle >= diagonalAngle - errorAllowed) this.fixDir(false);
            return true;
        }
        return false;
    }

    /**
     * Fixes the gardener's location when it's outside of the canvas. Triangular functions are being nice here.
     * It would be called twice in checkCollision, respectively for height and width fixes. If the gardener is
     * still outside after a two-time fix, technically only because the diameter exceeds the shorter side.
     * @param {*} loc Side of canvas the gardener is out of
    */
    fixLocation(loc) {
        if (loc == "false") return;
        if (loc == "left") {
            let a = 180 - this.dir;
            let l = 0 - this.x + Influencer.r;
            this.x = this.x + l;
            this.y = this.y + tan(a) * l;
        } else if (loc == "right") {
            let a = this.dir;
            let l = this.x - width + Influencer.r;
            this.x = this.x - l;
            this.y = this.y + tan(a) * l;
        } else if (loc == "top") {
            let a = this.dir - 180 / 2;
            let l = yFix - this.y + Influencer.r;
            this.y = this.y + l;
            this.x = this.x + tan(a) * l;
        } else if (loc == "bottom") {
            let a = (180 * 3) / 2 - this.dir;
            let l = this.y - height + Influencer.r;
            this.y = this.y - l;
            this.x = this.x + tan(a) * l;
        }
    }

    /**
     * Changes the direction after the location is fixed.
     * @param {*} x Whether to revert x-axis component or y-axis component of the direction.
    */
    fixDir(x) {
        let speedX = abs(this.speed) * cos(this.dir);
        let speedY = abs(this.speed) * sin(this.dir);
        if (x) speedX *= -1;
        else speedY *= -1;
        this.dir = Influencer.getAngle(speedX, speedY, null);
    }

    /**
     * Gets a vector's 360-degree in a planar coordinate system.
     * @param {*} x X component of the vector
     * @param {*} y Y component of the vector
     * @param {*} fallback If the direction is parallel to an axis, returns this. If null(empty), uses the parallel direction (actual situation).
     * @returns Degree of the vector.
     */
    static getAngle(x, y, fallback = null) {
        let angle;
        switch (Influencer.getQuadrant(x, y)) {
            case 0:
                if (fallback === null) {
                    if (x === 0 && y === 0) angle = random(0, 360);
                    // x = 0, y != 0
                    else if (x === 0) {
                        if (y > 0) angle = 90;
                        else angle = 270;
                    }
                    // x != 0, y = 0
                    else {
                        if (x > 0) angle = 0;
                        else angle = 180;
                    }
                }
                else angle = fallback;
                break;
            case 1:
            case 4:
                angle = atan(y / x);
                break;
            case 2:
            case 3:
                angle = 180 + atan(y / x);
        }
        return Influencer.normalizeAngle(angle);
    }

    /**
     * Returns a positive module as in mathematical modular arithmetic
     * @param {*} dividend Dividend in modular arithmetic
     * @param {*} divisor Divisor in modular arithmetic
     * @returns Positive module
     */
    static mod(dividend, divisor) {
        return (dividend % divisor + divisor) % divisor;
    }

    /**
     * Gets the quadrant where a point is located.
     * @param {*} x X coordinate
     * @param {*} y X coordinate
     * @returns quadrant of the point. 0 if on an axis.
     */
    static getQuadrant(x, y) {
        if (x == 0 || y == 0) return 0;
        if (x > 0) {
            return y > 0 ? 1 : 4;
        }
        if (x < 0) return y > 0 ? 2 : 3;
    }
    /**
     * Normalizes an angle within the range of 0 to exclusive 360.
     * @param {*} angle angle to normalize
     * @returns normalized angle
     */
    static normalizeAngle(angle) {
        return this.mod(angle, 360);
    }

    ///////////////////////////////////////////////////////
    //                                                   //
    //                   Misc mechanism                  //
    //                                                   //
    ///////////////////////////////////////////////////////

    /**
     * Updates the gardener's endurance dependant on specific resetEfficiency and enduranceCost.
     */
    updateEndurance() {
        if (this.state === "resting") {
            this.endurance += deltaTime / 1000 * this.restEfficiency;
            if (this.endurance >= this.enduranceLimit) {
                this.endurance = this.enduranceLimit;
                // Recovers full endurance from Auto Rest and gets back to the work before, making this game idle-able.
                // *If the player changes the state manually during Auto Rest, the gardener will forget its stateBefore.
                if (this.restEfficiency < 1) {
                    this.restEfficiency = 1;
                    if (this.stateBeforeAutoRest != null) this.setState(this.stateBeforeAutoRest);
                }
            }
        }
        else {
            let ratioBefore = this.getEnduranceRatio();
            this.endurance -= deltaTime / 1000 * this.enduranceCost;
            let ratioAfter = this.getEnduranceRatio();
            // When endurance drops below 20%, cancels all waypoints available no matter if they're assigned by player.
            if (ratioBefore >= 0.2 && ratioAfter < 0.2) {
                this.path.reset();
                textBubbles.push(new TextBubble("I'm done!", this.x + random(-20, 20), this.y + random(-20, 20), 600, [255, 255, 0]));
            }
            // Auto Rest when endurance drops to 0
            if (this.endurance <= 0) {
                this.endurance = 0;
                this.restEfficiency = 0.75;
                this.stateBeforeAutoRest = this.state;
                this.setState("resting");
            }
        }
    }
    /**
     * @returns Current proportion of endurance to Max
     */
    getEnduranceRatio() {
        return this.endurance / this.enduranceLimit;
    }

    /**
     * Weakens the effects the gardener has got from being cheered up.
     */
    getLazy() {
        if (this.speed > 1) {
            this.speed -= min((this.speed - 1) * 0.1 * deltaTime / 1000, 0.15 * deltaTime / 1000);
            if (this.speed < 1) this.speed = 1;
        }
    }

    checkRadius = 50;
    tryToWork() {
        let flower = this.getNearestWorkableFlower(this.checkRadius);
        if (flower != null) {
            let worked = false;
            let work = flower.getNeededWork(this);
            if (work === null) return false;
            // Watering
            if (work === "watering") {
                flower.water();
                worked = true;
            }
            // Weeding
            if (work === "weeding") {
                flower.weed();
                worked = true;
            }
            // Harvesting
            if (work === "harvesting") {
                flower.harvest();
                worked = true;
            }
            if (worked) {
                flower.workTimer.reset();
                return true;
            }
        }
        return false;
    }

    getNearestWorkableFlower(radius) {
        let nearestFlower = null;
        let shortestDistance = radius;
        for (const flower of flowers) {
            if (!flower.isWorkable(this)) continue;
            let distance = dist(this.x, this.y, flower.x, flower.y);
            // Flowers should be within range to be ever considered
            if (distance >= radius) continue;
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestFlower = flower;
            }
        }
        return nearestFlower;
    }
}