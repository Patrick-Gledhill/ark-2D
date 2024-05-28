// function badPRNG(seed) {
//     return 
// }

window.onerror = function (err, src, lineno, colno) {
	alert(err + " " + lineno + ":" + colno);
}

function letterToNum(letter) {
	var uLetter = letter.toLowerCase();
	var num = 0;

	switch (uLetter) {
		case "0": num = 0; break;
		case "1": num = 100; break;
		case "2": num = 200; break;
		case "3": num = 300; break;
		case "4": num = 400; break;
		case "5": num = 500; break;
		case "6": num = 600; break;
		case "7": num = 700; break;
		case "8": num = 800; break;
		case "9": num = 900; break;

		case "a": num = 1; break;
		case "b": num = 2; break;
		case "c": num = 3; break;
		case "d": num = 4; break;
		case "e": num = 5; break;
		case "f": num = 6; break;
		case "g": num = 7; break;
		case "h": num = 8; break;
		case "i": num = 9; break;
		case "j": num = 10; break;
		case "k": num = 11; break;
		case "l": num = 12; break;
		case "m": num = 13; break;
		case "n": num = 14; break;
		case "o": num = 15; break;
		case "p": num = 16; break;
		case "q": num = 17; break;
		case "r": num = 18; break;
		case "s": num = 19; break;
		case "t": num = 20; break;
		case "u": num = 21; break;
		case "v": num = 22; break;
		case "w": num = 23; break;
		case "x": num = 24; break;
		case "y": num = 25; break;
		case "z": num = 26; break;
	}

	return num;
}

/**
 * @type { HTMLCanvasElement }
 */
var scene = document.getElementById("scene");
var ctx = scene.getContext("2d");

var vWidth = window.innerWidth;
var vHeight = window.innerHeight;

var updateIdx = 999;
var tFps = 60;

var keysDown = [];

var paused = true;

var mouse = {
	prevX: 0,
	prevY: 0,
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	down: false,
	rightdown: false
}

function resizeCanvas() {
	vWidth = window.innerWidth;
	vHeight = window.innerHeight;
	scene.width = vWidth * window.devicePixelRatio;
	scene.height = vHeight * window.devicePixelRatio;
}

resizeCanvas();

var openedMenuHierarchy = [
	["host-ark-menu", "flex"],
	["join-ark-menu", "flex"],
	["nothing-opened", "none"],
	["main-menu", "flex"],
	["start-game-menu", "flex"],
	["open-game-start-menu", "flex"]
];

function updateMenuDisplay() {
	for (var i = 0; i < openedMenuHierarchy.length; i++) {
		var cMenu = openedMenuHierarchy[i];

		if (cMenu[0] === "nothing-opened") {
			continue;
		}

		if (i === openedMenuHierarchy.length - 1) {
			// document.getElementById(cMenu[0]).style.display = cMenu[1];
			document.getElementById(cMenu[0]).style.display = cMenu[1];
			// document.getElementById(cMenu[0]).style.opacity = 1;
		} else {
			// document.getElementById(cMenu[0]).style.display = "none";
			// document.getElementById(cMenu[0]).style.opacity = 0;
			document.getElementById(cMenu[0]).style.display = "none";
		}
	}
}

function openMenu(menuName) {
	// debugger;
	for (var i = 0; i < openedMenuHierarchy.length - 1; i++) {
		var cMenu = openedMenuHierarchy[i];

		if (cMenu[0] === menuName) {
			var nMenu = openedMenuHierarchy.splice(i, 1);
			openedMenuHierarchy.push(cMenu);
			break;
		}
	}

	updateMenuDisplay();
}

function closeTopMenu() {
	if (openedMenuHierarchy[openedMenuHierarchy.length - 1][0] === "nothing-opened") {
		return;
	}

	var wasOpened = openedMenuHierarchy.pop();
	openedMenuHierarchy.unshift(wasOpened);
	updateMenuDisplay();
}

function closeAllMenus() {
	while (openedMenuHierarchy[openedMenuHierarchy.length - 1][0] !== "nothing-opened") {
		closeTopMenu();
	}
}

updateMenuDisplay();

function wait(ms) {
	return new Promise((resolve) => { setTimeout(resolve, ms) });
}

function clamp(min, max, value) {
	return Math.min(Math.max(min, value), max);
}

function random(min, max) {
	return (Math.random() * (max - min)) + min;
}

var degToRad = Math.PI / 180;

var radToDeg = 180 / Math.PI;

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function lerpVec2(v1, v2, t) {
	return new Vec2(lerp(v1.x, v2.x, t), lerp(v1.y, v2.y, t));
}

function lerpVec3(v1, v2, t) {
	return new Vec3(lerp(v1.x, v2.x, t), lerp(v1.y, v2.y, t), lerp(v1.z, v2.z, t));
}

function snapNumberToGrid(number, gridSize) {
	return Math.round(number / gridSize) * gridSize;
}

function drawGrid(context, x, y, width, height, gridCellSize = 16, options = {}) {
	context.save();
	Object.assign(context, options);
	context.beginPath();

	if (typeof gridCellSize === "number") {
		for (var lx = x; lx <= x + width; lx += gridCellSize) {
			context.moveTo(lx, y);
			context.lineTo(lx, y + height);
		}

		for (var ly = y; ly <= y + height; ly += gridCellSize) {
			context.moveTo(x, ly);
			context.lineTo(x + width, ly);
		}
	} else if (typeof gridCellSize === "object") {
		for (var lx = x; lx <= x + width; lx += gridCellSize.x) {
			context.moveTo(lx, y);
			context.lineTo(lx, y + height);
		}

		for (var ly = y; ly <= y + height; ly += gridCellSize.y) {
			context.moveTo(x, ly);
			context.lineTo(x + width, ly);
		}
	}

	context.stroke();
	context.closePath();
	context.restore();
}

function distanceToPointFromLine(point, line, givePoint = false) {
	var x0 = point.x;
	var y0 = point.y;
	var x1 = line.pointA.position.x;
	var y1 = line.pointA.position.y;
	var x2 = line.pointB.position.x;
	var y2 = line.pointB.position.y;

	// Calculate coefficients of the line equation (Ax + By + C = 0)
	var A = y2 - y1;
	var B = x1 - x2;
	var C = x2 * y1 - x1 * y2;

	// Calculate the closest point on the line to the given point
	var xc = (B * (B * x0 - A * y0) - A * C) / (A * A + B * B);
	var yc = (A * (A * y0 - B * x0) - B * C) / (A * A + B * B);

	// Check if the closest point is within the line segment
	var d1 = Math.sqrt((xc - x1) ** 2 + (yc - y1) ** 2);
	var d2 = Math.sqrt((xc - x2) ** 2 + (yc - y2) ** 2);

	if (d1 <= Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) && d2 <= Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)) {
		// The closest point is within the line segment
		if (givePoint == true) {
			return {
				point: new Vec2(xc, yc),
				distance: Math.abs(A * x0 + B * y0 + C) / Math.sqrt(A ** 2 + B ** 2)
			}
		}
		return Math.abs(A * x0 + B * y0 + C) / Math.sqrt(A ** 2 + B ** 2);
	}

	// Calculate the distance from the point to the line segment endpoints
	var dPA = Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);
	var dPB = Math.sqrt((x0 - x2) ** 2 + (y0 - y2) ** 2);

	// Choose the minimum distance
	return Math.min(dPA, dPB);
}

