
/* 
	game.js

	A kinda dungeon crawler/puzzle/misc game
	g12345, for LD 43
*/

window.onload = function()
{
	Game.launch("screen");
}

dataFiles = ["font3.png", "LD43a.png"];
soundFiles = []; 

filesLeft = 10;  

Images = [];
Sounds = [];

musicPlaying = 0;

mx = 0;
my = 0;

TileSize = 16;
TilesPerRow = 16;

map0 = 0;
map1 = 0;

distanceToEnd = 100;

initHP = 3;

HP = initHP;
ATK = 1;
DEF = 1;
ITEMS = [25, 27, 26, 25, 27];

totalClicks = 0;

var score = 0;

KEYS = { LEFT:37, UP:38, RIGHT:39, DOWN:40, SPACE:32, ENTER:13, BACKSPACE:8, X:88, C:67 };

var Keyboard = function()
{
	var keysPressed = {};
	
	window.onkeydown = function(e) { 	keysPressed[e.keyCode] = true;
		if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { e.preventDefault(); } ;
	}
	window.onkeyup = function(e) { keysPressed[e.keyCode] = false;	};
	this.isDown = function(keyCode)	{ return keysPressed[keyCode] === true; };
};



function fileLoaded(filename)
{
	filesLeft --;
	console.log(filename + " loaded.");
}

function loadFile(filename, nr)
{
	var img = new Image();
	img.addEventListener('load', fileLoaded(filename));
	img.src = filename;
	Images.push(img);
}

function loadMusicFile(filename)
{
	var snd = new Audio();
	snd.addEventListener('load', fileLoaded(filename));
	snd.src = filename;
	Sounds.push(snd);
}

fontSize = 16;
function sprint(screen,x,y,s)
// prints a string at x,y, no wrapping
{
	var px = x;
	var py = y;
	for (var i=0; i<s.length; i++)
	{
		c = s.charCodeAt(i);
		if ( (c>=97) && (c<=122) ) c-=32;
		if ( (c>=32) && (c<=95) )
		screen.drawImage (Images[0], (c-32)*fontSize,0, fontSize,fontSize, px,py, fontSize,fontSize);
		px += fontSize;
	}
}

function sprintnum(screen,x,y,n)
// prints a number at x,y, no wrapping
{
	sprint(screen,x,y,n+'');
}


Buttons = [ {x: 30, y: 60, w:64, h:64 }, {x: 30, y: 128, w:64, h:64 }, {x: 30, y: 192, w:64, h:64 }, {x: 30, y: 256, w:64, h:64 }, 
			{x: (800/2), y: 60, w:64, h:64 }, {x: (800/2), y: 128, w:64, h:64 }, {x: (800/2), y: 192, w:64, h:64 }, {x: (800/2), y: 256, w:64, h:64 },  ];


function is_wall(x,y)
// check if map coord (x,y) is a wall block or not
// monsters doesn't count.
{
	var c = map0[y][x];
	if ((c >= 4) && (c<8))
	{
		score ++;
		map0[y][x] = 0;
	}
	return ((c > 10) && (c !=45+6));
}

function is_floor(x,y)
// check if map coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return (map0[y][x] > 10);
}

function is_wall2(x,y)
// check if PIXEL coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return is_wall(Math.floor(x/TileSize), Math.floor(y/TileSize));
}

function is_floor2(x,y)
// check if PIXEL coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return is_floor(Math.floor(x/TileSize), Math.floor(y/TileSize));
}

var mouseX = 0;
var mouseY = 0;
var mouseP = 0;
var mouseI = 0;
var mouseJ = 0;
var canvasi;
	
