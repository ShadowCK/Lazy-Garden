/*
  **********  *        **        **        **********  **********  **       **  **********  **********  *********   *       **  **********
         **   *        **       * **       *       **  *       **   **     **   *       **      ****    *           *       **      ****
        **    *        **      *   **      *       **  *       **    **   **    *       **      ***     *           *       **      **
       **     ***********     ********     *       **  **********     *****     **********      ***     *   ******  **********      **
      **      *        **    *       **    *       **  **              ***      **   **         ***     *       **  *       **      **
    **        *        **   *         **   *       **  **              ***      **     **       ***     *       **  *       **      **
  **********  *        **  *           **  **********  **              ***      **       **  *********  **********  *       **      **

IGME-101-02 Project2: Influencers by Zhao Jin, start date 11/07/2021
ALL user instructions are included in the index.html file *and* in game.
*/
// Global variables
var backgroundImage;
var instructionsImage;
var yFix = 200; // Actual playground is 800x800. yFix is used to cut off the top 200x when using y coordinates. 

var clickIndicators = [];

var gardeners = [];
var selectedAllGardeners = false; // When true, loop through all gardeners instead of using selectedGardener.
var selectedGardenerIndex = 0; // Index in the gardeners array
var selectedGardener;
var cheering = false; // If any gardener is within a cheer-up radius from cursor

var flowers = [];

var textBubbles = [];

var helpIcon;

// Game-specific/gameplay settings.
var cheerTexts = ["Yay!", "K Boss", "ssup?", "Work work..", "Alright"];
var tiredTexts = ["Am tired!", "Lemme rest!", "You vampire!", "Enough of this!", "No.."]
var cheerUpRadius = 75;
var money = 0;
var flowerPrice = [10, 25];

// Program/test-level settings
var debugLevel = 0; // Debug level used for whether to use print() in logDebug() function.

/**
 * Preloads image-based objects and background due to p5js's image-loading mechanism.
 */
function preload() {
  backgroundImage = loadImage("media/Background.png");
  instructionsImage = loadImage("media/Instructions.png")
  helpIcon = new HelpIcon(800 - 40, 0, 40, 40);

  gardeners.push(new Influencer(random(200, 600), random(200, 600) + yFix), new Influencer(random(200, 600), random(200, 600) + yFix));
  selectGardener(0, false);
  for (let i = 0, x = 100; i < 4; i++, x += 200) {
    for (let i = 0, y = 100; i < 4; i++, y += 200) {
      flowers.push(new Target(x, y + yFix));
    }
  }
}

/**
 * General global settings on p5js.
 */
function setup() {
  createCanvas(800, 1000); // The 800x200 top area is reserved for title display, while 800x800 is the exact play canvas.
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  noCursor();
}

function draw() {
  imageMode(CORNER);
  image(backgroundImage, 0, 0); // Shows LazyGarden background.
  imageMode(CENTER);

  // Flowers
  for (const flower of flowers) {
    flower.display();
  }
  // Gardeners
  for (const gardener of gardeners) {
    gardener.display();
  }
  // Click Indicators
  for (let i = 0; i < clickIndicators.length; i++) {
    let indicator = clickIndicators[i];
    if (indicator.timer <= 0) clickIndicators.splice(i, 1);
    else indicator.draw();
  }
  // Path indicators
  if (keyIsDown(16)) {
    for (const gardener of gardeners) {
      gardener.path.draw();
    }
  }
  // Text Bubbles
  for (let i = 0; i < textBubbles.length; i++) {
    let bubble = textBubbles[i];
    if (bubble.timer <= 0) textBubbles.splice(i, 1);
    else bubble.draw();
  }

  // Cheer-up Line Indicators
  cheering = false;
  for (const gardener of gardeners) {
    if (dist(gardener.x, gardener.y, mouseX, mouseY) < cheerUpRadius) {
      cheering = true;
      !keyIsDown(17) ? stroke(51, 105, 30) : stroke(255, 255, 0);
      strokeWeight(3);
      line(gardener.x, gardener.y, mouseX, mouseY)
    }
  }

  // Shows money
  textSize(20); noStroke(); fill(0); textAlign(LEFT, TOP);
  text("$" + money.toFixed(0), 10, 10);

  // HelpIcon and instructions image (when hovering)
  helpIcon.display();

  // The cursor should never be covered by any image, kept at the topmost.
  drawCursor();
}

/**
 * Related interaction:
 *  Cheer up - gives any gardener within a certain radius a temporary boost on speed and recovers their endurance.
 *  Publish waypoint commands - command selected gardener(s) to a certain location.
 * Both actions are incompatible, which means they can't be executed at the same time. Holding Ctrl can force-skip cheer-up check that you can make tiny movement adjustments.
 */
