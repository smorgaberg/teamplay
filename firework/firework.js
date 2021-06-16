window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function( callback ) {
					window.setTimeout( callback, 1000 / 60 );
				};
})();

// 기본 변수 설정
var canvas = document.getElementById( 'canvas' ),
		ctx = canvas.getContext( '2d' ),
		cw = window.innerWidth,
		ch = window.innerHeight,
		// 불꽃
		fireworks = [],
		// 입자
		particles = [],
		// 색상
		hue = 120,
		limiterTotal = 5,
		limiterTick = 0,
		timerTotal = 80,
		timerTick = 0,
		mousedown = false,
		// 마우스 좌표
		mx, my;
canvas.width = cw;
canvas.height = ch;

// 범위 내 난수 생성
function random( min, max ) {
	return Math.random() * ( max - min ) + min;
}

// 두 점 사이 거리 계산
function calculateDistance( p1x, p1y, p2x, p2y ) {
	var xDistance = p1x - p2x,
			yDistance = p1y - p2y;
	return Math.sqrt( Math.pow( xDistance, 2 ) + Math.pow( yDistance, 2 ) );
}

// 불꽃 생성
function Firework( sx, sy, tx, ty ) {
	this.x = sx; // 실제 좌표
	this.y = sy;
	this.sx = sx; // 시작 좌표
	this.sy = sy;
	this.tx = tx; // 도착 좌표
	this.ty = ty;
	// 시작점부터 도착점까지 거리
	this.distanceToTarget = calculateDistance( sx, sy, tx, ty );
	this.distanceTraveled = 0;
	// 과거 좌표를 추적하여 잔상 효과
	this.coordinates = [];
	this.coordinateCount = 3;
	while( this.coordinateCount-- ) {
		this.coordinates.push( [ this.x, this.y ] );
	}
	this.angle = Math.atan2( ty - sy, tx - sx );
	this.speed = 2;
	this.acceleration = 1.05;
	this.brightness = random( 50, 70 );
	this.targetRadius = 1;
}

// 불꽃 업데이트
Firework.prototype.update = function( index ) {
	// 좌표 배열을 초기화하고 현재 좌표 추가
	this.coordinates.pop();
	this.coordinates.unshift( [ this.x, this.y ] );
	
	// 원 목표 지시자 반지름
	if( this.targetRadius < 8 ) {
		this.targetRadius += 0.3;
	} else {
		this.targetRadius = 1;
	}
	
	// 불꽃 가속
	this.speed *= this.acceleration;
	var vx = Math.cos( this.angle ) * this.speed,
			vy = Math.sin( this.angle ) * this.speed;
	this.distanceTraveled = calculateDistance( this.sx, this.sy, this.x + vx, this.y + vy );
	if( this.distanceTraveled >= this.distanceToTarget ) {
		createParticles( this.tx, this.ty );
		fireworks.splice( index, 1 );
	} else {
		this.x += vx;
		this.y += vy;
	}
}

// 불꽃 그리기
Firework.prototype.draw = function() {
	ctx.beginPath();
	ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
	ctx.lineTo( this.x, this.y );
	ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
	ctx.stroke();
	ctx.beginPath();
	ctx.arc( this.tx, this.ty, this.targetRadius, 0, Math.PI * 2 );
	ctx.stroke();
}

// 입자 생성
function Particle( x, y ) {
	this.x = x;
	this.y = y;
	// 과거 좌표를 추적하여 잔상 효과
	this.coordinates = [];
	this.coordinateCount = 5;
	while( this.coordinateCount-- ) {
		this.coordinates.push( [ this.x, this.y ] );
	}
	this.angle = random( 0, Math.PI * 2 );
	this.speed = random( 1, 10 );
	this.friction = 0.95;
	this.gravity = 1;
	this.hue = random( hue - 20, hue + 20 );
	this.brightness = random( 50, 80 );
	this.alpha = 1;
	this.decay = random( 0.015, 0.03 );
}

// 입자 업데이트
Particle.prototype.update = function( index ) {
	this.coordinates.pop();
	this.coordinates.unshift( [ this.x, this.y ] );
	this.speed *= this.friction;
	this.x += Math.cos( this.angle ) * this.speed;
	this.y += Math.sin( this.angle ) * this.speed + this.gravity;
	this.alpha -= this.decay;
	// 입자 제거
	if( this.alpha <= this.decay ) {
		particles.splice( index, 1 );
	}
}

// 입자 그리기
Particle.prototype.draw = function() {
	ctx. beginPath();
	ctx.moveTo( this.coordinates[ this.coordinates.length - 1 ][ 0 ], this.coordinates[ this.coordinates.length - 1 ][ 1 ] );
	ctx.lineTo( this.x, this.y );
	ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
	ctx.stroke();
}

// 입자 그룹(입자) 생성
function createParticles( x, y ) {
	// 더 큰 폭발을 위해 입자 수 증가
	var particleCount = 30;
	while( particleCount-- ) {
		particles.push( new Particle( x, y ) );
	}
}

// main loop
function loop() {
	requestAnimFrame( loop );
	// 불꽃의 색 변화
	hue += 0.5;
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.fillRect( 0, 0, cw, ch );
	ctx.globalCompositeOperation = 'lighter';
	
	// 각 뿔꽃에 draw & update
	var i = fireworks.length;
	while( i-- ) {
		fireworks[ i ].draw();
		fireworks[ i ].update( i );
	}
	
	// 각 입자에 draw & update
	var i = particles.length;
	while( i-- ) {
		particles[ i ].draw();
		particles[ i ].update( i );
	}
	
	// 마우스가 다운되지 않으면 임의의 좌표로 자동 발사
	if( timerTick >= timerTotal ) {
		if( !mousedown ) {
			fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch / 2 ) ) );
			timerTick = 0;
		}
	} else {
		timerTick++;
	}
	// 속도 조절
	if( limiterTick >= limiterTotal ) {
		if( mousedown ) {
			fireworks.push( new Firework( cw / 2, ch, mx, my ) );
			limiterTick = 0;
		}
	} else {
		limiterTick++;
	}
}

// 마우스
canvas.addEventListener( 'mousemove', function( e ) {
	mx = e.pageX - canvas.offsetLeft;
	my = e.pageY - canvas.offsetTop;
});
canvas.addEventListener( 'pointerdown', function( e ) {
	mousedown = true;
if(mousedown){
	canvas.addEventListener( 'pointermove', function( e ) {
	e.preventDefault();

			});
		}
	});
canvas.addEventListener( 'pointerup', function( e ) {
	e.preventDefault();
	mousedown = false;
});
window.onload = loop;