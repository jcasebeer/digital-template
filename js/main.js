window.onload = function() {
    /*
        Game Theme: Dog Catcher
        Game Title: Space Animal Control (work in progress)

        What can you do?
            Right now you can just fly a little spaceship around with the arrow keys, 
            i spent a lot of time on abstractions so that it is easy to add new functionality
            in the future.

            the camera is now centered on the spaceship and there is a procedurally generated starfield
    */
    
    "use strict";
    
    // First create a phaser "game" object.
    var game = new Phaser.Game( 800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update } );

    // create a list to store our game entities
    var entities = [];

    //Define some useful functions

    function degstorads(degs) 
    //Given Degrees, Return Radians
    {
        return degs * (Math.PI/180);
    }

    function lengthdir_x(len,dir)
    //given a length and an angle (in Degrees), return the horizontal (x) component of 
    //the vector of the angle and direction
    {
        return len * Math.cos(degstorads(dir));
    }

    

    function lengthdir_y(len,dir)
    // Performs the same function as lengthdir_x, but returns the vertical component
    {
        return len * Math.sin(degstorads(dir));

    }

    function point_distance(x1,y1,x2,y2) 
    // Returns the distance between two points
    // will be used to perform circle collisions
    {
        var xdif = x1-x2;
        var ydif = y1-y2;
        return Math.sqrt(xdif*xdif+ydif*ydif);
    }

    function point_direction(x1,y1,x2,y2)
    // return as a degree the angle between two points
    {
        var xdif = x2 - x1;
        var ydif = y2 - y1;

        return Math.atan2(ydif,xdif)*180 / Math.PI;
    }

    var SEED;
    function rand()
    // random number generator for javascript that I found on stackoverflow,
    // because you apparently can't seed javascripts built in rng
    // found here: http://stackoverflow.com/questions/521295/javascript-random-seeds
    {
        var rand = Math.sin(++SEED)*10000;
        return rand - Math.floor(rand);
    }

    function szudzkik(x,y)
    // pairing function
    {
        if (x<y)
            return y*y+x;
        else
            return x*x+x+y;
    }

    function entityDestroy(i)
    // destroys the entities Phaser image and removes it from the entity list
    {
        entities[i].PhSprite.destroy();
        entities.splice(i,1);
    }

    function entityCreate(ent)
    //adds an entity to the entity list 
    {
        entities.push(ent);
    }

    function entity(x,y,dir,sprite) 
    // Parent "class" used to wrap some of phaser's drawing functionality
    {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.sprite = sprite;
        this.speed = 0;
        this.angle = 0;
        this.alive = true;

        //create a phaser image and add the entity's values to it 
        this.PhSprite = game.add.image(this.x,this.y,this.sprite);
        this.PhSprite.anchor.setTo(0.5,0.5);
        this.PhSprite.smoothed = false; 
        this.PhSprite.angle = this.angle;
        this.PhSprite.x = this.x;
        this.PhSprite.y = this.y;


        this.step = function()
        {
            // do nothing, method to be overridden by children of this class
        }
       
        this.moveToDir = function()
        {
            this.x+=lengthdir_x(this.speed,this.dir);
            this.y+=lengthdir_y(this.speed,this.dir);
        }

        this.update = function() 
        // Meant to be called every time the games loop runs, updates an entities x,y positions 
        // Based on its speed and direction variables and updates the phaser image variables
        // accordingly
        {
            this.PhSprite.x = this.x;
            this.PhSprite.y = this.y;
            this.PhSprite.angle = this.angle;
        }

    }

    function player(x,y)
    // INHERITS: Entity
    // A little ship controllable with the arrow keys
    {
        // code to inherit from Entity
        var parent = new entity(x,y,0,'ship');
        for (var i in parent)
            this[i] = parent[i];

        this.radius = 16;
        this.life = 1000;
        this.PhSprite.scale.setTo(2,2);
        this.can_shoot = true;
        this.shootTime = 0;
        this.dead = false;
        this.deadTime = 600
        this.activateThrust = false;

        this.step = function() 
        // meant to be called every time the game loop runs, lets the player control
        // the ship
        {
            if (this.life <= 0 )
            {
                this.life = 0;
                this.dead = true;
                this.angle+=-15+Math.random()*30;
                this.dir = this.angle;
                this.speed = 4;
                screen_shake+=2;
                if (Math.random()<0.02)
                    entityCreate(new explode(this.x,this.y));
                if (this.deadTime > 0)
                    this.deadTime--;
                else
                    gameState = 2;
            }

            if (!this.dead)
            {
                //rotate ship left
                if (leftKey.isDown)
                    this.angle-=3;

                //rotate ship right
                if (rightKey.isDown)
                    this.angle+=3;

                //add velocity to ship
                if (upKey.isDown)
                {
                    this.dir = this.angle;
                    this.speed+=0.1;

                    if (this.activateThrust === false)
                    {
                        snd_explode.play('',0,0.5,false,true);
                        this.activateThrust = true;
                        screen_shake+=8;
                    }
                }
                else
                {
                    this.activateThrust = false;
                }

                if (shootKey.isDown)
                {
                    if (this.can_shoot)
                    {
                        entityCreate(new bullet(this.x+lengthdir_x(16,this.angle),this.y+lengthdir_y(16,this.angle),this.angle,this.speed,0));
                        this.can_shoot = false;
                        screen_shake += 4;
                        snd_shoot.play();
                    }
                }

                //subtract veolicty until the ship comes to a stop
                if (downKey.isDown)
                {
                    if (this.speed>0)
                        this.speed-=0.1;
                }
            }
            //limit ships max speed
            if (this.speed>7)
                this.speed=7;

            if (this.speed>0.1)
                this.speed-=0.005;

            if (this.speed<0)
                this.speed=0;

            if (this.can_shoot === false)
            {
                if (this.shootTime<8)
                    this.shootTime++;
                else
                {
                    this.can_shoot = true;
                    this.shootTime = 0;
                }
            }

            //wrap coordinates horizontally
            if (this.x>32000)
                this.x=0;
            if (this.x<0)
                this.x=32000;

            //wrap coordinates vertically
            if(this.y>32000)
                this.y=0;
            if(this.y<0)
                this.y=32000;

            var i;
            for (i in entities)
            {
                if (entities[i] instanceof dog)
                {
                    if ( entities[i].dist<(this.radius+entities[i].radius) ) 
                    {
                        entities[i].alive = false;
                        score+=100;
                        snd_bark.play('',0,0.5,false,true);
                    }
                }
                else if (entities[i] instanceof bullet && entities[i].target === 1)
                    if (point_distance(this.x,this.y,entities[i].x,entities[i].y)<(this.radius+entities[i].radius) )
                    {
                        entities[i].alive = false;
                        entityCreate(new explode(this.x,this.y));
                        this.life -= 100;
                    }
                
            }

            this.moveToDir();
        }

    }

    function enemyShip(x,y)
    // Enemy ship
    {
        var parent = new entity(x,y,0,'dogship');
        for (var i in parent)
            this[i] = parent[i];

        this.PhSprite.scale.setTo(2,2);
        this.radius = 16;
        this.maxSpeed = 4+Math.random()*3;
        this.skill = 0.1+Math.random()*0.5;

        this.xspeed = 0;
        this.yspeed = 0;
        this.dist = point_distance(this.x,this.y,obj_player.x,obj_player.y);

        this.step = function()
        {

            this.dir = point_direction(this.x,this.y,obj_player.x,obj_player.y);
            this.dist = point_distance(this.x,this.y,obj_player.x,obj_player.y);

            if (this.dist>256)
            {
                this.xspeed += lengthdir_x(this.skill,this.dir);
                this.yspeed += lengthdir_y(this.skill,this.dir);
            }
            else
            {
                this.xspeed += lengthdir_x(1,this.dir+90);
                this.yspeed += lengthdir_y(1,this.dir+90);
            }

            if (Math.random()<0.01 && this.dist<800)
            {
                entityCreate(new bullet(this.x,this.y,this.dir,this.maxSpeed,1));
                snd_shoot.play('',0,0.5,false,true);
            }

            this.x+=this.xspeed;
            this.y+=this.yspeed;

            if (this.xspeed > this.maxSpeed)
                this.xspeed = this.maxSpeed;
            if (this.xspeed < -this.maxSpeed)
                this.xspeed = -this.maxSpeed;
            if (this.yspeed > this.maxSpeed)
                this.yspeed = this.maxSpeed;
            if (this.yspeed < -this.maxSpeed)
                this.yspeed = -this.maxSpeed;

            this.angle = point_direction(0,0,this.xspeed,this.yspeed);

            var i;
            for (i in entities)
            {
                if ( entities[i] instanceof bullet && entities[i].target === 0 )
                    if ( point_distance(this.x,this.y,entities[i].x,entities[i].y)<(this.radius+entities[i].radius) ) 
                    { 
                        entities[i].alive = false;
                        this.alive = false;
                        entityCreate(new dog(this.x,this.y));
                        entityCreate(new explode(this.x,this.y));
                        score+=10;
                    }
            }

        }
    }

    function dog(x,y)
    {
        var parent = new entity(x,y,0,'dog');
        for (var i in parent)
            this[i] = parent[i];

        this.radius = 16;
        this.angle = Math.random()*360;
        this.dir = Math.random()*360;
        this.speed=1;
        this.dist = point_distance(this.x,this.y,obj_player.x,obj_player.y);
        this.life = 600;

        this.step = function()
        {
            this.dist = point_distance(this.x,this.y,obj_player.x,obj_player.y);
            this.angle+=1;
            this.life--;

            if (this.life<0)
                this.alive = false;

            if (this.dist<200)
            {
                this.dir = point_direction(this.x,this.y,obj_player.x,obj_player.y);
                this.speed=9;
            }

            this.moveToDir();
        }
    }

    function explode(x,y)
    {
        var parent = new entity(x,y,0,'explode');
        for (var i in parent)
            this[i] = parent[i];

        //this.angle = Math.random()*360;
        //this.dir = Math.random()*360;
        //this.speed = 1+Math.random()*4;
        this.PhSprite.tint = 0x000000;
        this.frame = 0;
        this.PhSprite.scale.setTo(4,4);
        screen_shake += 16;

        snd_explode.play();

        this.step = function()
        {

            this.angle-=1;
            if (this.frame<16)
                this.frame+=0.25;
            else
                this.alive = false;

            this.PhSprite.frame = ~~(this.frame);

            this.moveToDir();
        }
    }

    function bullet(x,y,dir,speed,target)
    {
        var parent = new entity(x,y,0,'bullet');
        for (var i in parent)
            this[i] = parent[i];

        this.radius = 8;
        this.dir = dir;
        this.angle = dir;
        //this.speed = 8+speed;
        this.life = 120
        this.scale = 2;
        this.PhSprite.scale.setTo(2,2)
        // 0 for enemies, 1 for player
        this.target = target; 

        if (this.target === 0)
            this.speed = 8+speed;
        else
            this.speed = 4+speed;

        this.step = function()
        {
            if (this.life>0)
                this.life--;
            else
                this.alive = false;

            if (this.scale>1.2)
            {
                this.scale -=0.2;
                this.PhSprite.scale.setTo(this.scale,this.scale);
            }

            this.moveToDir();
        }

    }

    function preload() 
    //function used to load assets
    {
        game.load.image('vignette','assets/grad.png');
        game.load.image('ship','assets/ship.png');
        game.load.image('border','assets/border.png');
        game.load.image('dogship','assets/dogship.png');
        game.load.image('dog','assets/dogtwo.png');
        game.load.image('bullet','assets/bullet.png');
        game.load.spritesheet('explode','assets/explodeTiles.png',32,32);
        game.load.audio('snd_shoot','assets/shoot.ogg',true);
        game.load.audio('snd_explode','assets/explode.ogg',true);
        game.load.audio('snd_bark','assets/bark.ogg',true);
        game.load.audio('snd_music','assets/ozuwara.ogg',true);

    }

    // variables for our game
    var obj_player;
    var border;
    var screen_shake = 0;
    var enemies = 0;
    var addspeed = 0.004;
    var gameTime = 0;

    // score variables
    var score = 0;
    var highScore = 0;

    //variables for our procedurally generated starfield
    var stars;
    var starfield;
    // depth for the parallax effect of the starfield
    var depth = 600;


    // variables used to store keypresses
    var upKey;
    var downKey;
    var leftKey;
    var rightKey;
    var shootKey;

    // variables for our text objects in the titlescreen
    var titleText;
    var scoreText;

    // variables for our text objects in the game loop
    var gameText;
    
    // variables to store our sound objects
    var snd_shoot;
    var snd_explode;
    var snd_bark;
    var snd_music;

    function create() 
    {
        // set background color to white
        game.stage.backgroundColor = '#ffffff';
        //make the world much bigger
        game.world.setBounds(0,0,32000,32000);

        // assign keys to our input variables
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        shootKey = game.input.keyboard.addKey(Phaser.Keyboard.X);

        game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.LEFT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.RIGHT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.X);

        //create a bitmapdata object to store our starfield
        stars = game.add.bitmapData(800,600);
        stars.smoothed = false;
        starfield = stars.addToWorld();
        starfield.fixedToCamera = true;

        // add hud border
        border = game.add.sprite(0,0,'border');
        border.anchor.setTo(0,0);
        border.scale.setTo(10,10);
        border.smoothed = false;
        border.fixedToCamera = true;
        border.bringToTop();

        // add sound "sprites"
        snd_shoot = game.add.audio('snd_shoot');
        snd_shoot.allowMultiple = true;

        snd_explode  = game.add.audio('snd_explode');
        snd_explode.allowMultiple = true;

        snd_bark  = game.add.audio('snd_bark');
        snd_bark.allowMultiple = true;

        snd_music = game.add.audio('snd_music');
        snd_music.play('',0,0.05,true,true);

        // add menu text
        titleText = game.add.text(400, 300, "IT IS THE YEAR 3000\nDOGS HAVE EVOLVED AND NOW FLY SHIPS", {
        font: "32px Courier New",
        fill: "#000000",
        align: "center"
        });
        titleText.anchor.setTo(0.5,0.5);
        titleText.fixedToCamera = true;

        scoreText = game.add.text(20, 20, "LAST SCORE: "+score+"\n"+"HIGH SCORE: "+highScore, {
            font: "16px Courier New",
            fill: "#000000",
            align: "left"
        });
        scoreText.anchor.setTo(0,0);
        scoreText.fixedToCamera = true;

        //add game text
        gameText = game.add.text(20,20,"",{
            font: "16px Courier New",
            fill: "#000000",
            align: "left"
        });
        gameText.anchor.setTo(0,0);
        gameText.fixedToCamera = true;
        gameText.visible = false;
    }

    var gameState = -1 //-1=titlescreen 0=setup 1=gameloop 2=gameend/cleanup

    function setup()
    {
        // initialze the player entity
        obj_player = new player(16000,16000);

        // push an alias of obj_player onto our entity list
        entities.push(obj_player);

        screen_shake = 0;
        enemies = 0;
        addspeed = 0.004;
        gameTime = 0;
        score = 0;
    }
    
    function drawBG()
    {
        // draw a vignette
        stars.draw('vignette',0,0);

            // now to draw the actual stars with a parallax effect
            var tilex;
            var tiley;
            var parallax;
            var z;

            // the starfield is broken into "tiles", each containing up to 3 stars
            for(var i =0;i<8;i++)
                for(var w=0;w<6;w++)
                {
                    // get the current tile value based on the viewports coordinates
                    // the ~~ nonsense is apparently the fastest way to make sure you're
                    // doing integer division in javascript
                    tilex = ~~(game.camera.x/128)+i;
                    tiley = ~~(game.camera.y/128)+w;

                    // set the seed of our random number generator based on the tiles coordinates
                    // szudzkik is a pairing function so that we can get a single unique number from
                    // two other numbers
                    SEED = szudzkik(tilex,tiley);
                    
                    // 50% of tiles will have a star
                    for(var n = 0;n<3;n++)
                        if (rand()>0.5)
                        {
                            // set the stars z value
                            z = rand()*400;
                            // calculate the stars parallax based on its depth
                            parallax = depth / (depth - z);
                            // draw the star!
                            stars.circle( parallax*(128*(tilex+rand()) - game.camera.x) , parallax*(128*(tiley+rand()) - game.camera.y),1+(z/400)*4);
                        }

                }
    }

    function gameLoop() 
    {

        if (screen_shake>32)
            screen_shake = 32;

        game.camera.x = obj_player.x-400+Math.random()*screen_shake;
        game.camera.y = obj_player.y-300+Math.random()*screen_shake;

        if (screen_shake>0)
            screen_shake--;

        drawBG();

        gameTime++;
        if (enemies<20 && gameTime>300)
        {
            if (Math.random()<addspeed)
            {
                if (addspeed <0.01)
                    addspeed += 0.0001;
                enemies++;
                var createDir = Math.random()*360;
                entityCreate(new enemyShip(obj_player.x+lengthdir_x(500,createDir),obj_player.y+lengthdir_y(500,createDir) )  );
            }
        }

        // update entities
        // have to increment backwards to allow for deletions
        var i = entities.length;
        while(i--)
        {
            entities[i].step();

            if (entities[i].alive === false)
            {
                if (entities[i] instanceof enemyShip)
                    enemies--;
                entityDestroy(i);
            }
        }

        //update phaser sprites
        i = entities.length;
        while(i--)
        {
            entities[i].update();
        }

        gameText.setText("LIFE: "+obj_player.life+"\n"+"SCORE: "+score);
    }

    function gameEnd()
    {
        var i = entities.length;
        while(i--)
        {
            entityDestroy(i);
        }

        storyIndex = 0;
        storyTime = 0;
        if (score > highScore)
            highScore = score;

        scoreText.setText("LAST SCORE: "+score+"\n"+"HIGH SCORE: "+highScore);
        titleText.visible = true;
        scoreText.visible = true;
        gameText.visible = false;


    }

    var story = [
                "IT IS THE YEAR 3000\nDOGS HAVE EVOLVED AND NOW FLY SHIPS",
                "YOU ARE A DOG CATCHER\nTHIS IS THE STORY OF...",
                "SPACE ANIMAL CONTROL\nPRESS X TO START"
                ];

    var storyIndex = 0;
    var storyTime = 0;

    function titleScreen()
    {
            if (storyTime>=100)
            {
                storyTime = 0;
                storyIndex++;

                if (storyIndex>story.length-1)
                    storyIndex = 0;

                titleText.setText(story[storyIndex]);
            }
            else
                storyTime++;

            game.camera.x= game.camera.x+4;
            game.camera.y= game.camera.y+4;

            if (game.camera.x > 32000)
                game.camera.x = 0;
            if (game.camera.y > 32000)
                game.camera.y = 0;
            drawBG();

            if (shootKey.isDown)
            {
                gameState = 0;
                titleText.visible = false;
                scoreText.visible = false;
                gameText.visible = true;
                storyIndex = 0;
                storyTime = 0;
            }
    }

    function update()
    {
        if (gameState === -1)
        {
            titleScreen();
        }
        if (gameState === 0)
        {
            gameState = 1;
            setup();
        }
        else if (gameState === 1)
        {
            gameLoop();
        }

        else if (gameState === 2)
        {
            gameState = -1;
            gameEnd();
        }
    }
};