function mouseClicked() {
  if (!isLooping()) return;
  clickIndicators.push(new ClickIndicator(400));

  if (cheering && !keyIsDown(16) && !keyIsDown(17)) { // Cheering
    for (let gardener of gardeners) {
      if (dist(gardener.x, gardener.y, mouseX, mouseY) < cheerUpRadius) {
        // Uses linear interpolation to lerp the gardener's speed, which means the cheer has diminishing returns on speed boost.
        gardener.speed += max((4 - gardener.speed) * 0.15, 0.2);
        if (gardener.speed > 4) gardener.speed = 4;
        gardener.endurance = min(gardener.endurance + 1, gardener.enduranceLimit);
        // Showing text bubbles/indicators for interaction feedback.
        if (gardener.speed <= 3.5) {
          textBubbles.push(new TextBubble(cheerTexts[parseInt(random(cheerTexts.length))], gardener.x + random(-20, 20), gardener.y + random(-20, 20), 600));
        }
        else {
          textBubbles.push(new TextBubble("Am on fire!", gardener.x + random(-20, 20), gardener.y + random(-20, 20), 1000, [255, 0, 0]));
        }
      }
    }
  }
  else {
    for (const gardener of gardeners) {
      // If selected gardener does not have enough endurance, it will be unwilling to listen to your command.
      if (gardener.selected === false) continue;
      if (gardener.endurance / gardener.enduranceLimit < 0.2) {
        textBubbles.push(new TextBubble(tiredTexts[parseInt(random(tiredTexts.length))], gardener.x + random(-20, 20), gardener.y + random(-20, 20), 1000, [255, 255, 0]))
        continue;
      }
      // Because the movement system is inside Influencer and needs an instance and I am lazy to move them into a Util Class, here is a fake Influencer for waypoint coordinates.
      let waypoint = new Waypoint(mouseX, mouseY);
      Util.checkCollision(waypoint, 3, Util.getAngle(mouseX - gardener.x, gardener.y - mouseY));
      if (keyIsDown(16)) { // Holding shift - path mode (multiple waypoints)
        gardener.path.addPoint(waypoint.x, waypoint.y);
      }
      else {
        gardener.path.reset().addPoint(waypoint.x, waypoint.y);
      }
      print(gardener.path);
    }
  }
}

/**
 * Related interaction:
 *  State switch - pressing certain keys switches the selectedGardener (or all) to the corresponding state.
 */
function keyPressed() {
  if (keyCode === 81) updateGardeners("watering") // Pressing Q
  if (keyCode === 87) updateGardeners("weeding"); // Pressing W
  if (keyCode === 69) updateGardeners("harvesting"); // Pressing E
  if (keyCode === 82) updateGardeners("resting"); // Pressing R

  // ← → arrow keys for adjusting debug levels.
  if (keyCode === 39) {
    debugLevel += 1;
    logDebug("new debug level: " + debugLevel);
  } else if (keyCode === 37) {
    debugLevel = max(0, debugLevel - 1)
    logDebug("new debug level: " + debugLevel);
  }
}

/**
 * Related interaction:
 *  Gardener selection - Selects a specific gardener or all.
 * @param {*} event p5js embedded event. Used for direction check for the wheel scroll.
 */
function mouseWheel(event) {
  // Deselects selected gardener(s) first.
  if (selectedAllGardeners === true) {
    selectedAllGardeners = false;
    for (const selectedGardener of gardeners) {
      selectedGardener.selected = false;
      selectedGardener.resetGlowTimer(1000);
    }
  }
  else {
    selectedGardener.selected = false;
    selectedGardener.resetGlowTimer(1000);
  }

  // Gets the option/gardener index for gardener selection. The extra index is for all.
  let options = gardeners.length + 1;
  selectedGardenerIndex += options;
  // Scrolling up - select prev; Scrolling down - select next
  if (event.delta > 0) selectedGardenerIndex = (selectedGardenerIndex + 1) % options;
  else selectedGardenerIndex = (selectedGardenerIndex - 1) % options;
  // Selects all gardeners
  if (selectedGardenerIndex === options - 1) {
    selectedAllGardeners = true;
    for (let i = 0; i < gardeners.length; i++)
      selectGardener(i, true);
  }
  // Selects a specific one
  else selectGardener(selectedGardenerIndex, false);
}

/**
 * TBA
 */
function mouseMoved() {
  if (!isLooping()) {
    // Keep mouse redrawn when hovering on the HelpIcon.
    if (mouseInsideRect(helpIcon.x, helpIcon.y, helpIcon.w, helpIcon.h)) {
      redraw();
    }
    // Leaving HelpIcon when pausing.
    else if (pointInsideRect(pmouseX, pmouseY, helpIcon.x, helpIcon.y, helpIcon.w, helpIcon.h)) {
      pmouseX = mouseX;
      pmouseY = mouseY;
      // Mouse coordinates of the "previous" frame (which is the current stopped one) must be reset before loop() starts.
      // redraw() doesn't technically count as a new frame, so the previous mouse coordinates won't be refreshed by that.
      // And that's why resets are needed.
      loop();
      // Basically, Because the p5js native variable deltaTime uses timestamps of the last available frame and current one,
      // it is recalculated every time a new frame starts. So, it must be put after loop(), not before.
      deltaTime = 0;
    }
  }
}