function pointToCircleCollisionDetection(point, circle) {
	var dx = circle.position.x - point.position.x;
	var dy = circle.position.y - point.position.y;
	var sqDist = dx * dx + dy * dy;

	if (sqDist < circle.radius * circle.radius) {
		return true;
	}

	return false;
}

function pointToStaticCircleCollisionResolution(point, circle) {
	var col = pointToCircleCollisionDetection(point, circle);

	if (col) {
		var pointDir = Math.atan2(point.position.y - circle.position.y, point.position.x - circle.position.x);

		point.position.x = circle.position.x + Math.cos(pointDir) * circle.radius;
		point.position.y = circle.position.y + Math.sin(pointDir) * circle.radius;

		return true;
	}

	return false;
}

function pointToRectangleCollisionDetection(point, rect) {
	if (point.x > rect.position.x && point.y > rect.position.y && rect.position.x + rect.width > point.x && rect.position.y + rect.height > point.y) {
		return true;
	}

	return false;
}

function lineToLineCollisionDetection(lineA, lineB) {
	var x1 = lineA.pointA.position.x;
	var y1 = lineA.pointA.position.y;
	var x2 = lineA.pointB.position.x;
	var y2 = lineA.pointB.position.y;

	var x3 = lineB.pointA.position.x;
	var y3 = lineB.pointA.position.y;
	var x4 = lineB.pointB.position.x;
	var y4 = lineB.pointB.position.y;

	var uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
	var uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

	if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
		return true;
	}
	return false;
}

function lineToRectangleCollisionDetection(line, rect) {
	if (pointToRectangleCollisionDetection(line.pointA, rect) || pointToRectangleCollisionDetection(line.pointB, rect)) {
		return true;
	}

	var r1 = { pointA: { position: new Vec2(rect.position.x, rect.position.y) }, pointB: { position: new Vec2(rect.position.x, rect.position.y + rect.height) }};
	var r2 = { pointA: { position: new Vec2(rect.position.x + rect.width, rect.position.y) }, pointB: { position: new Vec2(rect.position.x + rect.width, rect.position.y + rect.height) }};
	var r3 = { pointA: { position: new Vec2(rect.position.x, rect.position.y) }, pointB: { position: new Vec2(rect.position.x + rect.width, rect.position.y) }};
	var r4 = { pointA: { position: new Vec2(rect.position.x, rect.position.y + rect.height) }, pointB: { position: new Vec2(rect.position.x + rect.width, rect.position.y + rect.height) }};

	var left = lineToLineCollisionDetection(line, r1);
	var right = lineToLineCollisionDetection(line, r2);
	var top = lineToLineCollisionDetection(line, r3);
	var bottom = lineToLineCollisionDetection(line, r4);

	if (left || right || top || bottom) {
		return true;
	}

	return false;
}

function rectangleToRectangleCollisionDetection(rect1, rect2) {
	if (rect1.position.x + rect1.width > rect2.position.x && rect1.position.y + rect1.height > rect2.position.y && rect2.position.x + rect2.width > rect1.position.x && rect2.position.y + rect2.height > rect1.position.y) {
		return true;
	}

	return false;
}

function rectangleToStaticRectangleCollisionResolution(rect, rectS) {
	if (rectangleToRectangleCollisionDetection(rect, rectS) == true) {
		var dx = (rect.position.x + rect.width / 2) - (rectS.position.x + rectS.width / 2);
		var dy = (rect.position.y + rect.height / 2) - (rectS.position.y + rectS.height / 2);

		if (Math.abs(dx / rectS.width) > Math.abs(dy / rectS.height)) {
			if (dx < 0) {
				rect.position.x = rectS.position.x - rect.width;
				return "l";
			} else {
				rect.position.x = rectS.position.x + rectS.width;
				return "r";
			}
		} else {
			if (dy < 0) {
				rect.position.y = rectS.position.y - rect.height;
				return "t";
			} else {
				rect.position.y = rectS.position.y + rectS.height;
				return "b";
			}
		}
	}

	return false;
}

class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	plusEquals(vector) {
		if (vector instanceof Vec2) {
			this.x += vector.x;
			this.y += vector.y;
			return;
		}

		this.x += vector;
		this.y += vector;
	}

	add(vector) {
		if (vector instanceof Vec2) {
			return new Vec2(this.x + vector.x, this.y + vector.y);
		}

		return new Vec2(this.x + vector, this.y + vector);
	}

	minusEquals(vector) {
		if (vector instanceof Vec2) {
			this.x -= vector.x;
			this.y -= vector.y;
			return;
		}

		this.x -= vector;
		this.y -= vector;
	}

	subtract(vector) {
		if (vector instanceof Vec2) {
			return new Vec2(this.x - vector.x, this.y - vector.y);
		}

		return new Vec2(this.x - vector, this.y - vector);
	}

	timesEquals(vector) {
		if (vector instanceof Vec2) {
			this.x *= vector.x;
			this.y *= vector.y;
			return;
		}

		this.x *= vector;
		this.y *= vector;
	}

	multiply(vector) {
		if (vector instanceof Vec2) {
			return new Vec2(this.x * vector.x, this.y * vector.y);
		}

		return new Vec2(this.x * vector, this.y * vector);
	}

	divideEquals(vector) {
		if (vector instanceof Vec2) {
			this.x /= vector.x;
			this.y /= vector.y;
			return;
		}

		this.x /= vector;
		this.y /= vector;
	}

	divide(vector) {
		if (vector instanceof Vec2) {
			return new Vec2(this.x / vector.x, this.y / vector.y);
		}

		return new Vec2(this.x / vector, this.y / vector);
	}

	dot(vector) {
		return (this.x * vector.x) + (this.y * vector.y);
	}

	length() {
		return Math.sqrt(this.dot(this));
	}

	normalized() {
		var mag = Math.sqrt(this.dot(this));
		return this.divide(mag);
	}

	direction() {
		return Math.atan2(this.y, this.x);
	}

	reflect(normal) {
		return this.subtract(normal.multiply(2 * this.dot(normal)));
	}
}

class Vec3 {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	plusEquals(vector) {
		if (vector instanceof Vec3) {
			this.x += vector.x;
			this.y += vector.y;
			this.z += vector.z;
			return;
		}

		this.x += vector;
		this.y += vector;
		this.z += vector;
	}

	add(vector) {
		if (vector instanceof Vec3) {
			return new Vec3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
		}

		return new Vec3(this.x + vector, this.y + vector, this.z + vector.z);
	}

	minusEquals(vector) {
		if (vector instanceof Vec3) {
			this.x -= vector.x;
			this.y -= vector.y;
			this.z -= vector.z;
			return;
		}

		this.x -= vector;
		this.y -= vector;
		this.z -= vector;
	}

	subtract(vector) {
		if (vector instanceof Vec3) {
			return new Vec3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
		}

		return new Vec3(this.x - vector, this.y - vector, this.z - vector);
	}

	timesEquals(vector) {
		if (vector instanceof Vec3) {
			this.x *= vector.x;
			this.y *= vector.y;
			this.z *= vector.z;
			return;
		}

		this.x *= vector;
		this.y *= vector;
		this.z *= vector;
	}

