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
    //Define some useful functions

    function degstorads(degs) 
    //Given Degrees, Return Radians
    {
        return degs * (Math.PI/180);
    }

    function lengthdir_x(len,dir)
    /*
        given a length and an angle (in Degrees), return the horizontal (x) component of 
        the vector of the angle and direction
    */
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
        var xdif = (x1-x2);
        var ydir = (y1-y2);
        return Math.sqrt(xdif*xdir+ydif*ydif);
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

    function entity(x,y,dir,sprite) 
    // Parent "class" used to wrap some of phaser's sprite functionality
    // Any class that inherits from entity must have a function called step 
    {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.sprite = sprite;
        this.speed = 0;
        this.angle = 0;

        //create a phaser sprite and add the entity's values to it 
        this.PhSprite = game.add.sprite(this.x,this.y,this.sprite);
        this.PhSprite.anchor.setTo(0.5,0.5);
        this.PhSprite.smoothed = false; 
        this.PhSprite.angle = this.angle;
        this.PhSprite.x = this.x;
        this.PhSprite.y = this.y;

       
        this.update = function() 
        //Meant to be called every time the games loop runs, updates an entities x,y positions 
        //Based on its speed and direction variables and updates the phaser sprite variables
        //accordingly
        {
            this.x+=lengthdir_x(this.speed,this.dir);
            this.y+=lengthdir_y(this.speed,this.dir);

            this.PhSprite.x = this.x;
            this.PhSprite.y = this.y;
            this.PhSprite.angle = this.angle;
        }
    }

    function player(x,y)
    // INHERITS: Entity
    // A little ship controllable with the arrow keys
    {

        //code to inherit from Entity
        var parent = new entity(x,y,0,'ship');
        for (var i in parent)
            this[i] = parent[i];

        this.step = function() 
        // meant to be called every time the game loop runs, lets the player control
        // the ship
        {
            //rotate ship left
            if (leftKey.isDown)
                this.angle-=2;

            //rotate ship right
            if (rightKey.isDown)
                this.angle+=2;

            //add velocity to ship
            if (upKey.isDown)
            {
                this.dir = this.angle;
                this.speed+=0.1;
            }

            //subtract veolicty until the ship comes to a stop
            if (downKey.isDown)
            {
                if (this.speed>0)
                    this.speed-=0.1;
            }

            //limit ships max speed
            if (this.speed>4)
                this.speed=4;

            if (this.speed>0.1)
                this.speed-=0.005;

            if (this.speed<0)
                this.speed=0;

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
  
        }

    }

    function preload() 
    //function used to load assets
    {
        game.load.image('vignette','assets/grad.png');
        game.load.image('ship','assets/ship.png');
    }

    // variable for our only entity, in the future this will be a 
    // list that can be iterated over all entities
    var obj_player;

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
    

    function create() 
    {

        // set background color to white
        game.stage.backgroundColor = '#ffffff';
        
        //create a bitmapdata object to store our starfield
        stars = game.add.bitmapData(800,600);
        stars.smoothed = false;
        starfield = stars.addToWorld();

        //make the world much bigger
        game.world.setBounds(0,0,32000,32000);



        // assign keys to our input variables
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

        // initialze the player entity
        obj_player = new player(16000,16000);

        // have camera follow player
        game.camera.follow(obj_player.PhSprite, Phaser.Camera.FOLLOW_TOPDOWN_TIGHT);
        //game.camera.follow(obj_player.PhSprite);

    }
    
    function update() 
    {
        // attach the starfield image to our camera
        starfield.x = game.camera.x;
        starfield.y = game.camera.y;
        
        // draw a vignette
        stars.draw('vignette',0,0);

            // now to draw the actual stars with a parallax effect
            var tilex;
            var tiley;
            var parallax;
            var z;

            // the starfield is broken into "tiles", each containing a single star
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


        //update entities
        obj_player.step();

        //update phaser sprites
        obj_player.update();
    }
};
