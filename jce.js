'use strict';
if (!_forEach)
	var _forEach = function (arr, iteration) {

		for (var i = 0; i < arr.length; i += 1) {
			iteration(arr[i], i, arr);
		}
	};

if (!_map)
	var _map = function (arr, iteration) {

		var results = [];

		_forEach(arr, function (x, i, a) {
			results.push(iteration(x, i, a));
		});

		return results;
	};



var jes_c = {};

(function () {
	// 1st type class
	var ChildManager = class ChildManager {
		constructor() {
			this.children = []
		}

		/**
		 * Adds the child to the children list
		 * @param   {Object}   child to add
		 * @returns {Object} allows cascading
		 */
		addChild(child) {

			child.parent = this;

			this.children.push(child);

			return this;
		}

		/**
		 * Swaps the children indexes
		 * @param {Object} child  first child selected
		 * @param {Object} child2 second child selected
		 */
		swapChildren(child, child2) {

			var index1 = this.getChildIndex(child);
			var index2 = this.getChildIndex(child2);

			if (index1 < 0 || index2 < 0) {
				throw new Error('swapChildren: Both the supplied Objects must be a child of the caller.');
			}

			this.children[index1] = child2;
			this.children[index2] = child;
		}

		/**
		 * Returns the selected child index
		 * @param   {Object} child selected child
		 * @returns {Number} child index
		 */
		getChildIndex(child) {

			var index = this.children.indexOf(child);
			if (index === -1) {
				throw new Error('The supplied Object must be a child of the caller');
			}
			return index;
		}

		/**
		 * Returns the child at the given index
		 * @param   {Number} index
		 * @returns {Object} child at index
		 */
		getChildAtIndex(index) {

			if (index < 0 || index >= this.children.length) {
				throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied Object must be a child of the caller');
			}
			return this.children[index];
		}

		/**
		 * Removes the supplied child from the child list
		 * @param   {Object} child child to remove
		 * @returns {Object} child removed
		 */
		removeChild(child) {

			this.children.splice(this.getChildIndex(child), 1);
			return child;
		}

		/**
		 * Removes the child at the supplied index
		 * @param   {Number} index child's index being removed
		 * @returns {Object} child removed
		 */
		removeChildAtIndex(index) {

			//var child = this.getChildAt( index );
			//child.parent = undefined;

			this.children.splice(index, 1);
			return this.getChildAt(index);
		}

		/**
		 * Raises the supplied child index by a given number
		 * @param {Object} child child whose index will be raised
		 * @param {Number} index number of index raised
		 */
		raiseChildIndex(child, index) {

			while (index--) {

				if (this.getChildIndex(child) > this.children.length - 2) return;

				// swapping the supplied child and the child above it
				this.swapChildren(child, this.getChildAtIndex(this.getChildIndex(child) + 1));
			}
		}

		/**
		 * Lowers the supplied child index by a given number
		 * @param {Object} child child whose index will be lowered
		 * @param {Number} index number of index lowered
		 */
		lowerChildIndex(child, index) {

			while (index--) {

				if (this.getChildIndex(child) <= 0) return;

				// swapping the supplied child and the child under it
				this.swapChildren(child, this.getChildAtIndex(this.getChildIndex(child) - 1));
			}
		}
	};

	// type: renderer - class
	jes_c.Renderer = class Renderer {
		constructor(res) {

			this.canvas = document.createElement('canvas');
			this.context = this.canvas.getContext('2d');

			// disable right click context menu
			this.canvas.oncontextmenu = function () {
				return false;
			};

			this.resolution = res;

			document.body.appendChild(this.canvas);
		}

		get resolution() {

			return {
				width: this.canvas.width,
				height: this.canvas.height
			};
		}

		set resolution(res) {

			this.canvas.width = res.width || window.innerWidth;
			this.canvas.height = res.height || window.innerHeight;
		}

		/**
		 * Clear the entire context
		 */
		clear() {

			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	};

	jes_c.Cache = class Cache {
		constructor(res) {
			this.canvas = document.createElement('canvas');
			this.context = this.canvas.getContext('2d');

			// disable right click context menu
			this.canvas.oncontextmenu = function () {
				return false;
			};

			this.resolution = res;

			this.display(false);

			document.body.appendChild(this.canvas);

			this.children = [];
		}

		get resolution() {

			return {
				width: this.canvas.width,
				height: this.canvas.height
			};
		}

		set resolution(res) {

			this.canvas.width = res.width || window.innerWidth;
			this.canvas.height = res.height || window.innerHeight;
		}

		display(bool) {

			if (bool)
				this.canvas.style.display = 'inline-block'
			else
				this.canvas.style.display = 'none'
		}

		/**
		 * Clear the entire context
		 */
		clear() {

			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}

		addChild(child) {

			this.children.push(child);
		}

		_getImageData(child) {

			return this.context.getImageData(child.position.x, child.position.y, child.width, child.height);;
		}

		render() {

			var self = this;
			_forEach(this.children, function (c) {
				c.render(self);;
			});
		}
	};

	// type: game instance - class
	jes_c.GameInstance = class GameInstance {
		/**
		 * Creates a GameInstance object
		 * @param {Object} resolution renderer's resolution
		 */
		constructor(resolution) {

			this.tileSize = 64;

			this.renderer = new jes_c.Renderer(resolution);

			this.cache = new jes_c.Cache(resolution);

			this.interns = {

				oldFrame: Date.now(),
				currentFrame: Date.now(),
				stepFrame: null
			};

			this._builder = null;
			this._core = null;

			this.delta = 0;

			this.children = [];

			console.log('A %cGame Instance%c of %cjes.js for canvas%c has been created;',
				'color: red',
				'color: black',
				'color: red',
				'color: black');
		}

		/**
		 * Defines the different constructors (states) of the GameInstance
		 * @param   {String} which       supply which constructor is being defined
		 * @param   {Function} constructor function
		 * @returns {Object} allows cascading
		 */
		defineManager(which, constructor) {

			if (!which || !constructor) return;

			if (which === 'builder') {

				this._builder = new constructor;
				console.log('%c_builder%c defined.',
					'color: red',
					'color: black');
			} else if (which === 'core') {

				this._core = new constructor;
				console.log('%c_core%c defined.',
					'color: red',
					'color: black');
			}

			return this;
		}

		/**
		 * Updates the internal delta_time of the GameInstance
		 */
		updateDelta() {

			this.interns.stepFrame = this.interns.oldFrame;
			this.interns.oldFrame = Date.now();

			this.delta = (this.interns.oldFrame - this.interns.stepFrame) / 1000;
		}

		/**
		 * Enables scene rendering
		 * @param {Object} renderer renderer used for the rendering process
		 */
		render(renderer, camera) {

			this.renderer.clear();

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {

				this.children[a].render(renderer, camera);
			}
		}

		renderBoundingBox(renderer, camera) {

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {

				this.children[a].renderBoundingBox(renderer, camera);
			}
		}

		renderCache(cache) {

			this.cache.clear();

			this.cache.render(this.cache);
		}

		applyGravity(multi) {

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {

				this.children[a].applyGravity(multi);
			}
		}

		updatePosition(_d) {

			if (!_d) _d = 1
			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {

				this.children[a].updatePosition(_d);
			}
		}

		/**
		 * ----- WIP
		 * @param {String} perspective game perspective type ('sidescroller', 'topdown')
		 */
		build(perspective) {

			if (perspective === ('sidescroller' || 'z' || 'Z')) {

				console.log('Building game...\nPerspective: Z - sidescroller');

				jes_c.Rectangle = jes_c.Rectangle_sidescroller;
			}
		}

		/**
		 * Adds the child to the children list
		 * @param   {Object}   child to add
		 * @returns {Object} allows cascading
		 */
		addChild(child) {

			child.parent = this;

			this.children.push(child);

			return this;
		}

		/**
		 * Swaps the children indexes
		 * @param {Object} child  first child selected
		 * @param {Object} child2 second child selected
		 */
		swapChildren(child, child2) {

			var index1 = this.getChildIndex(child);
			var index2 = this.getChildIndex(child2);

			if (index1 < 0 || index2 < 0) {
				throw new Error('swapChildren: Both the supplied Objects must be a child of the caller.');
			}

			this.children[index1] = child2;
			this.children[index2] = child;
		}

		/**
		 * Returns the selected child index
		 * @param   {Object} child selected child
		 * @returns {Number} child index
		 */
		getChildIndex(child) {

			var index = this.children.indexOf(child);
			if (index === -1) {
				throw new Error('The supplied Object must be a child of the caller');
			}
			return index;
		}

		/**
		 * Returns the child at the given index
		 * @param   {Number} index
		 * @returns {Object} child at index
		 */
		getChildAtIndex(index) {

			if (index < 0 || index >= this.children.length) {
				throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied Object must be a child of the caller');
			}
			return this.children[index];
		}

		/**
		 * Removes the supplied child from the child list
		 * @param   {Object} child child to remove
		 * @returns {Object} child removed
		 */
		removeChild(child) {

			this.children.splice(this.getChildIndex(child), 1);
			return child;
		}

		/**
		 * Removes the child at the supplied index
		 * @param   {Number} index child's index being removed
		 * @returns {Object} child removed
		 */
		removeChildAtIndex(index) {

			//var child = this.getChildAt( index );
			//child.parent = undefined;

			this.children.splice(index, 1);
			return this.getChildAt(index);
		}

		/**
		 * Raises the supplied child index by a given number
		 * @param {Object} child child whose index will be raised
		 * @param {Number} index number of index raised
		 */
		raiseChildIndex(child, index) {

			while (index--) {

				if (this.getChildIndex(child) > this.children.length - 2) return;

				// swapping the supplied child and the child above it
				this.swapChildren(child, this.getChildAtIndex(this.getChildIndex(child) + 1));
			}
		}

		/**
		 * Lowers the supplied child index by a given number
		 * @param {Object} child child whose index will be lowered
		 * @param {Number} index number of index lowered
		 */
		lowerChildIndex(child, index) {

			while (index--) {

				if (this.getChildIndex(child) <= 0) return;

				// swapping the supplied child and the child under it
				this.swapChildren(child, this.getChildAtIndex(this.getChildIndex(child) - 1));
			}
		}
	};

	// type: child container - class
	jes_c.ChildContainer = class ChildContainer {
		constructor(option) {

			this.children = [];

			this.gravity = option.gravity || false;
		}

		render(renderer, camera) {

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {
				this.children[a].render(renderer, camera);
			}
		}

		renderBoundingBox(renderer, camera) {

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {
				this.children[a].renderBoundingBox(renderer, camera);
			}
		}

		applyGravity(multi) {

			if (!this.gravity) return;

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {

				this.children[a].applyGravity(multi);
			}
		}

		applyCollision(bodies) {

			if (!bodies) return

			var a = this.children.length
			while (a--) {

				this.children[a].applyCollision(bodies);
			}
		}

		updatePosition(_d) {

			var a = 0;
			for (a; a <= this.children.length - 1; a += 1) {

				this.children[a].updatePosition(_d);
			}
		}

		/**
		 * Adds the child to the children list
		 * @param   {Object}   child to add
		 * @returns {Object} allows cascading
		 */
		addChild(child) {

			child.parent = this;

			this.children.push(child);

			return this;
		}

		/**
		 * Swaps the children indexes
		 * @param {Object} child  first child selected
		 * @param {Object} child2 second child selected
		 */
		swapChildren(child, child2) {

			var index1 = this.getChildIndex(child);
			var index2 = this.getChildIndex(child2);

			if (index1 < 0 || index2 < 0) {
				throw new Error('swapChildren: Both the supplied Objects must be a child of the caller.');
			}

			this.children[index1] = child2;
			this.children[index2] = child;
		}

		/**
		 * Returns the selected child index
		 * @param   {Object} child selected child
		 * @returns {Number} child index
		 */
		getChildIndex(child) {

			var index = this.children.indexOf(child);
			if (index === -1) {
				throw new Error('The supplied Object must be a child of the caller');
			}
			return index;
		}

		/**
		 * Returns the child at the given index
		 * @param   {Number} index
		 * @returns {Object} child at index
		 */
		getChildAtIndex(index) {

			if (index < 0 || index >= this.children.length) {
				throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied Object must be a child of the caller');
			}
			return this.children[index];
		}

		/**
		 * Removes the supplied child from the child list
		 * @param   {Object} child child to remove
		 * @returns {Object} child removed
		 */
		removeChild(child) {

			this.children.splice(this.getChildIndex(child), 1);
			return child;
		}

		/**
		 * Removes the child at the supplied index
		 * @param   {Number} index child's index being removed
		 * @returns {Object} child removed
		 */
		removeChildAtIndex(index) {

			//var child = this.getChildAt( index );
			//child.parent = undefined;

			this.children.splice(index, 1);
			return this.getChildAt(index);
		}

		/**
		 * Raises the supplied child index by a given number
		 * @param {Object} child child whose index will be raised
		 * @param {Number} index number of index raised
		 */
		raiseChildIndex(child, index) {

			while (index--) {

				if (this.getChildIndex(child) > this.children.length - 2) return;

				// swapping the supplied child and the child above it
				this.swapChildren(child, this.getChildAtIndex(this.getChildIndex(child) + 1));
			}
		}

		/**
		 * Lowers the supplied child index by a given number
		 * @param {Object} child child whose index will be lowered
		 * @param {Number} index number of index lowered
		 */
		lowerChildIndex(child, index) {

			while (index--) {

				if (this.getChildIndex(child) <= 0) return;

				// swapping the supplied child and the child under it
				this.swapChildren(child, this.getChildAtIndex(this.getChildIndex(child) - 1));
			}
		}
	};

	// type: rendering objects - class
	jes_c.Texture = class Texture {
		constructor(option) {

			if (option.src) {

				this.img = new Image();
				this.img.src = option.src;
			}

			this.width = option.width;
			this.height = option.height;

			this.position = {
				x: option.x || 0,
				y: option.y || 0
			};

			this.hit = {

				up: false,
				right: false,
				down: false,
				left: false
			}

			this.box = option.box || {
				width: this.width,
				height: this.height
			};

			this.color = option.color;

			this.velocity = option.velocity || new jes_c.Vector2(0, 0);

			this.gravity = option.gravity || false;

			this.collide = option.collide || false;
		}

		updateMovement() {

			if (this.velocity.x > 0 && this.hit.right)
				this.velocity.x = 0

			if (this.velocity.x < 0 && this.hit.left)
				this.velocity.x = 0

			if (this.velocity.y > 0 && this.hit.down)
				this.velocity.y = 0

			if (this.velocity.y < 0 && this.hit.up)
				this.velocity.y = 0
		}

		updatePosition(_d) {

			this.position.x += this.velocity.x * _d;
			this.position.y += this.velocity.y * _d;
		}

		applyGravity(multi) {

			if (!this.gravity) return;
			this.velocity.y += (Math.abs(this.velocity.y * 0.06) + 10) * multi;
		}

		applyCollision(bodies) {

			this.hit.up = false;
			this.hit.down = false;
			this.hit.left = false;
			this.hit.right = false;

			var a = bodies.length;
			while (a--) {

				if (bodies[a].collide) {

					var b = bodies[a]
					if (this.boundingBox(b)) {

						this.collisionResponse(b)
					}
				}

			}
		}

		boundingBox(obj) {

			if (this.position.x + this.box.width / 2 >= obj.position.x - obj.box.width / 2 &&
				this.position.x - this.box.width / 2 <= obj.position.x + obj.box.width / 2 &&
				this.position.y + this.box.height / 2 >= obj.position.y - obj.box.height / 2 &&
				this.position.y - this.box.height / 2 <= obj.position.y + obj.box.height / 2) {

				return true
			} else {
				return false
			}
		}

		collisionResponse(obj) {

			// default collision handling function
			var dx = this.position.x - obj.position.x,
				dy = this.position.y - obj.position.y,
				_m = Math.abs;

			if (_m(dx) > _m(dy)) {

				if (this.velocity.x > 0) {

					this.position.x = obj.position.x - obj.box.width / 2 - this.box.width / 2 - 1;
					this.hit.right = true;
				} else if (this.velocity.x < 0) {

					this.position.x = obj.position.x + obj.box.width / 2 + this.box.width / 2 + 1;
					this.hit.left = true;
				}

				this.velocity.x = 0;
			} else {

				if (this.velocity.y > 0) {

					this.position.y = obj.position.y - obj.box.height / 2 - this.box.height / 2 - 1;
					this.hit.down = true;
				} else if (this.velocity.y < 0) {

					this.position.y = obj.position.y + obj.box.height / 2 + this.box.height / 2 + 1;
					this.hit.up = true;
				}
			}
		}

		render(renderer) {

			renderer.context.fillStyle = this.color || '#000000';
			renderer.context.drawImage(this.img, this.position.x - this.width / 2 - camera.position.x, this.position.y - this.height / 2 - camera.position.y, this.width, this.height);
		}

		renderBoundingBox(renderer, camera) {

			renderer.context.strokeStyle = '#409640';
			renderer.context.strokeRect(this.position.x - this.box.width / 2 - camera.position.x, this.position.y - this.box.height / 2 - camera.position.y, this.box.width, this.box.height);
		}
	};

	jes_c.Rectangle = class Rectangle extends jes_c.Texture {
		render(renderer, camera) {

			renderer.context.fillStyle = this.color || '#000000';
			renderer.context.fillRect(this.position.x - this.width / 2 - camera.position.x, this.position.y - this.height / 2 - camera.position.y, this.width, this.height);
		}
	};
	jes_c.Rectangle_sidescroller = class Rectangle_sidescroller extends jes_c.Rectangle {};

	jes_c.DataObject = class DataObject extends jes_c.Texture {
		constructor(imageData, option) {

			if (!imageData) return;

			this.position = {
				x: option.x || 0,
				y: option.y || 0
			};

			this.imageData = imageData;

			this.velocity = option.velocity || new jes_c.Vector2(0, 0);
		}

		render(renderer) {

			renderer.context.putImageData(this.imageData, this.position.x, this.position.y);
		}
	};

	// type: child pool - class
	jes_c.ChildPool = class ChildPool {
		constructor(size) {

			this.children = [];

			this.size = size || 500;

			this.lastChildExtracted = null;

			return this;
		}

		fill(process) {

			if (!process) return;

			var a = this.size - this.children.length;
			while (a--) {

				process(this.children);
			}
		}

		extract(callback) {

			if (this.children.length <= 0) return false;

			this.lastChildExtracted = this.children.shift();

			if (callback) callback(this.lastChildExtracted);

			return this.lastChildExtracted;
		}

		insert(obj, arrParent) {

			if (this.children.length >= this.size) return null;

			if (arrParent) {

				var index = arrParent.indexOf(obj);
				if (index < 0) throw new Error('The supplied Object must be a child of the Array');

				this.children[this.children.length] = obj;

				arrParent.splice(index, 1);
				return arrParent;
			} else {

				this.children[this.children.length] = obj;
				return null;
			}
		}
	};

	// type: camera - class
	jes_c.Camera = class Camera {
		constructor(option) {
			if (!option) return;

			this.speed = option.speed || 25;
			this.position = {
				x: 0,
				y: 0
			};
			this.going = false;
			this.goTo = {
				x: 0,
				y: 0,
				element: null
			}

			this.anchor = option.anchor || {
				x: 0.5,
				y: 0.5
			}

			this.width = option.width || window.innerWidth;
			this.height = option.height || window.innerHeight;
		}

		follow(el) {
			this.goTo.element = el;
		}

		goToPoint(x, y) {
			this.goTo.x = x;
			this.goTo.y = y;

			// tells the camera is currently going to a defined point
			this.going = true
		}

		run() {

			if (this.goTo.element && !this.going) {
				// moves the camera to the stored element's position
				console.log()
				this.position.x = this.goTo.element.position.x - this.width * this.anchor.x;
				this.position.y = this.goTo.element.position.y - this.height * this.anchor.y;
				//this.position.x = (this.goTo.element.position.x - this.width / 2 * this.anchor.x + this.goTo.element.velocity.x) * (1 / this.speed);
				//this.position.y = (this.goTo.element.position.y - this.height * this.anchor.y + this.goTo.element.velocity.y)
			} else if (this.going) {

				this.x += this.goTo.x - camera.position.x - this.width * this.anchor.x;
				this.y += this.goTo.y - camera.position.y - this.height * this.anchor.y;
			}
		}
	}

	/**
	 * 2D Vector
	 * @param {Number} x
	 * @param {Number} y
	 */
	jes_c.Vector2 = class Vector2 {
		constructor(x, y) {

			/**
			 * @property x
			 * @type Number
			 * @default 0
			 */
			this.x = x || 0;

			/**
			 * @property y
			 * @type Number
			 * @default 0
			 */
			this.y = y || 0;
		}

		/**
		 * @memberof Vector2
		 *
		 * Returns a clone of a Vector2
		 * @returns {Object} Returns the clone of this Vector2
		 */
		clone() {

			return new jes_c.Vector2(this.x, this.y);
		}

		/**
		 * @memberof Vector2
		 *
		 * Returns a copy of a Vector2
		 * @returns {Object} Returns the copy of this Vector2
		 */
		copy() {

			return this;
		}

		/**
		 * @memberof Vector2
		 *
		 * Set a Vector2 to the given values
		 * @param   {Number} x ###
		 * @param   {Number} y ###
		 * @returns {Object}
		 */
		set(x, y) {

			this.x = x || 0;
			this.y = y || 0;

			return this;
		}

		/**
		 * @memberof Vector2
		 *
		 * Add this Vector2 to an other
		 * @param {Object} v Vector2 to add
		 */
		add(v) {

			this.x += v.x;
			this.y += v.y;

			return this;
		}

		/**
		 * @memberof Vector2
		 *
		 * Sub a Vector2 to this Vector2
		 * @param {Object} v ###
		 */
		sub(v) {

			this.x -= v.x;
			this.y -= v.y;

			return this;
		}

		/**
		 * @memberof Vector2
		 *
		 * Multiply a Vector2 by a given value
		 * @param {Value} s value
		 */
		multiply(s) {

			this.x *= s;
			this.y *= s;

			return this;
		}

		/**
		 * @memberof Vector2
		 *
		 * Divides a vector
		 * @param {[[Type]]} s ###
		 */
		divide(s) {

			if (s) {

				this.x /= s;
				this.y /= s;
			} else {

				this.set(0, 0);
			}

			return this;
		}

		/**
		 * @memberof Vector2
		 *
		 * Inverts the X and Y value of a Vector2
		 */
		invert() {

			return this.multiply(-1);
		}

		/**
		 * @memberof Vector2
		 *
		 * Returns the length of a Vector2
		 * @returns {Number} returns the Vector2 length
		 */
		length() {

			return Math.sqrt(this.x * this.x + this.y * this.y);
		}

		/**
		 * @memberof Vector2
		 *
		 * Normalize a Vector2
		 * @returns {Object} ###
		 */
		normalize() {

			return this.divide(this.length());
		}

		/**
		 * @memberof Vector2
		 *
		 * Set the length of a Vector2
		 * @param   {Number} l Vector2 length
		 * @returns {Object} ###
		 */
		setLength(l) {

			return this.normalize().multiply(l);
		}
	};

	/**
	 * The Point object represents a location in a two-dimensional coordinate system, where x represents the horizontal axis and y represents the vertical axis.
	 *
	 * @class Point
	 * @constructor
	 * @param x {Number} position of the point on the x axis
	 * @param y {Number} position of the point on the y axis
	 */
	jes_c.Point = class Point {
		constructor(x, y) {

			/**
			 * @property x
			 * @type Number
			 * @default 0
			 */
			this.x = x || 0;

			/**
			 * @property y
			 * @type Number
			 * @default 0
			 */
			this.y = y || 0;
		}

		clone() {

			return new jes_c.Point(this.x, this.y);
		}

		copy() {

			return this;
		}
	};
})()