	multiply(vector) {
		if (vector instanceof Vec3) {
			return new Vec3(this.x * vector.x, this.y * vector.y, this.z * vector.z);
		}

		return new Vec3(this.x * vector, this.y * vector, this.z * vector);
	}

	divideEquals(vector) {
		if (vector instanceof Vec3) {
			this.x /= vector.x;
			this.y /= vector.y;
			this.z /= vector.z;
			return;
		}

		this.x /= vector;
		this.y /= vector;
		this.z /= vector;
	}

	divide(vector) {
		if (vector instanceof Vec3) {
			return new Vec3(this.x / vector.x, this.y / vector.y, this.z / vector.z);
		}

		return new Vec3(this.x / vector, this.y / vector, this.z / vector);
	}

	dot(vector) {
		return (this.x * vector.x) + (this.y * vector.y) + (this.z * vector.z);
	}

	length() {
		return Math.sqrt(this.dot(this));
	}

	normalized() {
		var mag = Math.sqrt(this.dot(this));
		return this.divide(mag);
	}

	// direction() {
	//     return Math.atan2(this.y, this.x);
	// }

	reflect(normal) {
		return this.subtract(normal.multiply(2 * this.dot(normal)));
	}
}

// class PerlinNoise {
//     constructor()
// }

class Camera {
	constructor(x, y, viewScale) {
		this.x = x;
		this.y = y;
		this.prevX = x;
		this.prevY = y;
		this.viewScale = viewScale;
		this.traX = 0;
		this.traY = 0;
	}

	applyToCtx(context, cWidth, cHeight) {
		context.scale(this.viewScale, this.viewScale);
		context.translate(-(this.x - (cWidth / (this.viewScale * 2))), -(this.y - (cHeight / (this.viewScale * 2))));

		this.traX = -(this.x - (cWidth / (this.viewScale * 2)));
		this.traY = -(this.y - (cHeight / (this.viewScale * 2)));

		return {
			x: -(this.x - (cWidth / (this.viewScale * 2))),
			y: -(this.y - (cHeight / (this.viewScale * 2)))
		};
	}

	applyToMouse(cWidth, cHeight, mouseX, mouseY) {
		var translatedMouse = { x: mouseX, y: mouseY };
		translatedMouse.x = (mouseX + (this.x * this.viewScale) - (cWidth / 2)) / this.viewScale;
		translatedMouse.y = (mouseY + (this.y * this.viewScale) - (cHeight / 2)) / this.viewScale;

		return translatedMouse;
	}
}

var camera = new Camera(0, 0, 1);

var soundList = {
	death_male: new Audio("./assets/ark_death_sound_male.mp3"),
	creation_music: new Audio("./assets/creation_music.mp3"),
	main_menu_music: new Audio("./assets/main_menu_music.mp3")
}

class SoundEmitter {
	constructor(audioObj = new Audio(""), startOffset, volume, repeatCount, speed, usePosition = true, x, y, radius) {
		this.canPlay = true;
		this.soundFile = audioObj;
		this.position = new Vec2(x, y);
		this.usePosition = usePosition;
		this.startOffset = startOffset;
		this.volume = volume;
		this.speed = speed;
		this.radius = radius;
		this.repeatCount = repeatCount;
		this.loop = true;
		this.listenerPosition = { x: 0, y: 0 };
		this.boundLoopOrNo = this.loopOrNo.bind(this);
		this.soundFile.addEventListener("ended", this.boundLoopOrNo, false);
	}

	loopOrNo() {
		if (this.loop == true) {
			this.play();
		}
	}

	play() {
		if (this.repeatCount > 0 && this.canPlay == true) {
			this.soundFile.volume = clamp(0, 1, this.volume / 100);
			this.soundFile.playbackRate = clamp(0, 16, this.speed);
			this.soundFile.currentTime = this.startOffset;
			this.soundFile.play();
			this.repeatCount--;
			return true;
		}

		return false;
	}

	stop() {
		this.soundFile.pause();
	}
}

class StaticBoxCollider {
	constructor(x, y, width, height) {
		this.position = new Vec2(x, y);
		this.width = width;
		this.height = height;
	}

	collide(object) {
		return rectangleToStaticRectangleCollisionResolution(object, this);
	}

	draw(context) {
		context.save();
		context.strokeStyle = "#ff0000";
		context.lineWidth = 2;
		context.strokeRect(this.position.x, this.position.y, this.width, this.height);
		context.restore();
	}
}

class StaticLineCollider {
	constructor(pointA, pointB) {
		this.pointA = pointA;
		this.pointB = pointB;
	}

	get center() {
		return lerpVec2(this.pointA.position, this.pointB.position, 0.5);
	}

	get slope() {
		return (this.pointB.position.y - this.pointA.position.y) / (this.pointB.position.x - this.pointA.position.x);
	}

	collide(object) {
		return lineToRectangleCollisionDetection(this, object);
	}
}

class DeathBarrier extends StaticBoxCollider {
	constructor(x, y, width, height, damageAmount, usePercent) {
		super(x, y, width, height);
		this.damageAmount = damageAmount;
		this.usePercent = usePercent;
	}

	collide(object) {
		if (object.stats.health) {
			if (rectangleToRectangleCollisionDetection(object, this) == true) {
				if (this.usePercent == true && object.stats.maxHealth) {
					object.stats.health -= object.stats.maxHealth * (this.damageAmount / 100);
				} else {
					object.stats.health -= this.damageAmount;
				}
			}
		}
	}
}

class FluidBox extends StaticBoxCollider {
	constructor(x, y, width, height, viscosity, color) {
		super(x, y, width, height);
		this.viscosity = viscosity;
		this.color = color;
	}

	collide(object) {
		if (pointToRectangleCollisionDetection(object.top, this)) {
			object.underWater = true;
		}

		if (pointToRectangleCollisionDetection(object.center, this)) {
			object.velocity.timesEquals(this.viscosity);
			object.inWater = true;
			object.trigWater();
		}

		if (pointToRectangleCollisionDetection(object.bottom, this)) {
			object.touchingWater = true;
		}
	}

	draw(context) {
		context.save();
		context.fillStyle = this.color;
		context.fillRect(this.position.x, this.position.y, this.width, this.height);
		context.restore();
	}
}

class GenericPoint {
	constructor(x, y) {
		this.position = new Vec2(x, y);
	}
}

class TerrainGenerator {
	constructor(originX, originY, numPoints, maxPointHeightVariance, width, minHeight, maxHeight, seaLevel) {
		this.origin = new Vec2(originX, originY);
		this.numPoints = numPoints;
		this.maxPointHeightVariance = maxPointHeightVariance;
		this.width = width;
		this.minHeight = minHeight;
		this.maxHeight = maxHeight;
		this.seaLevel = seaLevel;
		this.terrainPoints = [];
		this.terrainLines = [];
	}

	get height() {
		return this.maxHeight - this.minHeight;
	}