function getMousePos(canvas, event) 
{
	var rect = canvas.getBoundingClientRect();
	if ((event.pageX != undefined) && (event.pageY != undefined))
	{
		mouseX = event.pageX;
		mouseY = event.pageY;
	}
	else
	{
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
	mouseX -= rect.left;
	mouseY -= rect.top;
	mouseX = Math.floor(mouseX);
	mouseY = Math.floor(mouseY);
}
	
function mouse_is_inside(b)
{
	if  ((mouseX > b.x) && (mouseY > b.y) && (mouseX < b.x+b.w) && (mouseY < b.y+b.h))
		return 1;
	return 0;
}

buildings = [];

window.onmousemove = function(e) 
				{ 
					getMousePos( canvasi, e );
				};
					
window.onmousedown = function(e) 
				{ 
					getMousePos( canvasi, e );
					if ((mouseP == 0) && (e.buttons == 1))
					{
						mouseJ = 0;
						for (var i=0; i< Buttons.length; i++)
							if (mouse_is_inside(Buttons[i]))
								mouseJ = i+1;
						if (mouseJ > 0)
						{
							// console.log("mouseJ :"+mouseJ);
							if (buildings.length >= mouseJ)
							{
								//for (var i=0; i< 25; i++)
								buildings[mouseJ-1].buy();
							}
						}
					}
					mouseP = e.buttons;
				};

window.onmouseup = function(e) 
				{ 
					getMousePos( canvasi, e );
					mouseP = 0;
				};

Game = {};

people = [];
money = 0;
ticks = 0;

Game.launch = function(canvasId)
{
	var canvas = document.getElementById(canvasId);
	var screen = canvas.getContext('2d');
	var gameSize = { x: canvas.width, y: canvas.height };
	
	// gameMode: 0 = start screen; 1 = game; 2 = game over;
	var gameMode = 0;
	
	canvasi = canvas;
	
	people = [ new Player() ];
	
	
	filesLeft = dataFiles.length + soundFiles.length;
	
	for (var i=0; i<dataFiles.length; i++)
		loadFile(dataFiles[i], i);
	for (var i=0; i<soundFiles.length; i++)
		loadMusicFile(soundFiles[i], i);
	
	
	score = 0;
	var depth = 0;
	
	{
		totalClicks = 0;
	}

	var update = function()
	{
		if (gameMode === 1)
		{
			for (var i=people.length-1; i>=0; i--)
				people[i].update();
			
			if (people[0].end == 1)
			{
				gameMode = 3;
			}
			
			if (people[0].end == 2)
			{
				gameMode = 4;
			}
			
			if (people[0].keyb.isDown(KEYS.ENTER))
			{
				
				makeMap();
				score = 0;
				people[0].x = 10;
				people[0].y = 5;
				people[0].r = 0;
				people[0].end = 0;
				people[0].tile=	Math.floor(Math.random()*7)+1;
				if (people[0].tile>6) people[0].tile=6;
				
				ITEMS = [25, 27, 26, 25, 27];
				HP = initHP;
				ATK = 1;
				DEF = 1;

			}
			
		}
		else
		{
			if (people[0].keyb.isDown(KEYS.ENTER))
			{
				if (gameMode === 0) gameMode = 1;
				if (gameMode === 3) gameMode = 1;
				if (gameMode === 4) gameMode = 1;
			}
		}
	}
	
	var camerax = 0;
	var cameray = 0;
	var clockticks = -1;
	
	
	
	    my = 20+1;
	    mx = 30+2;
	var sy = my;
	var sx = mx;
	
	
	map0 = new Array(my);
	map1 = new Array(my);
	
	for (var y=0; y<my; y++)
	{
		map0[y] = new Array(mx);
		map1[y] = new Array(mx);
	}

	var makeMap = function()
	{
		for (var y=0; y<my; y++)
		{
			for (var x=0; x<mx; x++)
			{
				var c = 0;
				map0[y][x] = 0;
				map1[y][x] = 0;
								
				// muurtjes
				c = Math.floor(Math.random()*4);
				map0[y][x] = 1+c;
				
				c = Math.floor(Math.random()*4);
				map1[y][x] = 16+c;
				
				if (Math.random()<.1)
				{
					map1[y][x] = 12;
				}
				
				if (Math.random()<.15)
				{
					map1[y][x] = 24+c;
				}
				
				// muurtjes
				c = Math.floor(Math.random()*3);
				if (y === my-1) { map0[y][x] = 8+c; map1[y][x] = 0; }
				if (y === 0)    { map0[y][x] = 8+c; map1[y][x] = 0; }
				if (x === 0)    { map0[y][x] = 8+c; map1[y][x] = 0; }
				if (x === mx-1) { map0[y][x] = 8+c; map1[y][x] = 0; }				
			}
		}
		
		map1[my-5][mx-5] = 13; // exit
		map1[people[0].y][people[0].x] = 15;
		
	}
	
	makeMap();
	score = 0;
	

	var draw = function(screen, gameSize, clockticks)
	{
		var drawTile = function(y, x, t)
		{
			screen.drawImage (Images[1], 
				(t%TilesPerRow)*TileSize, (Math.floor(t/TilesPerRow)) *TileSize, 
				TileSize,TileSize, 
				x,y, 
				TileSize,TileSize);						
		}
		
		if (gameMode === 1)
		{
			screen.fillStyle="black";
			screen.fillRect(0,0, gameSize.x, gameSize.y);
/*
			camerax = (people[0].center.x / TileSize) - (sx/2);
			if (camerax < 0) camerax = 0;
			if (camerax > mx-sx) camerax = mx-sx;

			cameray = (people[0].center.y / TileSize) - (sy/2);
			if (cameray < 0) cameray = 0;
			if (cameray > my-sy) cameray = my-sy;
*/
			camerax = 0;
			cameray = 0;
			startx = 200;
			starty = 0;
			var startx = Math.floor(camerax); 
			var restx = Math.floor( (camerax - startx) * TileSize );
			var starty = Math.floor(cameray); 
			var resty = Math.floor( (cameray - starty) * TileSize );
			// console.log(startx, starty);
			
			for (var x=0; x<=sx; x++)
			for (var y=0; y<=sy; y++)
			{
				screen.drawImage (Images[1],
					0,0, 
					TileSize,TileSize, 
					x*TileSize - restx,y*TileSize - resty, 
					TileSize,TileSize);
				if ( (starty+y<my) && (map0[starty+y][startx+x] > 0) )
				{
					screen.drawImage (Images[1], 
						(map0[starty+y][startx+x]%TilesPerRow)*TileSize, (Math.floor(map0[starty+y][startx+x]/TilesPerRow)) *TileSize, 
						TileSize,TileSize, 
						x*TileSize - restx,y*TileSize - resty, 
						TileSize,TileSize);
				}
				if ( (starty+y<my) && (map1[starty+y][startx+x] > 0) )
				{
					screen.drawImage (Images[1], 
						(map1[starty+y][startx+x]%TilesPerRow)*TileSize, (Math.floor(map1[starty+y][startx+x]/TilesPerRow)) *TileSize, 
						TileSize,TileSize, 
						x*TileSize - restx,y*TileSize - resty, 
						TileSize,TileSize);
				}
			}
			
			people[i].draw(screen, camerax, cameray);

			vx = 520;
			
			sprint (screen, vx, 20, "HP  :"+HP+"  ");
			sprint (screen, vx, 40, "ATK :"+ATK+"  ");
			sprint (screen, vx, 60, "DEF :"+DEF+"  ");
			sprint (screen, vx, 80, "Items :");
			for (pp=0; pp<ITEMS.length; pp++)
			{
				drawTile(100, vx+(pp*TileSize)+32, ITEMS[pp])
			}
			sprint (screen, vx, 120, "X/C Key to scroll");
			sprint (screen, vx, 140, "Arrow keys move");
			sprint (screen, vx, 180, "Monsters :");
			for (pp=0; pp<4; pp++)
			{
				drawTile(200, vx+(pp*TileSize)+64, 16+pp)
			}
			sprint (screen, vx, 220, "PWR 1234");
//			sprint (screen, vx, 150, "A game made in 2 hours, sorry");
		}
	
		if (gameMode === 0)
		{
			screen.fillStyle="black";
			screen.fillRect(0,0, gameSize.x, gameSize.y);
			
			sprint (screen, 16, 100, "Dungeon of Lost Items (LD 43)");
//			sprint (screen, 250, 120, "LD 43");

			sprint (screen, 16, 150, "Go to the exit.");
			sprint (screen, 16, 170, "Every time you attack, you lose first item.");
			sprint (screen, 16, 190, "If your ATK is too low, you can lose HP too.");
			sprint (screen, 16, 210, "HP -= (PWR - DEF)");

			sprint (screen, 250, 250, "Use Arrow keys to move,");
			sprint (screen, 250, 270, "X/C to scroll items,");
		
			sprint (screen, 250, 290, "Press ENTER to (re)start.");
			sprint (screen, 250, 330, "Made for Ludum Dare 43, by g12345");
//			sprint (screen, 16, 384-8-32, "Total Clicks: " + totalClicks );
		}
		
		if (gameMode === 3)
		{		
			sprint (screen, 250, 150, "Well done, you won!");
			sprint (screen, 250, 190, "Press ENTER to restart.");
		}
		
		if (gameMode === 4)
		{		
			sprint (screen, 250, 150, "Sorry, you died!");
			sprint (screen, 250, 190, "Press ENTER to restart.");
		}
	}
	
	var tick = function()
	{
		if (filesLeft === 0)
		{
			// console.log ("All files loaded");
			update();
			clockticks ++;
			draw(screen, gameSize, clockticks);
			
			if (!musicPlaying)
			{
				musicPlaying = 1;
				if (Sounds.length > 0)
				{
					Sounds[0].loop = true;
					Sounds[0].play();
				}
			}
		}
		requestAnimationFrame(tick);
	}

	// This to start a game
	tick();
};


var Player = function()
{
	this.tile = 0;
	this.x = 10; this.y=5;
	this.r = 0;
	
	this.keyb = new Keyboard();
	this.counter = 0;
	this.frame1 = 0;
	this.framenr = 1;
	this.type = 0; // player type = 0
	
	this.onfloor = 0; // 0 = falling, 1 = onfloor, 2 = jumping
	this.hold = 0; // how long has the player holding a key?
	this.dir = 0;  // which direction is the player holding?
	
	this.end = 0; // end == 1 => win
	
}

Player.prototype =
{
	touche: function(dx,dy)
	{
/*
				// Check if falling touches any existing tile
				t2 = tiles[this.tile][this.r+1];
				
				for (y=0; y<t2[1]; y++)
				for (x=0; x<t2[0]; x++)
				{
					if (t2[2+y][x]>0) 
						if (map0[this.y+y+dy][this.x+x+dx]>0)
						{
							return 1;
						}
				}
				return 0;
*/	
	},
	update: function()
	{

	//	if (this.counter%5 === 0)
		
		var nx = this.x;
		var ny = this.y;
		
		if (this.hold==0 && this.keyb.isDown(KEYS.LEFT))
		{
			if (this.x>1)
			{
					nx = this.x-1;
			}
			this.hold = 10;
		}
		else
		if (this.hold==0 && this.keyb.isDown(KEYS.RIGHT))
		{
			if (this.x<=mx-1)
			{
					nx = this.x+1;
			}
			this.hold = 10;
		}
		else
		if (this.hold==0 && this.keyb.isDown(KEYS.UP))
		{
			if (this.y>1)
			{
					ny = this.y-1;
			}
			this.hold = 10;
		}
		else
		if (this.hold==0 && this.keyb.isDown(KEYS.DOWN))
		{
			if (this.y<=my-1)
			{
					ny = this.y+1;
			}
			this.hold = 10;
		}
		else
		if (this.hold==0 && this.keyb.isDown(KEYS.X))
		{
			if (ITEMS.length>1)
			{
				ITEMS.push(ITEMS.shift());
			}
			this.hold = 10;
		}
		else
		if (this.hold==0 && this.keyb.isDown(KEYS.C))
		{
			if (ITEMS.length>1)
			{
				ITEMS.unshift(ITEMS.pop());
			}
			this.hold = 10;
		}
		
		ATK=1;
		DEF=1;
		for (q=0; q<ITEMS.length; q++)
		{
			if (ITEMS[q]==25) {ATK++};
			if (ITEMS[q]==27) {DEF++};
		}
		
		if ( (nx != this.x) || (ny != this.y) )
		{
			q = map1[ny][nx];
			
			// console.log(q);
			moved = 1;
			
			if ( (q==24) || (q==25) || (q==26) || (q==27) )
			{
				ITEMS.push(q);
				if (ITEMS.length>10) ITEMS.shift();
			}
			else
			if (q==12) // door
			{
				ind = ITEMS.indexOf(26);
				if (ind > -1) ITEMS.splice(ind, 1);
				else moved = 0;
			}
			else
			if (q==13) // exit
			{
				this.end = 1;
			}
			else
			if ( (q>=16) && (q<=19) ) // monsters
			{
				power = q-15;
				if (ATK>power)
				{ 
					if (ITEMS.length>0) ITEMS.shift();			
				}
				else
				if (power>DEF) 
				{ 
					HP -= power-DEF; 
					if (HP<=0)
					{
						this.end = 2;
						moved = 0;
					}
					if (ITEMS.length>0) ITEMS.shift();
				}
				else
				{
					if (ITEMS.length>0) ITEMS.shift();
				}
			}
			
			if (moved==1)
			{
				map1[this.y][this.x] = 0;
				this.y = ny;
				this.x = nx;
				map1[this.y][this.x] = 15;
			}
		}
		
		if (this.hold>0) this.hold=this.hold-1;
		
		this.counter = this.counter+1;
		if (this.counter>50) this.counter = this.counter - 50;

	},
	
	draw: function(screen, camerax, cameray)
	{
/*
		t = tiles[this.tile];
		t2 = t[this.r+1];
		
		for (y=0; y<t2[1]; y++)
		for (x=0; x<t2[0]; x++)
		{
			if (t2[2+y][x]>0) 
				screen.drawImage (Images[1], 
					(this.tile+1)*TileSize,0, 
					TileSize, TileSize, 
					(this.x+x)*TileSize,(this.y+y)*TileSize, 
					TileSize, TileSize );
		}
*/
	}
}




