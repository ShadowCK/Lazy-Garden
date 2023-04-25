/***
 * Zhao Jin, 2021/12/1
 * Influencer class: Path for waypoints
 * Properties: 
     *  TBA
 */

class Path {
    /**
     * 
     * @param {*} owner should be an instance with x,y coordinates
     * @param {*} waypoints Array of Waypoints
     */
    constructor(owner = null, waypoints = []) {
        this.owner = owner;
        this.waypoints = waypoints;
    }

    hasGoal() {
        return this.waypoints.length > 0;
    }
    isEmpty() {
        return !this.hasGoal();
    }

    getPoint(index) {
        return this.waypoints[index];
    }
    getGoal() { // goal = first waypoint
        return this.getPoint(0);
    }
    getFirstPoint() {
        return this.getPoint(0);
    }

    addPoint(x, y) {
        this.waypoints.push(new Waypoint(x, y));
        return this;
    }

    delPoint(index) {
        this.waypoints.splice(index, 1);
        return this;
    }
    nextPoint() {
        this.delPoint(0);
        return this;
    }

    reset() {
        this.waypoints = [];
        return this;
    }

    draw() {
        if (this.isEmpty()) return; // Empty path

        this.waypoints.splice(0, 0, new Waypoint(this.owner.x, this.owner.y));
        // Draws all lines first that they're under waypoints
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            strokeWeight(3);
            i === 0 ? stroke(247, 105, 2) : stroke(255, 255, 70); // Color of lines
            line(this.waypoints[i].x, this.waypoints[i].y, this.waypoints[i + 1].x, this.waypoints[i + 1].y);
        }
        // Staring point (owner's loc)
        if (this.owner != null) {
            fill(70, 255, 70); // Color of starting point
            noStroke();
            circle(this.owner.x, this.owner.y, 10); // Draws starting point as owner's loc
        }
        // Waypoints
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            i === 0 ? fill(255, 255, 0) : fill(2, 144, 247); // Color of goal points
            noStroke();
            circle(this.waypoints[i + 1].x, this.waypoints[i + 1].y, 10);
        }
        this.waypoints.splice(0, 1);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Waypoint extends Point {
    constructor(x, y) {
        super(x, y);
    }
}