/**
 * Draws an in-game cursor instead of showing the OS one.
 */
function drawCursor() {
  // Draws movement trail.
  // Previous mouse coordinates won't be updated if noLoop() even if you execute redraw() multiple times;
  if (isLooping()) {
    if (dist(pmouseX, pmouseY, mouseX, mouseY) < 40) {
      stroke(0);
      strokeWeight(2);
      fill(0, 70);
      circle(pmouseX, pmouseY, 10);
    }
    else {
      stroke(0, 70)
      strokeWeight(10);
      line(pmouseX, pmouseY, mouseX, mouseY);
    }
  }

  stroke(0);
  strokeWeight(2);
  !(keyIsDown(16) || keyIsDown(17)) ? fill(0, 255, 255) : fill(255, 0, 0);
  circle(mouseX, mouseY, 10);

  noFill();
}

/**
 * Updates state(s) of the gardener(s) to the specific one. 
 * This by default uses selectedGardener, but applies to all if selectedAllGardeners is true.
 * @param {*} state State the gardeners are updated to
 */
function updateGardeners(state) {
  // Can use array for loop and check the selected field so as to simplify the code (but less cost-efficient since it will loop every time.)
  if (selectedAllGardeners) {
    for (const selectedGardener of gardeners) selectedGardener.setState(state, true);
  }
  else selectedGardener.setState(state, true);
}

/**
 * Selects a gardener to be selectedGardener and turn on its selected field for some checks.
 * @param {*} index the index of the gardener in the gardeners array
 * @param {*} isAll Its existence doesn't matter. Just a simple logical presentation when an array for loop is used to select all gardeners.
 */
function selectGardener(index, isAll) {
  gardeners[index].selected = true;
  if (!isAll) selectedGardener = gardeners[index];
}

/**
 * Finds the index of the selectedGardener in the gardeners array.
 */
function findGardener() {
  let index = 0;
  for (const element of gardeners) {
    if (element === selectedGardener) {
      break;
    }
    index++;
  }
  return index;
}

// Functions to check if a point is under a button's coverage.
{
  // Pre-requisite: x, y as left top coordinates – rectMode(CORNER)
  function mouseInsideRect(x, y, w, h) {
    return pointInsideRect(mouseX, mouseY, x, y, w, h);
  }
  function pointInsideRect(pointX, pointY, x, y, w, h) {
    return pointX >= x && pointX <= x + w && pointY >= y && pointY <= y + h;
  }

  function mouseInsideTriangle(p1, p2, p3) {
    return insideTriangle(p1, p2, p3, [mouseX, mouseY]);
  }

  /**
   * Checks if a point is inside a triangle.
   * @param {*} p1 triangle's vertex
   * @param {*} p2 triangle's vertex
   * @param {*} p3 triangle's vertex
   * @param {*} p4 the point to check if is inside the triangle
   * @returns whether the points is inside the triangle
   */
  function insideTriangle(p1, p2, p3, p4) {
    let
      x1 = p1[0], y1 = p1[1],
      x2 = p2[0], y2 = p2[1],
      x3 = p3[0], y3 = p3[1],
      x = p4[0], y = p4[1],
      AT = calcTriangleArea(x1, y1, x2, y2, x3, y3),
      // The total area of the three triangles from the mouse position to every two of the three vertices of the triangle
      A1 = calcTriangleArea(x, y, x2, y2, x3, y3),
      A2 = calcTriangleArea(x1, y1, x, y, x3, y3),
      A3 = calcTriangleArea(x1, y1, x2, y2, x, y);
    // Rounds the areas to leave space for calculation error
    return (round(AT, 0) == round(A1 + A2 + A3, 0));
  }

  function calcTriangleArea(x1, y1, x2, y2, x3, y3) {
    return abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
  }

  // helper for writing color to array
  function writeColor(image, x, y, red, green, blue, alpha) {
    let index = (x + y * width) * 4;
    image.pixels[index] = red;
    image.pixels[index + 1] = green;
    image.pixels[index + 2] = blue;
    image.pixels[index + 3] = alpha;
  }
}

/**
 * Conditional print() function dependent on current and required debug levels.
 * @param {*} text Text to print
 * @param {*} level Required debug level
 * @param {*} isOnlyCurrent Whether to print debug message only when the two levels are exactly the same
 */
function logDebug(text, level = 0, isOnlyCurrent = false) {
  let worked = false;
  if (!isOnlyCurrent) {
    if (debugLevel >= level) worked = true;
  }
  else if (debugLevel == level) worked = true;
  if (worked) {
    if (level > 0) text = "*" + romanize(level) + "* " + text;
    print(text);
  }
}

function romanize(num) {
  if (isNaN(num))
    return NaN;
  var digits = String(+num).split(""),
    key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
      "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
      "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
    roman = "",
    i = 3;
  while (i--)
    roman = (key[+digits.pop() + (i * 10)] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}

// Polyfill for String.includes() function.
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}