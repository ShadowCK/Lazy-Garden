/***
 * Zhao Jin, 2021/11/7
 * Target class: Flowers for my mini-game Lazy Garden
 * Properties: 
     *  sprout, sprout_weed, growing, growing_weed, mature, mature_weed: p5 images
     *  state: String
     *  x, y: Number
     *  growth, growthLimit, growthSpeed: Number
 */
class Target {
    static r = 16;
    /**
     * Generates a flower at given coordinates. Should be run in the preload() function.
     * @param {*} x X coordinate where the gardener start off
     * @param {*} y Y coordinate where the gardener start off
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.sprout = loadImage("media/Flower-sprout.png");
        this.sprout_weed = loadImage("media/Flower-sprout-weed.png");
        this.growing = loadImage("media/Flower-growing.png");
        this.growing_weed = loadImage("media/Flower-growing-weed.png");
        this.mature = loadImage("media/Flower-mature.png");
        this.mature_weed = loadImage("media/Flower-mature-weed.png");

        this.state = "sprout";

        // Gameplay settings
        this.growth = 0;
        this.growthLimit = 10000;
        this.growthReq_growing = this.growthLimit / 2;
        this.growthSpeed = 100;
        this.wateringCount = 0;
        this.wateringReq = 1; // If and only if wateringCount is no less than wateringReq would the flower be finally grown, regardless of its growth progress.
        this.growthFactor_weed = 0.25;
        this.growthBarLength = 30;

        this.weedChanceBase = 0.01; // Every second there is a weed check.
        this.weedChanceAddition = 0.15; // Every passed second adds this proportion of weedChanceBase to the actual chance.
        this.weedChanceCap = 0.05;
        let flower = this;
        this.weedTimer = new TaskTimer(0, 1000, 1000,
            function () {
                let
                    addition = parseInt(flower.weedTimer.time / 1000) * flower.weedChanceAddition,
                    chance = min(flower.weedChanceBase * (1 + addition), flower.weedChanceCap);
                logDebug("chance: " + chance, 1);
                if (random(1) <= chance) {
                    flower.changeState(flower.state, true);
                    flower.weedTimer.reset();
                }
            }
        );

        this.waterIntervalReq = 10000; // Flower can only be watered once during every interval.
        this.waterTimer = new CountdownTimer(this.waterIntervalReq, 0, false);

        this.workIntervalReq = 5000; // Flower can only be processed once during every interval.
        this.workTimer = new CountdownTimer(this.workIntervalReq, 0, false);
    }

    /**
     * Displays the flower.
     */
    display() {
        // Mechanism execution for flowers
        this.grow();

        this.workTimer.tick();
        this.waterTimer.tick();

        // Draws dirt. If watered recently, the color is darker;
        rectMode(CENTER);
        noStroke();
        fill(0, map(this.waterTimer.time, 0, this.waterIntervalReq, 20, 100, true));
        rect(this.x, this.y, 100, 100);

        let stateImage; // Which image to use for display determined by state.
        if (this.state === "sprout") stateImage = this.sprout;
        if (this.state === "sprout_weed") stateImage = this.sprout_weed;
        if (this.state === "growing") stateImage = this.growing;
        if (this.state === "growing_weed") stateImage = this.growing_weed;
        if (this.state === "mature") stateImage = this.mature;
        if (this.state === "mature_weed") stateImage = this.mature_weed;
        image(stateImage, this.x, this.y);

        // Draws the growth bar
        rectMode(CORNER);
        stroke(0);
        strokeWeight(2);
        fill(255);
        // Draws bar background
        let l = this.growthBarLength;
        rect(this.x - l / 2, this.y + Target.r + 3, l, 6);
        // Draws current endurance
        noStroke();
        if (this.isWeeded()) {
            if (this.waterTimer.isOn()) fill(59, 45, 116); // Weeded watered
            else fill(225, 216, 47, 220); // Weeded
        } else {
            if (this.waterTimer.isOn()) fill(27, 86, 255, 220); // Healthy watered
            else fill(115, 214, 41, 220); // Healthy
        }
        rect(this.x - l / 2 + 1, this.y + Target.r + 4, map(this.growth, 0, this.growthLimit, 0, l - 1, true), 4);
        // Draws Timer Indicators
        if (this.workTimer.isOn() || this.waterTimer.isOn()) {
            stroke(0);
            strokeWeight(2);
            if (this.workTimer.isOn()) {
                fill(125, 75);
                arc(this.x + 35, this.y - 35, 20, 20, 0, map(this.workTimer.time, 0, this.workTimer.count, 0, 360, true), PIE);
            }
            if (this.waterTimer.isOn()) {
                fill(0, 0, 255, 75);
                arc(this.x + 35, this.y - 12, 20, 20, 0, map(this.waterTimer.time, 0, this.waterTimer.count, 0, 360, true), PIE);
            }
        }
    }

