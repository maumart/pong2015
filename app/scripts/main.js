/* jshint devel:true */
(function(){
	"use strict";

	var PONG = window.PONG = window.PONG || {};

	PONG.settings = {
		playArea : {
			width: 500,
			height: 500
		},
		ball : {
			maxNumber: 1,
			speed: 5,
			maxSpeed : 20,
			size: 10,
			minAngle: 10,
			maxAngle: 80
		},
		paddles : {
			widthPaddel : 25,
			heightPaddel: 50,
			startLeftX: 25,
			startLeftY: 25,
			startRightY: 75,
			leftPaddle: 'paddleLeft',
			rightPaddle: 'paddleRight',
			step: 35
		},
		controlls : {
			buttonUp: 'buttonUp',
			buttonDown: 'buttonDown',
			rangeLeft: 'rangeLeft'
		}
	};

	PONG.util = {
		vector : {
			deg2rad : function(_deg){
				return _deg * Math.PI/180;
			},
			rad2deg : function(_rad){
				return _rad * (180/Math.PI);
			},
			velocityY : function(_velocity,_angle){
				return _velocity * Math.cos(_angle);
			},
			velocityX : function(_velocity,_angle){
				return _velocity * Math.sin(_angle);
			},
			emmergingAngle : function(_incidenceAngle){
				return _incidenceAngle * -1;
			},
			invertVelocity : function(_velocity){
				return _velocity * -1;
			}
		},
		dom : {
			setPosition3D : function(_domElement,_top,_left){
				_domElement.style['-webkit-transform'] = 'translate3d('+_left+'px,'+_top+'px,0)';
			},
			setPx : function(_domElement,_style,_px){
				_domElement.style[_style] = _px +'px';
			},
			setPosition : function(_domElement,_top,_left){
				_domElement.style['top'] = _top +'px';
				_domElement.style['left'] = _left +'px';
			}
		},
		keyboard : {
			keyCode2direction : function(e){
				var direction;

				if (e.keyCode == 38) direction = 'up';
				if (e.keyCode == 40) direction = 'down';
				return direction;
			}
		}
	};

	PONG.model = (function(){
		var ball = function(){
			this.id;
			this.currentX;
			this.currentY;
			this.currentAngle;
			this.currentVelocity;
			this.domElement;

			ball.prototype.init = function(_id,_domELement,_currentX, _currentY,_currentVelocity,_currentAngle){
				this.id=_id;
				this.domElement = document.getElementById(_domELement);
				this.currentX = _currentX;
				this.currentY = _currentY;
				this.currentVelocity = _currentVelocity;
				this.currentAngle = PONG.util.vector.deg2rad(90 + _currentAngle);
			};



			ball.prototype.update = function(){
				this.calculateNewPosition();
				this.calulateCollision();
			};

			ball.prototype.currentXRight = function(){
				return this.currentX + PONG.settings.ball.size;
			};

			ball.prototype.currentYRight = function(){
				return this.currentY + PONG.settings.ball.size;
			};

			ball.prototype.calulateCollision = function(){
				var distanceRight= PONG.game.getWall().x1 - this.currentXRight();
				var distanceLeft=  this.currentX-PONG.game.getWall2().x1-5;
				var distanceBottom = PONG.game.getWall3().y1 - this.currentYRight();
				var distanceTop = this.currentY-PONG.game.getWall4().y1-5;

				var hitDetected = false;

				if (distanceRight <= 0 || distanceLeft <= 0) {
					console.log('hit');
					this.currentAngle = PONG.util.vector.deg2rad(180) - this.currentAngle ;
					this.currentVelocity = this.currentVelocity * -1;
				}

				if (distanceBottom <= 0 || distanceTop <= 0) {
					//this.currentAngle = this.currentAngle * -1 + 2* Math.PI;

					this.currentAngle = PONG.util.vector.deg2rad(360) - this.currentAngle;
					this.currentVelocity = this.currentVelocity * -1;
				}

				if (hitDetected === false) return;

				if (this.currentVelocity < 0) {
					this.currentVelocity = this.currentVelocity - 0.2;
				} else {
					this.currentVelocity = this.currentVelocity + 0.2;
				}
			};

			ball.prototype.calculateNewPosition = function(){
				var velocityX = PONG.util.vector.velocityX(this.currentVelocity,this.currentAngle);
				var velocityY = PONG.util.vector.velocityY(this.currentVelocity,this.currentAngle);

				var newX = this.currentX+velocityX;
				var newY = this.currentY+velocityY;

				this.setPosition(newX,newY,true);
			};

			ball.prototype.setPosition = function(_posX,_posY,_updateDOM){
				this.currentX= _posX;
				this.currentY= _posY;

				if(!_updateDOM) return;

				PONG.util.dom.setPosition3D(this.domElement,this.currentY,this.currentX);
			};

			ball.prototype.calculatePaddleCollision = function(_paddlePosition){
				var distanceY = this.currentY - _paddlePosition.posY1;
				var distanceX = this.currentX - _paddlePosition.posX1;

				if (this.currentX >= _paddlePosition.posX1 && this.currentX <=  _paddlePosition.posX2  ) {

					if (this.currentY>= _paddlePosition.posY1 && this.currentY <= _paddlePosition.posY2){

						this.currentAngle = PONG.util.vector.deg2rad(180) - this.currentAngle;
						this.currentVelocity = this.currentVelocity * -1;
					}
				}
			};

			ball.prototype.getPosition = function(){
				return {
					posX: this.currentX,
					posY: this.currentY
				};
			};
		};

		var wall = function(){
			this.x1;
			this.x2;
			this.y1;
			this.y2;
			this.domElement;
			this.typeOfWall;

			wall.prototype.init = function(_typeOfWall,_domElement,_x1,_y1,_width,_height){
				this.typeOfWall = _typeOfWall;

				this.x1 = _x1;
				this.y1 = _y1;
				this.x2 = _x1 + _width;
				this.y2 = _y1 + _height;

				this.domElement = document.getElementById(_domElement);
				this.domElement.style.left = this.x1 +'px';
			};

			wall.prototype.getCoordinates = function(){
				return {
					"x1":this.x1,
					"y1":this.y1
				};
			};
		};

		var paddle = function(){
			this.domElement;
			this.posX;
			this.posY;
			this.width;
			this.height;

			paddle.prototype.init = function(_domElement){
				this.posX=PONG.settings.paddles.startLeftX;
				this.posY=PONG.settings.paddles.startLeftY;
				this.height = PONG.settings.paddles.heightPaddel;
				this.width = PONG.settings.paddles.widthPaddel;

				this.domElement = document.getElementById(_domElement);
				PONG.util.dom.setPosition3D(this.domElement,this.posY,this.posX);
			};

			paddle.prototype.updatePaddle = function(_directionVector){
				var newX;
				var newY;
				var heightArena = PONG.settings.playArea.height;

				newX = this.posX;
				newY = this.posY + _directionVector;

				if (newY <= 0) {
					newY = 0;
				}

				if (newY >= heightArena) {
					newY = heightArena;
				}

				this.setPosition(newX,newY);
			};

			paddle.prototype.setPosition = function(_posX,_posY){
				this.posX = _posX;
				this.posY = _posY;
				//this.domElement.style.top = this.posY+'px';
				PONG.util.dom.setPosition3D(this.domElement,this.posY,this.posX);
			};

			paddle.prototype.getPosition = function(){
				return {
					posX1: this.posX,
					posY1: this.posY,
					posX2: this.posX+this.width,
					posY2: this.posY+this.height,
				};
			};
		};

		var player = function(){
			this.id;
			this.paddle;
			this.points;
			this.domElement;

			player.prototype.init = function(_id,_domElement){
				this.id = _id;
				this.domElement = _domElement;
				this.points = 0;

				this.paddle = new paddle();
				this.paddle.init(_domElement);
			};

			player.prototype.update = function(_direction){
				//console.log(_direction);
				this.paddle.updatePaddle(_direction);
			};

			player.prototype.getpaddle = function(){
				return this.paddle.getPosition();
			};
		};

		return {
			ball: ball,
			wall: wall,
			player: player,
			paddle: paddle
		};

	})();

	PONG.game =(function(){
		var walls = [];
		var balls = [];
		var that;

		var ball;
		var ball2;
		var ball3;

		var player1;

		var wall;
		var wall2;
		var wall3;
		var wall4;

		var initGame = function(){
			balls = initBalls();
			walls = initWalls();

			wall = new PONG.model.wall();
			wall.init('right','borderRight',495,0,5,500);

			wall2 = new PONG.model.wall();
			wall2.init('left','borderLeft',0,0,5,500);

			wall3 = new PONG.model.wall();
			wall3.init('bottom','borderBottom',0,495,500,5);

			wall4 = new PONG.model.wall();
			wall4.init('top','borderTop',0,0,500,5);

			player1 = new PONG.model.player();
			player1.init(0,'paddleLeft');

			//player1.getpaddle();

			walls.push(wall,wall2,wall3,wall4);
		};

		var initBalls = function(){
			var randomAngle = 45;
			var randomAngle2 = 135; //Math.random() * (85 - 15) + 10;
			var randomAngle3 =  315; //Math.random() * (85 - 15) + 10;
			var _balls = [];

			ball = new PONG.model.ball();
			ball.init(0,'ball',250,250,PONG.settings.ball.speed,randomAngle);

			ball2 = new PONG.model.ball();
			ball2.init(1,'ball2',250,250,PONG.settings.ball.speed,randomAngle2);

			ball3 = new PONG.model.ball();
			ball3.init(1,'ball3',250,250,PONG.settings.ball.speed,randomAngle3);

			_balls.push(ball,ball2,ball3);

			return _balls;
		};

		var initWalls = function(){
			var _walls= [];

			wall    = new PONG.model.wall();
			wall.init('right','borderRight',495,0,5,500);

			wall2   = new PONG.model.wall();
			wall2.init('left','borderLeft',0,0,5,500);

			wall3   = new PONG.model.wall();
			wall3.init('bottom','borderBottom',0,495,500,5);

			wall4   = new PONG.model.wall();
			wall4.init('top','borderTop',0,0,500,5);

			player1 = new PONG.model.player();
			player1.init(0,'paddleLeft');

			_walls.push(wall,wall2,wall3,wall4);

			return _walls;
		};

		var update=function(){
			for (var i = 0; i < balls.length; i++) {
			//for (var i = 0; i < 1; i++) {
				balls[i].calculatePaddleCollision(player1.getpaddle());
				balls[i].update();
			};
		};

		var getWall = function(){
			return wall;
		};

		var getWall2 = function(){
			return wall2;
		};

		var getWall3 = function(){
			return wall3;
		};

		var getWall4 = function(){
			return wall4;
		};

		var getPlayer = function(){
			return player1;
		};

		var getWalls = function(){
			return {
				wallLeft: wall2,
				wallRight: wall1,
				wallBottom: wall3,
				wallTop: wall4
			};
		};

		return {
			initGame:initGame,
			update:update,
			getWall:getWall,
			getWall2:getWall2,
			getWall3:getWall3,
			getWall4:getWall4,
			getWalls: getWalls,
			getPlayer:getPlayer
		};
	})();


	PONG.control = (function(){
		var that;

		var init = function(){
			that = this;
			registerEvents();
		};

		var registerEvents = function(){
			var buttonUp = document.getElementById('buttonUp');
			var buttonDown = document.getElementById('buttonDown');

			buttonUp.addEventListener('click', function(e){
				that.calculateInput(e);
			},false);

			buttonDown.addEventListener('click', function(e){
				that.calculateInput(e);
			},false);

			// Keyboard
			window.addEventListener('keydown', function(e) {
				var keyCodeDecoded = PONG.util.keyboard.keyCode2direction(e);
				that.calculateInput(e,keyCodeDecoded);
			},false);
		};

		var calculateInput = function(e,_direction){
			var steps = PONG.settings.paddles.step;

			if (_direction === 'up') PONG.game.getPlayer().update(-steps);
			if (_direction === 'down') PONG.game.getPlayer().update(steps);

			if (e.target.id === 'buttonUp') PONG.game.getPlayer().update(-steps);
			if (e.target.id === 'buttonDown') PONG.game.getPlayer().update(steps);
		};

		return {
			init: init,
			registerEvents: registerEvents,
			calculateInput:calculateInput
		};
	})();

	PONG.main = (function(){
		var game = PONG.game;
		var control = PONG.control;
		var that = this;

		var handleEvent = function(){
			game.initGame();
			control.init();

			requestAnimationFrame(gameLoop);
		}

		var gameLoop= function(){
			game.update();
			requestAnimationFrame(gameLoop);
		};

		return {
			handleEvent: handleEvent
		}

	})();

	// DOM Loeaded
	document.addEventListener( "DOMContentLoaded", PONG.main ,false);

})()


$( document ).ready({

})
