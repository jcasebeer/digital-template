window.onload = function() {
    /*
        Game Theme: Dog Catcher
        Game Title: Space Animal Control (work in progress)

        What can you do?
            Right now you can just fly a little spaceship around with the arrow keys, 
            i spent a lot of time on abstractions so that it is easy to add new functionality
            in the future.
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

    function entity(x,y,dir,sprite) 
    // Parent "class" used to wrap some of phaser's sprite functionality
    // Any class that inherits from entity must have a function called step 
    {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.sprite = sprite;
        this.speed = 0;

        //create a phaser sprite and add the entity's values to it 
        this.PhSprite = game.add.sprite(this.x,this.y,this.sprite);
        this.PhSprite.anchor.setTo(0.5,0.5);
        this.PhSprite.smoothed = false; 
        this.PhSprite.angle = this.dir;
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
            this.PhSprite.angle = this.dir;
        }
    }

    function player(x,y)
    // INHERITS: Entity
    // A little ship controllable with the arrow keys
    {

        //code to inherit from Entity
        var parent = new entity(x,y,90,'ship');
        for (var i in parent)
            this[i] = parent[i];

        this.step = function() 
        // meant to be called every time the game loop runs, lets the player control
        // the ship
        {
            //rotate ship left
            if (leftKey.isDown)
                this.dir-=2;

            //rotate ship right
            if (rightKey.isDown)
                this.dir+=2;

            //add velocity to ship
            if (upKey.isDown)
                this.speed+=0.1;

            //subtract veolicty until the ship comes to a stop
            if (downKey.isDown)
            {

                if (this.speed>0)
                    this.speed-=0.1;
            }

            //limit ships max speed
            if (this.speed>4)
                this.speed=4;

            //wrap coordinates horizontally
            if (this.x>800)
                this.x=0;
            if (this.x<0)
                this.x=800;

            //wrap coordinates vertically
            if(this.y>600)
                this.y=0;
            if(this.y<0)
                this.y=600;
  
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
    
    // variables used to store keypresses
    var upKey;
    var downKey;
    var leftKey;
    var rightKey;
    

    function create() 
    {

        // set background color to white and set the background to 'vignette'
        game.stage.backgroundColor = '#ffffff';
        game.add.tileSprite(0,0,800,600,'vignette')

        // assign keys to our input variables
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

        // initialze the player entity
        obj_player = new player(400,300);

    }
    
    function update() 
    {

        //update entities
        obj_player.step();

        //update phaser sprites
        obj_player.update();
    }
};