    grow(amount = null) {
        let growthFactor = 1;
        if (this.isWeeded()) {
            growthFactor *= this.growthFactor_weed;
        }
        if (amount === null) this.growth += deltaTime / 1000 * this.growthSpeed * growthFactor; // Natural growth
        else this.growth += amount; // Manually added growth

        // Switches state due to growth update – (sprout) → growing → mature 
        if (this.growth >= this.growthLimit) {
            this.growth = this.growthLimit;
            if (!this.isMature()) {
                this.changeState("mature", this.isWeeded());
            }
        } else if (this.isSprout() && this.growth > this.growthReq_growing) {
            this.changeState("growing", this.isWeeded());
        }

        // Switches state between healthy and weeded
        if (!this.isWeeded()) {
            this.weedTimer.tick();
        }
    }

    water() {
        this.grow(1000);
        this.waterTimer.reset();
    }

    weed() {
        this.state = this.state.substring(0, this.state.indexOf("_weed"));
    }

    harvest() {
        this.state = "sprout";
        this.growth = 0;
        let income = random(flowerPrice[0], flowerPrice[1]);
        money += income;
        textBubbles.push(new TextBubble("$" + income.toFixed(0), this.x + random(-20, 20), this.y + random(-20, 20), 1000, [0, 129, 0]));
    }

    isSprout() {
        return this.state.includes("sprout");
    }

    isGrowing() {
        return this.state.includes("growing");
    }

    isMature() {
        return this.state.includes("mature");
    }

    isWeeded() {
        return this.state.includes("weed");
    }

    isWorkable(gardener) {
        // Has been worked?
        if (this.workTimer.isOn()) return false;
        // Has any need?
        if (typeof this.getNeededWork(gardener) === "string") return true;
        return false;
    }
    getNeededWork(gardener) {
        if (!this.isMature() && !this.waterTimer.isOn() && gardener.state === "watering") return "watering"; // Can be watered
        if (this.isWeeded() && gardener.state === "weeding") return "weeding"; // Can be weeded
        if (this.isMature() && !this.isWeeded() && gardener.state === "harvesting") return "harvesting"; // Can be harvested
        return null;
    }

    changeState(newState, weeded = false) {
        if (weeded) newState += "_weed";
        this.state = newState;
    }
}

class Timer {
    constructor(time = 0) {
        this.time = time;
    }
    tick() {
        this.time += deltaTime;
    }
    reset() {
        this.time = 0;
    }
}

class TaskTimer extends Timer {
    constructor(time = 0, period = 1000, counter = period, task = function () { }) {
        super(time);
        this.period = period;
        this.counter = counter;
        this.task = task;
    }
    tick() {
        super.tick();
        this.counter = max(0, this.counter - deltaTime);
        if (this.counter === 0) {
            this.counter = this.period;
            this.task(); // Runs the task
        }
    }
    reset() {
        super.reset();
        this.counter = this.period;
    }
}

class CountdownTimer extends Timer {
    constructor(count = 10000, time = count, repeated = false) {
        super(time);
        this.count = count;
        this.repeated = repeated;
    }
    tick() {
        this.time -= deltaTime;
        if (this.time <= 0) {
            if (this.repeated) this.reset();
            else this.time = 0;
        }
    }
    reset() {
        this.time = this.count;
    }
    // * Repeated Countdown Timer is always on.
    isOn() {
        return this.time > 0;
    }
}