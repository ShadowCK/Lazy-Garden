
class Util {
    /**
     * It a directional point (location) is out of bounds, fixes it.
     * @param {*} point Point.class
     * @param {*} r How far from the border within canvas should it start to consider the point as out of bounds
     * @param {*} dir Direction of the point
     * @returns new point
     */
    static checkCollision(point, r, dir) {
        let
            outWidth = point.x - 0 < r || width - point.x < r,
            outHeight = point.y - yFix < r || height - point.y < r;

        if (outWidth || outHeight) {
            if (outWidth) this.fixLocation(point, r, dir, point.x - 0 < r ? "left" : "right");
            if (outHeight) this.fixLocation(point, r, dir, point.y - yFix < r ? "top" : "bottom");
        }
        return point;
    }

    static fixLocation(point, r, dir, loc) {
        if (loc == "false") return;
        if (loc == "left") {
            let a = 180 - dir;
            let l = 0 - point.x + r;
            point.x = point.x + l;
            point.y = point.y + tan(a) * l;
        } else if (loc == "right") {
            let a = dir;
            let l = point.x - width + r;
            point.x = point.x - l;
            point.y = point.y + tan(a) * l;
        } else if (loc == "top") {
            let a = dir - 180 / 2;
            let l = yFix - point.y + r;
            point.y = point.y + l;
            point.x = point.x + tan(a) * l;
        } else if (loc == "bottom") {
            let a = (180 * 3) / 2 - dir;
            let l = point.y - height + r;
            point.y = point.y - l;
            point.x = point.x + tan(a) * l;
        }
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
        switch (this.getQuadrant(x, y)) {
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
        return this.normalizeAngle(angle);
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

}