	generate() {
		if (this.numPoints < 2) {
			return;
		}

		// var lastPointHeight = 0;

		for (var i = 0; i < this.numPoints; i++) {
			var newPointX = (this.width * (i / (this.numPoints - 1))) - this.width / 2;

			// var result = perlinNoise2D(newPointX, 0);
			// var newPointX = (this.width * (i / (this.numPoints - 1))) - this.width / 2;
			// var newPointY = this.seaLevel + (lastPointHeight + this.maxPointHeightVariance * (random(-1, 1)));

			var newPointY = this.seaLevel;

			newPointY += noise.perlin2FBM(newPointX * 0.001, 0, 8, 0.5, 1, 2) * (this.height / 2);

			var newPoint = new GenericPoint(newPointX, newPointY);

			if (newPoint.position.y > this.maxHeight) {
				newPoint.position.y = this.maxHeight;
			}

			if (newPoint.position.y < this.minHeight) {
				newPoint.position.y = this.minHeight;
			}

			// lastPointHeight = newPoint.y;

			newPoint.position.plusEquals(this.origin);

			this.terrainPoints.push(newPoint);
		}

		for (var i = 0; i < this.terrainPoints.length - 1; i++) {
			// var centerY = lerp(this.terrainPoints[i].y, this.terrainPoints[i + 1].y, 0.5);

			// this.terrainPoints[i].y = lerp(this.terrainPoints[i].y, centerY, 0.8);
			// this.terrainPoints[i + 1].y = lerp(this.terrainPoints[i + 1].y, centerY, 0.2);

			this.terrainLines.push(new StaticLineCollider(this.terrainPoints[i], this.terrainPoints[i + 1]));
		}
	}

	draw(context) {
		if (this.terrainPoints.length > 1) {
			context.save();
			context.lineWidth = 2;
			context.strokeStyle = "#ff0000";
			context.beginPath();
			for (var i = 0; i < this.terrainPoints.length; i++) {
				if (i === 0) {
					context.moveTo(this.terrainPoints[i].position.x, this.terrainPoints[i].position.y);
				} else {
					context.lineTo(this.terrainPoints[i].position.x, this.terrainPoints[i].position.y);
				}
			}
			context.stroke();
			context.closePath();
			context.strokeStyle = "#ff8000";
			context.strokeRect(this.origin.x - this.width / 2, this.origin.y - (this.height / 2), this.width, this.height);
			context.restore();
		}
	}
}

class PointLight {
	/**
	 * @description A point light object that creates a simple light. 6-digit hex codes only!
	 */
	constructor(x, y, radius, color, intensity) {
		this.position = new Vec2(x, y);
		this.radius = radius;
		this.color = color;
		this.intensity = intensity;
	}

	draw(context) {
		context.save();
		context.globalAlpha = this.intensity;
		var lGrad = context.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, this.radius);
		lGrad.addColorStop(0, this.color);
		lGrad.addColorStop(1, this.color + "00");
		context.fillStyle = lGrad;

		// context.globalCompositeOperation = "multiply";
		// context.beginPath();
		// context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
		// context.fill();
		// context.closePath();

		context.globalCompositeOperation = "lighter";
		context.beginPath();
		context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
		context.fill();
		context.closePath();

		context.restore();
	}
}

var testTerrain = new TerrainGenerator(0, 0, 65, 32, 4096, -512, 512, 0);
testTerrain.generate();

var gravity = 0.35;
var objectFriction = 0.7;
var airFriction = 0.99;
var gravityDir = new Vec2(0, 1).normalized();


var baseStats = {
	player: {
		meleeDamage: 8,
		movementSpeed: 2,
		jump: 9
	}
};

class Player {
	constructor(x, y, width, height) {
		this.position = new Vec2(x, y);
		this.prevPos = new Vec2(x, y);
		this.velocity = new Vec2(0, 0);
		this.width = width;
		this.height = height;
		this.standingWidth = width;
		this.standingHeight = height;
		this.grounded = false;
		this.xp = 0;
		this.dead = false;
		this.sprinting = false;
		this.crouching = false;
		this.prone = false;
		this.crouchTime = 0;
		this.maxCrouchTime = 10;
		this.crouchDelay = 0;
		this.maxCrouchDelay = 20;
		this.underWater = false;
		this.touchingWater = false;
		this.inWater = false;
		this.deadScream = new SoundEmitter(soundList.death_male, 0.15, 100, 1, 1, true, this.position.x, this.position.y, 1024);
		this.stats = {
			maxHealth: 100,
			maxStamina: 100,
			maxOxygen: 100,
			maxFood: 100,
			maxWater: 100,
			maxWeight: 100,
			meleeDamage: 100,
			movementSpeed: 100,
			craftingSkill: 100,
			fortitude: 0,
			maxTorpidity: 200,
			// ----------------
			health: 100,
			stamina: 100,
			oxygen: 100,
			food: 100,
			water: 100,
			weight: 0,
			torpidity: 0
		}
	}

	get center() {
		return this.position.add(new Vec2(this.width / 2, this.height / 2));
	}

	get top() {
		return this.center.add(new Vec2(0, -this.height / 2));
	}

	get bottom() {
		return this.center.add(new Vec2(0, this.height / 2));
	}

	trigWater() {
		if (this.crouchTime <= 0) {
			this.crouchTime = this.maxCrouchTime;
			this.crouchDelay = this.maxCrouchDelay;
		}
	}

	update(staticObjects) {
		this.deadScream.position = this.position;

		if (this.stats.health <= 0) {
			this.deadScream.play();
			this.dead = true;
			this.stats.health = 0;
		}

		if (this.stats.health > this.stats.maxHealth) {
			this.stats.health = this.stats.maxHealth;
		}

		if (this.dead == true) {
			// do something
			this.velocity = new Vec2(0, 0);
			this.prevPos = this.position;
			return;
		}

		var speedMult = 1;
		var gravityMult = 1;

		if (this.crouchTime < 0) {
			this.crouchTime = 0;
		}

		if (this.crouchDelay < 0) {
			this.crouchDelay = 0;
		}

		if (keysDown["Shift"] == true && this.grounded == true && this.crouching == false && this.prone == false) {
			this.sprinting = true;
		} else {
			this.sprinting = false;
		}

		if (this.inWater) {
			speedMult = 0.1;
			gravityMult = 0.1;
			this.prone = false;
			this.crouching = false;
		} else if (this.grounded == false) {
			speedMult = 0.04;
		} else if (this.crouching) {
			speedMult = 0.4;
		} else if (this.prone) {
			speedMult = 0.2;
		} else if (this.sprinting) {
			speedMult = 2;
		}

		if (this.sprinting) {
			this.stats.stamina -= 0.5;
		}

		if (this.grounded == false && this.inWater == false) {
			if (keysDown["a"]) {
				this.velocity.x -= (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			if (keysDown["d"]) {
				this.velocity.x += (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			this.velocity.plusEquals(gravityDir.multiply(gravity * gravityMult));
			this.velocity.timesEquals(airFriction);
		} else if (this.grounded == false && this.inWater == true) {
			if (keysDown["a"]) {
				this.velocity.x -= (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			if (keysDown["d"]) {
				this.velocity.x += (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			if (keysDown[" "] || keysDown["w"]) {
				this.velocity.y -= (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			if (keysDown["s"]) {
				this.velocity.y += (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			this.velocity.plusEquals(gravityDir.multiply(gravity * gravityMult));
			this.velocity.timesEquals(airFriction);
		} else {
			if (keysDown["a"]) {
				this.velocity.x -= (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			if (keysDown["d"]) {
				this.velocity.x += (this.stats.movementSpeed / 100) * baseStats.player.movementSpeed * speedMult;
			}

			if (keysDown[" "] || keysDown["w"]) {
				if (!this.crouching && !this.prone) {
					this.velocity.y -= baseStats.player.jump;
				} else if (this.crouchTime <= 0 && this.crouchDelay <= 0) {
					this.crouching = false;
					this.prone = false;
					this.crouchTime = this.maxCrouchTime;
					this.crouchDelay = this.maxCrouchDelay;
				}
			}

			if (keysDown["s"] && this.crouchTime <= 0 && this.crouchDelay <= 0) {
				if (this.prone) {
					this.prone = false;
					this.crouchTime = this.maxCrouchTime;
					this.crouchDelay = this.maxCrouchDelay;
				} else if (this.crouching) {
					this.crouching = false;
					this.prone = true;
					this.crouchTime = this.maxCrouchTime;
					this.crouchDelay = this.maxCrouchDelay;
				} else {
					this.crouchTime = this.maxCrouchTime;
					this.crouchDelay = this.maxCrouchDelay;
					this.crouching = !this.crouching;
				}
			}
		}

		if (this.crouching == true) {
			if (this.crouchTime > 0) {
				// this.position.x -= (this.standingWidth * 0.2) / this.maxCrouchTime;
				this.position.y += (this.standingHeight * 0.6) / this.maxCrouchTime;
				this.width = lerp(this.standingWidth, this.standingWidth * 1.4, 1 - this.crouchTime / this.maxCrouchTime);
				this.height = lerp(this.standingHeight, this.standingHeight * 0.6, 1 - this.crouchTime / this.maxCrouchTime);
			}
		} else if (this.prone == true) {
			if (this.crouchTime > 0) {
				// this.position.x -= (this.standingHeight * 0.2) / this.maxCrouchTime;
				this.position.y += (this.standingWidth * 0.9) / this.maxCrouchTime;
				this.width = lerp(this.standingWidth * 1.4, this.standingHeight, 1 - this.crouchTime / this.maxCrouchTime);
				this.height = lerp(this.standingHeight * 0.6, this.standingWidth * 0.9, 1 - this.crouchTime / this.maxCrouchTime);
			}
		} else {
			if (this.crouchTime > 0) {
				// this.position.x += (this.standingHeight * 0.3) / this.maxCrouchTime;
				this.position.y -= (this.standingWidth * 0.1) / this.maxCrouchTime;
				this.width = lerp(this.width, this.standingWidth, 1 - this.crouchTime / this.maxCrouchTime);
				this.height = lerp(this.height, this.standingHeight, 1 - this.crouchTime / this.maxCrouchTime);
			}
		}

		var collisionSubsteps = /*clamp(1, 4096, */Math.ceil(Math.abs(this.velocity.x) + Math.abs(this.velocity.y) + 1) * 2;//);

		this.grounded = false;
		this.touchingWater = false;
		this.inWater = false;
		this.underWater = false;

		this.prevPos = this.position.add(0);
		for (var c = 0; c < collisionSubsteps; c++) {
			this.position.plusEquals(this.velocity.divide(collisionSubsteps));
		// this.position.plusEquals(this.velocity);
			for (var i = 0; i < staticObjects.length; i++) {
				var object = staticObjects[i];

				var col = object.collide(this);

				if (col) {
					if (object instanceof StaticBoxCollider) {
						if (col === "t") {
							this.grounded = true;

							if (this.velocity.y > 13) {
								this.stats.health -= (this.velocity.y - 8) * 4.5;
								this.stats.health -= this.velocity.x / 4;
							}

							this.velocity.y = 0;
							this.velocity.x *= objectFriction;
						}
					} else if (object instanceof FluidBox) {
					} else if (object instanceof StaticLineCollider) {
						if (lineToLineCollisionDetection(object, new StaticLineCollider(new GenericPoint(this.top.x, this.top.y), new GenericPoint(this.bottom.x, this.bottom.y))) == false) {
							continue;
						}

						this.grounded = true;

						if (this.velocity.y > 13) {
							this.stats.health -= (this.velocity.y - 8) * 4.5;
							this.stats.health -= this.velocity.x / 4;
						}

						this.velocity.y = 0;
						this.velocity.x *= objectFriction;

						// var dir = Math.sign(this.center.y - object.center.y);
						var dir = -1;

						if (Math.abs(object.slope) <= 1.75) {
							// while (object.collide(this) == true) {
								this.position.y += 0.9 * dir;
							// }
						} else {
							this.grounded = false;

							var slopeAngle = new Vec2(1, -object.slope).direction();
							var surfaceNormal = slopeAngle > 0 ? slopeAngle + 90 * degToRad : slopeAngle - 90 * degToRad;

							this.velocity.plusEquals(new Vec2(Math.cos(surfaceNormal) * 1, Math.sin(surfaceNormal) * 1));
						}


						var lineLengthX = Math.abs(object.pointB.position.x - object.pointA.position.x);
						var lineLengthY = Math.abs(object.pointB.position.y - object.pointA.position.y);
						var lineT = clamp(0, 1, Math.abs(this.bottom.x - object.pointA.position.x) / lineLengthX);

						this.position.y = (object.pointA.position.y + (object.slope * lineT)) - this.height;
					}
				}

				continue;
			}
		}

		if (this.crouchTime > 0) {
			this.crouchTime--;
		}

		if (this.crouchDelay > 0) {
			this.crouchDelay--;
		}
	}

	draw(context) {
		context.save();
		context.fillStyle = "#efefef";
		context.fillRect(this.position.x, this.position.y, this.width, this.height);
		context.restore();
	}
}

var lights = [
	new PointLight(0, 0, 256, "#ffffff", 0.5)
];

class WorldDaySettings {
	constructor(daySpeed) {
		this.daySpeed = daySpeed;
		this.currentTime = random(9, 11);
		// this.currentTime = 5.45;
		this.day = 1;
		this.bgStars = [];
	}

	setStars(x, y, width, height) {
		this.bgStars = [];
		for (var i = 0; i < 256; i++) {
			this.bgStars.push({ x: random(0, width), y: random(0, height), radius: random(0.5, 1) });
		}
	}

	getCurrentTime() {
		var dayHours = Math.trunc(this.currentTime);
		var dayMinutes = Math.floor((this.currentTime % 1) * 60);

		if (dayMinutes < 10) {
			dayMinutes = "0" + dayMinutes;
		}

		return dayHours + ":" + dayMinutes;
	}

	update() {
		this.currentTime += (((this.daySpeed / 60) / 60) / 2.5);

		if (this.currentTime >= 24) {
			this.currentTime = 0;
			this.day++;
		}
	}

	drawSky(context, x, y, width, height) {
		// ctx.fillStyle = "#80b3ff";
		var skyOpacity = 0.5;

		if (this.currentTime < 12) {
			if (this.currentTime > 5.6) {
				skyOpacity = 0.9 + ((this.currentTime - 5.6) / 5.6) * 0.1;
			} else if (this.currentTime >= 5.5) {
				skyOpacity = ((this.currentTime - 5.5) * 10) * 0.9;
			} else {
				skyOpacity = 0;
			}
		} else {
			if (this.currentTime < 18.4) {
				skyOpacity = 0.9 + (1 - ((this.currentTime - 12) / 6.4)) * 0.1;
			} else if (this.currentTime <= 18.5) {
				skyOpacity = (1 - ((this.currentTime - 18.4) * 10)) * 0.9;
			} else {
				skyOpacity = 0;
			}
		}

		// var skyColor = lerpVec3(new Vec3(0.1, 0.2, 0.4), lerpVec3(new Vec3(1, 0.3, 0), new Vec3(0.5, 0.7, 1), skyOpacity), clamp(0, 1, skyOpacity * 2));
		var skyColor = new Vec3(0.6, 0.8, 1);
		var sunriseColor = new Vec3(1, 0.2, 0);
		var nightColor = new Vec3(0.1, 0.4, 0.7);

		if (skyOpacity < 0.4) {
			skyColor = lerpVec3(nightColor, sunriseColor, skyOpacity / 0.4);
		} else {
			skyColor = lerpVec3(sunriseColor, skyColor, (skyOpacity - 0.4) / 0.6);
		}

		if (skyOpacity < 0.4) {
			context.save();
			context.globalCompositeOperation = "lighter";
			var starColor = lerpVec3(lerpVec3(skyColor, new Vec3(1, 1, 1), 0.75), new Vec3(0, 0, 0), skyOpacity / 0.4);
			context.fillStyle = "rgba(" + Math.ceil(starColor.x * 255) + ", " + Math.ceil(starColor.y * 255) + ", " + Math.ceil(starColor.z * 255) + ", " + clamp(0.1, 1, 1 - skyOpacity) + ")";
			for (var i = 0; i < this.bgStars.length; i++) {
				context.beginPath();
				context.arc(this.bgStars[i].x, this.bgStars[i].y, this.bgStars[i].radius, 0, 2 * Math.PI, false);
				context.fill();
				context.closePath();
			}
			context.restore();
		}

		context.fillStyle = "rgba(" + Math.ceil(skyColor.x * 255) + ", " + Math.ceil(skyColor.y * 255) + ", " + Math.ceil(skyColor.z * 255) + ", " + clamp(0.1, 1, skyOpacity) + ")";
		context.fillRect(x, y, width, height);
	}

	drawSkyOverlay(context, pCamera, width, height, gLights = []) {
		context.save();
		context.globalCompositeOperation = "multiply";
		// ctx.fillStyle = "#80b3ff";
		var skyOpacity = 0.5;

		if (this.currentTime < 12) {
			if (this.currentTime > 5.6) {
				skyOpacity = 0.9 + ((this.currentTime - 5.6) / 5.6) * 0.1;
			} else if (this.currentTime >= 5.5) {
				skyOpacity = ((this.currentTime - 5.5) * 10) * 0.9;
			} else {
				skyOpacity = 0;
			}
		} else {
			if (this.currentTime < 18.4) {
				skyOpacity = 0.9 + (1 - ((this.currentTime - 12) / 6.4)) * 0.1;
			} else if (this.currentTime <= 18.5) {
				skyOpacity = (1 - ((this.currentTime - 18.4) * 10)) * 0.9;
			} else {
				skyOpacity = 0;
			}
		}

		// var skyColor = lerpVec3(new Vec3(0.1, 0.2, 0.4), lerpVec3(new Vec3(1, 0.3, 0), new Vec3(0.5, 0.7, 1), skyOpacity), clamp(0, 1, skyOpacity * 2));
		var skyColor = new Vec3(0.5, 0.7, 1);
		var sunriseColor = new Vec3(1, 0.2, 0);
		var nightColor = new Vec3(0.1, 0.4, 0.7).multiply(0.1);

		if (skyOpacity < 0.4) {
			skyColor = lerpVec3(nightColor, sunriseColor, skyOpacity / 0.4);
		} else {
			skyColor = lerpVec3(sunriseColor, skyColor, (skyOpacity - 0.4) / 0.6);
		}

		var tempCnvs = document.createElement("canvas");
		var tempCtx = tempCnvs.getContext("2d");

		tempCnvs.width = width;
		tempCnvs.height = height;

		tempCtx.save();
		pCamera.applyToCtx(tempCtx, width, height);
		tempCtx.fillStyle = "rgba(" + Math.ceil(skyColor.x * 255) + ", " + Math.ceil(skyColor.y * 255) + ", " + Math.ceil(skyColor.z * 255) + ", " + clamp(0.1, 1, (1 - skyOpacity) * 0.8) + ")";
		tempCtx.fillRect(pCamera.x - (width / 2) / camera.viewScale, pCamera.y - (height / 2) / camera.viewScale, width / pCamera.viewScale, height / pCamera.viewScale);

		for (var i = 0; i < gLights.length; i++) {
			var light = gLights[i];

			if (light instanceof PointLight) {
				tempCtx.save();

				tempCtx.globalCompositeOperation = "destination-out";
				var lGrad = tempCtx.createRadialGradient(light.position.x, light.position.y, 0, light.position.x, light.position.y, light.radius);
				lGrad.addColorStop(0, "#000000");
				lGrad.addColorStop(1, "transparent");

				tempCtx.fillStyle = lGrad;
				tempCtx.beginPath();
				tempCtx.arc(light.position.x, light.position.y, light.radius, 0, 2 * Math.PI, false);
				tempCtx.fill();
				tempCtx.closePath();

				tempCtx.restore();
			}
		}

		tempCtx.restore();

		context.drawImage(tempCnvs, 0, 0);
		context.restore();
	}
}

var worldDaySettings = new WorldDaySettings(2.5);
worldDaySettings.setStars(0, 0, vWidth, vHeight);

var player = new Player(-32, -128, 64, 128);

var floor = new StaticBoxCollider(-2048, 0, 4096, 1024);

var water = new FluidBox(-2560, 0, 512, 512, 0.997, "#0080ff30");

function main() {
	if (player.position.y > 2048) {
		player.stats.health = 0;
	}

	if (paused == false) {
		if (camera.viewScale < 1) {
			camera.viewScale = 1;
		}

		if (camera.viewScale > 4) {
			camera.viewScale = 4;
		}

		var terrainInRange = [];

		for (var i = 0; i < testTerrain.terrainLines.length; i++) {
			var line = testTerrain.terrainLines[i];

			if (lineToRectangleCollisionDetection(line, { position: player.center.subtract(new Vec2(player.width, player.height)), width: player.width * 2, height: player.height * 2 })) {
				terrainInRange.push(line);
			}
		}

		terrainInRange.sort((a, b) => {
			return Math.random() - 0.5;
		});

		// floor.position.y += 10;

		player.update([floor, water, ...terrainInRange]);
		worldDaySettings.update();

		mouse.x += player.position.x - player.prevPos.x;
		mouse.y += player.position.y - player.prevPos.y;

		// alert(player.position.x);
		// alert(player.prevPos.x);

		var offsetCam = new Vec2(mouse.x - player.center.x, mouse.y - player.center.y).direction();
		var length = clamp(0, 64, new Vec2(mouse.x - player.center.x, mouse.y - player.center.y).length() / 4);

		camera.x = lerp(camera.x, player.center.x + Math.cos(offsetCam) * length, 0.2);
		camera.y = lerp(camera.y, player.center.y + Math.sin(offsetCam) * length, 0.2);

		// camera.x = player.position.x + player.width / 2;
		// camera.y = player.position.y + player.height / 2;

	}

	ctx.save();
	ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	ctx.lineWidth = 2;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.clearRect(0, 0, vWidth, vHeight);
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, vWidth, vHeight);
	worldDaySettings.drawSky(ctx, 0, 0, vWidth, vHeight);
	camera.applyToCtx(ctx, vWidth, vHeight);

	/*camera.x - (vWidth / 2) / camera.viewScale, camera.y - (vHeight / 2) / camera.viewScale, vWidth / camera.viewScale, vHeight / camera.viewScale*/
	player.draw(ctx);

	// ctx.save();
	// ctx.lineWidth = 1;
	// ctx.strokeStyle = "#000000";
	// ctx.beginPath();
	// ctx.moveTo(0, 0);
	// ctx.lineTo(mouse.x, mouse.y);
	// ctx.stroke();
	// ctx.closePath();

	// ctx.fillStyle = lineToRectangleCollisionDetection(new StaticLineCollider(new GenericPoint(0, 0), new GenericPoint(mouse.x, mouse.y)), new StaticBoxCollider(-64, -64, 32, 32)) ? "#ff0000" : "#00ff00";
	// ctx.fillRect(-64, -64, 32, 32);
	// ctx.restore();

	// ctx.beginPath();
	// ctx.moveTo(floor.position.x + floor.width / 2, floor.position.y + floor.height / 2);
	// ctx.lineTo(player.position.x + player.width / 2, player.position.y + player.height / 2);
	// ctx.stroke();
	// ctx.closePath();

	floor.draw(ctx);
	water.draw(ctx);

	testTerrain.draw(ctx);

	for (var i = 0; i < lights.length; i++) {
		var light = lights[i];

		light.draw(ctx);
	}

	ctx.restore();

	worldDaySettings.drawSkyOverlay(ctx, camera, vWidth, vHeight, lights);

	ctx.save();
	ctx.font = "16px arial";
	ctx.fillStyle = "#ffffff";
	ctx.textBaseline = "top";
	ctx.fillText("Player Health: " + player.stats.health + " Time of Day: " + worldDaySettings.getCurrentTime() + " Day: " + worldDaySettings.day, 8, 8);
	ctx.restore();

	mouse.vx = 0;
	mouse.vy = 0;
	mouse.prevX = mouse.x;
	mouse.prevY = mouse.y;
}

window.onload = function () {
	updateIdx = setInterval(main, 1000 / tFps);
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("wheel", (e) => {
	if (e.deltaY < 0) {
		camera.viewScale /= 0.96;
	} else {
		camera.viewScale *= 0.96;
	}
});

window.addEventListener("keydown", (e) => {
	keysDown[e.key] = true;
	// e.preventDefault();
});

window.addEventListener("keyup", (e) => {
	keysDown[e.key] = false;
});

window.addEventListener("contextmenu", (e) => {
	e.preventDefault();
});

window.addEventListener("mousedown", (e) => {
	if (e.button === 0) {
		mouse.down = true;
	}

	if (e.button === 2) {
		mouse.rightdown = true;
	}

	var mpx = mouse.x;
	var mpy = mouse.y;
	var mousePos = camera.applyToMouse(vWidth, vHeight, e.clientX, e.clientY);
	mouse.x = mousePos.x;
	mouse.y = mousePos.y;
	mouse.prevX = mpx;
	mouse.prevY = mpy;
});

window.addEventListener("mousemove", (e) => {
	var mpx = mouse.x;
	var mpy = mouse.y;
	var mousePos = camera.applyToMouse(vWidth, vHeight, e.clientX, e.clientY);
	mouse.x = mousePos.x;
	mouse.y = mousePos.y;
	mouse.vx = mouse.x - mpx;
	mouse.vy = mouse.y - mpy;
	mouse.prevX = mpx;
	mouse.prevY = mpy;
});

window.addEventListener("mouseup", () => {
	mouse.down = false;
	mouse.rightdown = false;
});

var closeStartMenu = document.getElementById("start-game-btn");

var playGameBtn = document.getElementById("play-host-ark-non-d-btn");

var openHostArkMenu = document.getElementById("open-host-ark-menu");
var closeHostArkMenu = document.getElementById("close-host-ark-menu");

var openStartGameBtn = document.getElementById("open-start-game-btn");

var joinArkBtn = document.getElementById("open-join-game-menu");

var closeJoinArkBtn = document.getElementById("close-join-ark-menu");

var mainMenuMusicE = new SoundEmitter(soundList.main_menu_music, 0.15, 100, Infinity, 1, false);
mainMenuMusicE.loop = true;

openStartGameBtn.onclick = function () {
	openMenu("start-game-menu");
	mainMenuMusicE.play();
}

closeStartMenu.onclick = function () {
	openMenu("main-menu");
}

openHostArkMenu.onclick = function () {
	openMenu("host-ark-menu");
}

closeHostArkMenu.onclick = function () {
	closeTopMenu();
}

playGameBtn.onclick = function () {
	closeAllMenus();
	document.getElementById("menu-background").style.display = "none";
	paused = false;
	mainMenuMusicE.stop();
}

joinArkBtn.onclick = function () {
	openMenu("join-ark-menu");
	reloadServerList();
}

closeJoinArkBtn.onclick = function () {
	closeTopMenu();
}

var serverBtnsData = [
	// [Server Name] [Map] [Num Players] [Max Players] [Ping] [Day] [Game Mode]
	["NA-PVP-Official-TheIsland-PostShutdown-ClassicPVP15", "TheIsland", 74, 70, Math.round(random(16, 192)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["TheIsland1125", "TheIsland", 65, 70, Math.round(random(16, 256)), Math.round(random(1, 128)), "PVP", "p_dedicated", false],
	// ["NA-PVP-Official-TheIsland888", "TheIsland", 63, 70, Math.round(random(16, 256)), Math.round(random(1, 128)), "PVP"],
	["ARK SEVERE!!! LOL!!!", "TheIsland", 60, 70, Math.round(random(16, 192)), Math.round(random(1, 128)), "PVP", "p_dedicated", false],
	// ["NA-PVP-Official-TheIsland35", "TheIsland", 50, 70, Math.round(random(16, 256)), Math.round(random(1, 128)), "PVP"],
	// ["NA-PVP-Official-TheIsland40", "TheIsland", 32, 70, Math.round(random(16, 256)), Math.round(random(1, 128)), "PVP"],
	// ["NA-PVP-Official-GenTwo956", "Gen2", 21, 70, Math.round(random(16, 256)), Math.round(random(1, 128)), "PVP"],
	["NA-PVP-Official-TheIsland-PostShutdown1", "TheIsland", 81, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-TheCenter-PostShutdown2", "TheCenter", 53, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Ragnarok-PostShutdown3", "Ragnarok", 67, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-LostIsland-PostShutdown4", "LostIsland", 31, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Fjordur-PostShutdown5", "Fjordur", 49, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Valguero-PostShutdown6", "Valguero_P", 51, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-CrystalIsles-PostShutdown7", "CrystalIsles", 18, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-ScorchedEarth-PostShutdown8", "ScorchedEarth_P", 12, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Aberration-PostShutdown9", "Aberration_P", 26, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Extinction-PostShutdown10", "Extinction", 27, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Genesis-PostShutdown11", "Genesis", 26, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-GenTwo-PostShutdown12", "Gen2", 21, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-TheIsland-PostShutdown-Beginners1", "TheIsland", 83, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-Ragnarok-PostShutdown-Beginners2", "Ragnarok", 63, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	["NA-PVP-Official-TheCenter-PostShutdown-Beginners3", "TheCenter", 43, 70, Math.round(random(16, 128)), Math.round(random(1, 128)), "PVP", "off_dedicated", false],
	// ["Poopy Patrick is a butt, that's why! LOL! Hosted by nitrado.net", "TheIsland", 91, 70, 255, 3, "PVP", "p_dedicated", false]


	["NA-PVE-Official-TheIsland-PostShutdown1", "TheIsland", 9, 70, Math.round(random(8, 128)), Math.round(random(1, 128)), "PVE", "off_dedicated", false],
	["NA-PVE-Official-TheCenter-PostShutdown2", "TheCenter", 8, 70, Math.round(random(8, 128)), Math.round(random(1, 128)), "PVE", "off_dedicated", false],
	["NA-PVE-Official-Ragnarok-PostShutdown3", "Ragnarok", 11, 70, Math.round(random(8, 128)), Math.round(random(1, 128)), "PVE", "off_dedicated", false]
];

var serverBtnsList = document.getElementById("join-list-button-container");

var serverNameFilter = document.getElementById("name-filter-servers");
var serverMapFilter = document.getElementById("map-filter-servers");
var serverGamemodeFilter = document.getElementById("gamemode-filter-servers");
var serverSortByFilter = document.getElementById("sort-filter-servers");
var refreshServerListBtn = document.getElementById("refresh-server-list");
var sessionTypeFilter = document.getElementById("session-type-filter");

function reloadServerList(firstTime) {
	serverBtnsList.innerHTML = "";

	// if (firstTime == true) {
	// 	await wait(1000);
	// }

	for (var i = 0; i < serverBtnsData.length; i++) {
		var serverBtnData = serverBtnsData[i];

		if (serverBtnData[7] !== sessionTypeFilter.value) {
			continue;
		}

		if (serverNameFilter.value !== "" && serverBtnData[0].toLowerCase().includes(serverNameFilter.value.toLowerCase()) == false) {
			continue;
		}

		if (serverMapFilter.value !== "All" && serverBtnData[1] !== serverMapFilter.value) {
			continue;
		}

		if (serverGamemodeFilter.value !== "All" && serverBtnData[6] !== serverGamemodeFilter.value) {
			continue;
		}

		// if (firstTime == true) {
		// 	await wait(Math.round(random(8, 256)));
		// }

		var serverBtn = document.createElement("button");
		serverBtn.classList.add("join-list-button");
		serverBtn.classList.add("yellow-outline-focus");
		serverBtn.dataset.isSelected = "false";

		serverBtn.innerHTML += `<div style="text-align: left; padding-left: 48px;"><p>${serverBtnData[0]}</p></div>`;
		serverBtn.innerHTML += `<div><p>${serverBtnData[1]}</p></div>`;
		serverBtn.innerHTML += `<div><p>${serverBtnData[2]} / ${serverBtnData[3]}</p></div>`;
		serverBtn.innerHTML += `<div><p>${serverBtnData[4]}</p></div>`;
		serverBtn.innerHTML += `<div><p>${serverBtnData[5]}</p></div>`;
		serverBtn.innerHTML += `<div><p>${serverBtnData[6]}</p></div>`;

		serverBtnsList.appendChild(serverBtn);
	}

	var serverBtns = [...document.getElementsByClassName("join-list-button")];

	serverBtns.forEach((btn) => {
		btn.onclick = function () {
			serverBtns.forEach((obtn) => {
				obtn.dataset.isSelected = false;
			});

			btn.dataset.isSelected = true;
		}
	});
}

var serverFilterAscDesc = 1;

function applyServerSortByFilter() {
	if (serverFilterAscDesc === 1) {
		if (serverSortByFilter.value === "Name") {
			serverBtnsData.sort((a, b) => {
				var repeatLength = a[0].length > b[0].length ? b[0].length : a[0].length;

				var comparingIdx = 0;

				for (var i = 0; i < repeatLength; i++) {
					if (a[0].toLowerCase().charAt(comparingIdx) !== b[0].toLowerCase().charAt(comparingIdx)) {
						break;
					}

					comparingIdx++;
				}

				return letterToNum(a[0].charAt(comparingIdx)) - letterToNum(b[0].charAt(comparingIdx));
			});
		} else if (serverSortByFilter.value === "Players") {
			serverBtnsData.sort((a, b) => {
				return b[2] - a[2];
			});
		} else if (serverSortByFilter.value === "Ping") {
			serverBtnsData.sort((a, b) => {
				return b[4] - a[4];
			});
		} else if (serverSortByFilter.value === "Day") {
			serverBtnsData.sort((a, b) => {
				return b[5] - a[5];
			});
		}

		reloadServerList();
	} else {
		if (serverSortByFilter.value === "Name") {
			serverBtnsData.sort((a, b) => {
				var repeatLength = a[0].length > b[0].length ? b[0].length : a[0].length;

				var comparingIdx = 0;

				for (var i = 0; i < repeatLength; i++) {
					if (a[0].toLowerCase().charAt(comparingIdx) !== b[0].toLowerCase().charAt(comparingIdx)) {
						break;
					}

					comparingIdx++;
				}

				return letterToNum(b[0].charAt(comparingIdx)) - letterToNum(a[0].charAt(comparingIdx));
			});
		} else if (serverSortByFilter.value === "Players") {
			serverBtnsData.sort((a, b) => {
				return a[2] - b[2];
			});
		} else if (serverSortByFilter.value === "Ping") {
			serverBtnsData.sort((a, b) => {
				return a[4] - b[4];
			});
		} else if (serverSortByFilter.value === "Day") {
			serverBtnsData.sort((a, b) => {
				return a[5] - b[5];
			});
		}

		reloadServerList();
	}
}

var sortAscDescServersBtn = document.getElementById("sort-asc-desc-servers");

sortAscDescServersBtn.onclick = function () {
	if (serverFilterAscDesc === 1) {
		serverFilterAscDesc = -1;
	} else {
		serverFilterAscDesc = 1;
	}

	applyServerSortByFilter();
}

sessionTypeFilter.oninput = function () {
	reloadServerList();
}

refreshServerListBtn.onclick = function () {
	reloadServerList();
}

serverNameFilter.oninput = function () {
	reloadServerList();
}

serverMapFilter.oninput = function () {
	reloadServerList();
}

serverGamemodeFilter.oninput = function () {
	reloadServerList();
}

serverSortByFilter.oninput = function () {
	applyServerSortByFilter();
}

var mapButtonsList = [...document.getElementsByClassName("ark-map-btn")];

mapButtonsList.forEach((btn) => {
	btn.onclick = function () {
		mapButtonsList.forEach((obtn) => {
			obtn.dataset.isSelected = false;
		});

		btn.dataset.isSelected = true;
	}
});
