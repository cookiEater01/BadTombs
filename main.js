// Global variable definitionvar canvas;
var canvas;
var gl;
var shaderProgram;


var textCanvas;
var ctx;


//variable for starting staring game
var startNow = false;
var startTime;
var timeSinceStart;
var stopGame = false;

// Buffers
var worldVertexPositionBuffer = null;
var worldVertexTextureCoordBuffer = null;
var floorVertexPositionBuffer = null;
var floorVertexTextureCoordBuffer = null;
var ceilingVertexPositionBuffer = null;
var ceilingVertexTextureCoordBuffer = null;

// flashlight Buffers
var flashlightVertexPositionBuffer;
var flashlightVertexNormalBuffer;
var flashlightVertexTextureCoordBuffer;
var flashlightVertexIndexBuffer;

// bullet Buffers
var bulletVertexPositionBuffer;
var bulletVertexNormalBuffer;
var bulletVertexTextureCoordBuffer;
var bulletVertexIndexBuffer;



var angle; //delet
var numEnemies = 1;
var enemyId = 0;
var kills = 0;
var killsNeeded = 15;
var roomNum = 3;

var difficulty;
var textIndent = 110;

// enemy buffer
var enemyVertexPositionBuffer;
var enemyVertexTextureCoordBuffer;

// Variables for storing objects
var enemies = [];   // enemy objects array
var spawns = [];    // spawn points for enemies
var player;
var bullets = [];



// gun Buffers
var gunVertexPositionBuffer;
var gunVertexNormalBuffer;
var gunVertexTextureCoordBuffer;
var gunVertexIndexBuffer;

// closed door Buffers
var cDoorVertexPositionBuffer;
var cDoorVertexNormalBuffer;
var cDoorVertexTextureCoordBuffer;
var cDoorVertexIndexBuffer;

// open door Buffers
var oDoorVertexPositionBuffer;
var oDoorVertexNormalBuffer;
var oDoorVertexTextureCoordBuffer;
var oDoorVertexIndexBuffer;

// enemy Buffers
var enemyVertexPositionBuffer;
var enemyVertexNormalBuffer;
var enemyVertexTextureCoordBuffer;
var enemyVertexIndexBuffer;

// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variables for storing textures
var wallTexture;
var floorTexture;
var ceilingTexture;
var plasticTexture;
var gunTexture;
var doorTexture;

//data of doors [state(o/c),pos x, pos z, direction(x/z), length, time changed]
var doorInfo = [["c",-1, -2, "x", 1, new Date().getTime()], ["c", 0, 2, "x", 1, new Date().getTime()], ["c", 2, -1, "z", 2, new Date().getTime()]];

// Variable that stores  loading state of textures.
var texturesLoaded = 0;
var allTexturesLoaded = 7;

// Keyboard handling helper variable for reading the status of keys
var currentlyPressedKeys = {};
var qPressed = false;

// Mouse helper variables
//var mouseDown = false;
var rightMouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

// Variables for storing current position and speed
var pitch = 0;
var pitchRate = 0;
var yaw = 0;
var yawRate = 0;
var xPosition = 0;
var yPosition = 0.4;
var zPosition = 0;
var xSpeed = 0;
var zSpeed = 0;

// Used to make us "jog" up and down as we move forward.
var joggingAngle = 0;

// Helper variable for animation
var lastTime = 0;
var effectiveFPMS = 60 / 1000;

// Table of obstacles
//var obstaclesX = [,,,,,,,,[-2, -1, 0, 2],[2,3],,[2,3],[-2,0,1,2],,,,,,,,];
//var obstaclesZ = [,,,,,,,,[-2,2],[-4,-2],[-4,-2,2,4],[2,4],[-2,-1,1,2],,,,,,,,];
var obstaclesX = [21];
var obstaclesZ = [21];


var audioDeath      = new Audio('./assets/death-monster-sound.ogg');
audioDeath.volume = 0.3;
var audioHit        = new Audio('./assets/monster-pain4.wav');
var audioPlayerHit  = new Audio('./assets/grunt1.wav');
var audioGunshot    = new Audio('./assets/gunshot-3.wav');
var audioReload     = new Audio('./assets/pistol-reload.wav');
var audioBGM        = new Audio('./assets/Pharaoh_Ramses_II-2.mp3');
audioBGM.play();


function Bullet(type, angle, damage) {

  this.type = type;
  this.angle = angle;
  this.damage = damage;
  this.y = yPosition - 0.09;
  this.x = xPosition - 1 * (Math.sin(degToRad(this.angle)) * 0.6);
  this.z = zPosition - 1 * (Math.cos(degToRad(this.angle)) * 0.6);

  this.speed = 0.07;
}
Bullet.prototype.draw = function () {
  mvPushMatrix();

  mat4.translate(mvMatrix, [this.x, this.y, this.z]);
  mat4.rotate(mvMatrix, degToRad(this.angle), [0, 1, 0]); // z v desno // degToRad(10)
  mat4.rotate(mvMatrix, degToRad(90), [1.0, 0.0, 0.0]);
  mat4.translate(mvMatrix, [0.16, 0, 0]);
  mat4.scale(mvMatrix, [0.03, 0.03, 0.03]);

  drawBullet(this.type);

  mvPopMatrix();
};

Bullet.prototype.animate = function (elapsedTime) {

    this.z -= (Math.cos(degToRad(this.angle)) * this.speed);
    this.x -= (Math.sin(degToRad(this.angle)) * this.speed);

    for (var i in enemies) { // checks if bullet hit any of the enemies
      if (enemies[i] != "")
        if (Math.abs(enemies[i].x - this.x) < 0.2 && Math.abs(enemies[i].z - this.z) < 0.2){
          enemies[i].hit(i, this.damage);
          return true;
        }
    }
    return false;
};

function Player() {
  this.y = yPosition;
  this.x = xPosition;
  this.z = zPosition;

  this.hp = Math.floor(12 / difficulty);
  this.weapons = [];
  this.weapons.push(new Weapon(1));
  this.selectedWeapon = 0;
  this.reloading = false;
  this.fireDelay = false;
}

Player.prototype.shoot = function () { // attempt shooting
  if (this.fireDelay == false){
    if (this.reloading == false){
      if (this.weapons[this.selectedWeapon].bullets > 0){   // attempt shooting pogoj #2 ali imas dovolj metkov

        audioGunshot.play();
        this.weapons[this.selectedWeapon].bullets--;
        bullets.push(new Bullet(1, yaw, this.weapons[this.selectedWeapon].damage));
        this.fireDelay = true; // set fire delay
        setTimeout(() => {    // in fireDelayAmount it times out
          this.fireDelay = false;
        }, this.weapons[this.selectedWeapon].fireDelayAmount);
      }
      else{ // attempt to reload
          this.reload();
      }
    }
  }
};

Player.prototype.reload = function () {
  if (this.reloading == false){ // start reloading
    this.reloading = true;
    audioReload.play();
    setTimeout(() => { //finish reloading
      this.weapons[this.selectedWeapon].bullets = this.weapons[this.selectedWeapon].maxBullets;
      this.reloading = false;
    }, this.weapons[this.selectedWeapon].reloadTime);
  }
};

Player.prototype.hit = function () {
  audioPlayerHit.play();
  this.hp --;
  if (this.hp <= 0){
    youLose();
  }
};



function howManyEnemiesLeft(){
  var mobsLeft = 0;
  for (i in enemies){
    if (enemies[i] != "")
      mobsLeft++;
  }
  return mobsLeft;
}

function youWin() {
  stopGame = true;
  document.getElementById("info").innerHTML = "Congratulations! You've won in <b>"+timeSinceStart+"</b> seconds!";
  console.log("WWWWWWWWW" + howManyEnemiesLeft());
}
function youLose() {
  stopGame = true;
  document.getElementById("info").innerHTML = "You've lost with <b>"+ (killsNeeded - kills) +"</b> kills left to go! More luck next time.";
  console.log("LLLLLLLLL" + howManyEnemiesLeft());
}

function initCan() {
  textCanvas = document.getElementById("text");
  ctx = textCanvas.getContext("2d");
  ctx.font = '24pt Calibri';
}





function Weapon(type) {
  this.y = 0.20;
  this.x = xPosition;
  this.z = zPosition;

  switch (type) {
    case 1: this.bullets = 5;
            this.maxBullets = 5;
            this.reloadTime = 1000;
            this.fireDelayAmount = 200;
            this.damage = 1; break;
    default: console.log("ERR- invalid weapon type");
  }
}

Weapon.prototype.draw = function () {
  mvPushMatrix();
  mat4.identity(mvMatrix); // ce hocs met prlepjen na screenu !

  if (player.reloading == false){
    mat4.translate(mvMatrix, [0.15, -0.15, -0.4]);
    mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);
  }else{
    mat4.translate(mvMatrix, [0.15, -0.05, -0.4]);
    mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-45), [1, 0, 0]);
  }
  mat4.scale(mvMatrix, [0.004,0.004,0.004]);

  drawGun(this.type);

  mvPopMatrix();
};

function drawGun(type) {
  //if (type == 1){

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gunTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, gunVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gunVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, gunVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, gunVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, gunVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, gunVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gunVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, gunVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
//  }
}


function Enemy(type, x, z) {
  //this.x = (Math.random() * (10) - 5).toFixed(4);
  //this.z = (Math.random() * (10) - 2).toFixed(4); // delet +5
  this.id = enemyId;
  this.y = 0.11;
  this.x = x;
  this.z = z;

  this.pointToYou = true;
  this.type = type;
  this.aggro = false;
  this.angle = 0.0;

  this.hp = 3;// * difficulty;
  this.speed =  0.015 + 0.005 * difficulty;
}

Enemy.prototype.draw = function () {
  mvPushMatrix();
  //mat4.identity(mvMatrix); // ce hocs met prlepjen na screenu !


  //mat4.rotate(mvMatrix, degToRad(this.angle), [0.0, 1.0, 0.0]);

  mat4.translate(mvMatrix, [this.x, this.y, this.z]);
  mat4.rotate(mvMatrix, degToRad(this.angle), [0, 1, 0]); // z v desno // degToRad(10)
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);
  mat4.scale(mvMatrix, [0.03, 0.03, 0.03]);


  drawEnemy(this.type);

  mvPopMatrix();
};

// Function animates individual star
Enemy.prototype.animate = function (elapsedTime) {
  //this.angle += this.rotationSpeed * effectiveFPMS * elapsedTime;

  if (this.pointToYou){
    this.angle = Math.atan2(zPosition - this.z, xPosition - this.x) * 180 / Math.PI;
    this.angle *= -1;
    this.angle += 90;
        this.angle += 175;
  }
  if (this.aggro){
    //if (this.id == 0){
    var enemyX = this.x;
    var enemyZ = this.z;

    this.z -= (Math.cos(degToRad(this.angle)) * this.speed);
    this.x -= (Math.sin(degToRad(this.angle)) * this.speed);

    var hitX = checkEnemyCollisionX(this.x, this.z);
    var hitZ = checkEnemyCollisionZ(this.x, this.z);

    if (hitX && hitZ) {
      this.z = enemyZ;
      this.x = enemyX;
    } else if (hitX && !hitZ) {
      this.z = enemyZ;
    } else if (!hitX && hitZ) {
      this.x = enemyX;

    }
    //}
    if (Math.abs(xPosition - this.x) < 0.3 && Math.abs(zPosition - this.z) < 0.3){ // melee hit !
      player.hit();
      this.z -= -1 * (Math.cos(degToRad(this.angle)) * 0.5);
      this.x -= -1 * (Math.sin(degToRad(this.angle)) * 0.5);
    }
  }
  else{
    if (xPosition - this.x < 3 && zPosition - this.z < 3 && timeSinceStart > 5){
      this.aggro = true;
    }
  }
};
Enemy.prototype.hit = function (i, damage) {
  audioHit.play();
  this.hp -= damage;

  if (this.hp <= 0){ // enemy dies
    kills++;
    enemies[i] = "";
    audioDeath.play();
  }
  else if (this.aggro == false){ // enemy rushes you when you ambush it
    this.aggro = true;
    this.speed *= 2;
  }
};




function drawEnemy(type) {

  if (type == 1){
    gl.bindTexture(gl.TEXTURE_2D, enemyTexture);
    // Set the vertex positions attribute for the teapot vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, enemyVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, enemyVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, enemyVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, enemyVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Set the normals attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, enemyVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, enemyVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Set the index for the vertices.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, enemyVertexIndexBuffer);
    setMatrixUniforms();
    // Draw the enemy
    gl.drawElements(gl.TRIANGLES, enemyVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }
  else console.log("ERR- invalid enemy type");
}

function drawBullet(type) {

  if (type == 1){
    gl.bindTexture(gl.TEXTURE_2D, plasticTexture);
    // Set the vertex positions attribute for the teapot vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, bulletVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bulletVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Set the texture coordinates attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, bulletVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, bulletVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Set the normals attribute for the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, bulletVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, bulletVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Set the index for the vertices.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bulletVertexIndexBuffer);
    setMatrixUniforms();
    // Draw the bullet
    gl.drawElements(gl.TRIANGLES, bulletVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }
  else console.log("ERR- invalid enemy type");
}

function handleLoadedEnemyLocations(data) {

  for (var i = 0; i < data.length; i++) {
    // Create new enemy and push it to the enemies array
    //console.log(enemies[i].z);
    enemies.push(new Enemy(1, data[i].x, data[i].z));
    enemyId++;
  }
}





function checkEnemyCollisionX(x, z) {
  var newIntZ = Math.round(z);
  var wall = false;
  if (obstaclesX[newIntZ+10]) {
    var line = obstaclesX[newIntZ+10];
    for (var i = 0; i < line.length; i+=2) {
      if (x >= line[i] && x <= line[i+1]) {
        wall = true;
        break;
      }
    }
  }
  if (!wall) {
    for (var i = 0; i < doorInfo.length; i++) {
      var door = doorInfo[i];
      if (door[0] == "c" && door[3] == "x") {
        if (x >= door[1] && x <= (door[1]+door[4]) && newIntZ == door[2]) {
          wall = true;
          break;
        }
      }
    }
  }
  return wall;
}

function checkEnemyCollisionZ(x, z) {
  var newIntX = Math.round(x);
  var wall = false;
  if (obstaclesZ[newIntX+10]) {
    var line = obstaclesZ[newIntX+10];
    for (var i = 0; i < line.length; i+=2) {
      if (z >= line[i] && z <= line[i+1]) {
        wall = true;
        break;
      }
    }
  }
  if (!wall) {
    for (var i = 0; i < doorInfo.length; i++) {
      var door = doorInfo[i];
      if (door[0] == "c" && door[3] == "z") {
        if (z >= door[2] && z <= (door[2]+door[4]) && newIntX == door[1]) {
          wall = true;
          break;
        }
      }
    }
  }
  return wall;
}





//
// Matrix utility functions
//
// mvPush   ... push current matrix on matrix stack
// mvPop    ... pop top matrix from stack
// degToRad ... convert degrees to radians
//
function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//
// initGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initGL(canvas) {
  var gl = null;
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    canvas.oncontextmenu = function() {
      return false;
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // start using shading program for rendering
  gl.useProgram(shaderProgram);

  // store location of aVertexPosition variable defined in shader
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");

  // turn on vertex position attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  // store location of vertex normals variable defined in shader
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");

  // turn on vertex normals attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  // store location of aVertexNormal variable defined in shader
  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

  // store location of aTextureCoord variable defined in shader
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  // store location of uMVMatrix variable defined in shader - model-view matrix
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  // store location of uNMatrix variable defined in shader - normal matrix
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  // store location of uSampler variable defined in shader
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  // store location of uColor variable defined in shader
  shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

}

//
// setMatrixUniforms
//
// Set the uniforms in shaders.
//
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {

  wallTexture = gl.createTexture();
  wallTexture.image = new Image();
  wallTexture.image.onload = function () {
    handleTextureLoaded(wallTexture)
  }
  wallTexture.image.src = "./assets/floor_tiles.jpg";

  floorTexture = gl.createTexture();
  floorTexture.image = new Image();
  floorTexture.image.onload = function () {
    handleTextureLoaded(floorTexture)
  }
  floorTexture.image.src = "./assets/sandstone.jpg";

  ceilingTexture = gl.createTexture();
  ceilingTexture.image = new Image();
  ceilingTexture.image.onload = function () {
    handleTextureLoaded(ceilingTexture)
  }
  ceilingTexture.image.src = "./assets/sand.jpg";

  plasticTexture = gl.createTexture();
  plasticTexture.image = new Image();
  plasticTexture.image.onload = function () {
    handleTextureLoaded(plasticTexture)
  }
  plasticTexture.image.src = "./assets/metal.jpg";

  gunTexture = gl.createTexture();
  gunTexture.image = new Image();
  gunTexture.image.onload = function () {
    handleTextureLoaded(gunTexture)
  }
  gunTexture.image.src = "./assets/gun_text.jpg";

  doorTexture = gl.createTexture();
  doorTexture.image = new Image();
  doorTexture.image.onload = function () {
    handleTextureLoaded(doorTexture)
  }
  doorTexture.image.src = "./assets/sand-door.jpg";

  enemyTexture = gl.createTexture();
  enemyTexture.image = new Image();
  enemyTexture.image.onload = function () {
    handleTextureLoaded(enemyTexture)
  }
  enemyTexture.image.src = "./assets/gold-texture.jpg";
}

function handleTextureLoaded(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Third texture usus Linear interpolation approximation with nearest Mipmap selection
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);

  // when texture loading is finished we can draw scene.
  texturesLoaded += 1;
}

function handleLoadedFlashlight(flashlightData) {
  // Pass the normals into WebGL
  flashlightVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flashlightVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flashlightData.vertexNormals), gl.STATIC_DRAW);
  flashlightVertexNormalBuffer.itemSize = 3;
  flashlightVertexNormalBuffer.numItems = flashlightData.vertexNormals.length / 3;

  // Pass the texture coordinates into WebGL
  flashlightVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flashlightVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flashlightData.vertexTextureCoords), gl.STATIC_DRAW);
  flashlightVertexTextureCoordBuffer.itemSize = 2;
  flashlightVertexTextureCoordBuffer.numItems = flashlightData.vertexTextureCoords.length / 2;

  // Pass the vertex positions into WebGL
  flashlightVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flashlightVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flashlightData.vertexPositions), gl.STATIC_DRAW);
  flashlightVertexPositionBuffer.itemSize = 3;
  flashlightVertexPositionBuffer.numItems = flashlightData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  flashlightVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flashlightVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flashlightData.indices), gl.STATIC_DRAW);
  flashlightVertexIndexBuffer.itemSize = 1;
  flashlightVertexIndexBuffer.numItems = flashlightData.indices.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Load flashlight
//
function loadFlashlight() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/flashlight.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedFlashlight(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function handleLoadedGun(gunData) {
  // Pass the normals into WebGL
  gunVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gunVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gunData.vertexNormals), gl.STATIC_DRAW);
  gunVertexNormalBuffer.itemSize = 3;
  gunVertexNormalBuffer.numItems = gunData.vertexNormals.length / 3;

  // Pass the texture coordinates into WebGL
  gunVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gunVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gunData.vertexTextureCoords), gl.STATIC_DRAW);
  gunVertexTextureCoordBuffer.itemSize = 2;
  gunVertexTextureCoordBuffer.numItems = gunData.vertexTextureCoords.length / 2;

  // Pass the vertex positions into WebGL
  gunVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gunVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gunData.vertexPositions), gl.STATIC_DRAW);
  gunVertexPositionBuffer.itemSize = 3;
  gunVertexPositionBuffer.numItems = gunData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  gunVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gunVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gunData.indices), gl.STATIC_DRAW);
  gunVertexIndexBuffer.itemSize = 1;
  gunVertexIndexBuffer.numItems = gunData.indices.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Load gun
//
function loadGun() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/gun.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedGun(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function handleLoadedcDoor(cDoorData) {
  // Pass the normals into WebGL
  cDoorVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cDoorVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cDoorData.vertexNormals), gl.STATIC_DRAW);
  cDoorVertexNormalBuffer.itemSize = 3;
  cDoorVertexNormalBuffer.numItems = cDoorData.vertexNormals.length / 3;

  // Pass the texture coordinates into WebGL
  cDoorVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cDoorVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cDoorData.vertexTextureCoords), gl.STATIC_DRAW);
  cDoorVertexTextureCoordBuffer.itemSize = 2;
  cDoorVertexTextureCoordBuffer.numItems = cDoorData.vertexTextureCoords.length / 2;

  // Pass the vertex positions into WebGL
  cDoorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cDoorVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cDoorData.vertexPositions), gl.STATIC_DRAW);
  cDoorVertexPositionBuffer.itemSize = 3;
  cDoorVertexPositionBuffer.numItems = cDoorData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  cDoorVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cDoorVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cDoorData.indices), gl.STATIC_DRAW);
  cDoorVertexIndexBuffer.itemSize = 1;
  cDoorVertexIndexBuffer.numItems = cDoorData.indices.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Load cDoor
//
function loadcDoor() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/door-closed.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedcDoor(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function handleLoadedoDoor(oDoorData) {
  // Pass the normals into WebGL
  oDoorVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, oDoorVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(oDoorData.vertexNormals), gl.STATIC_DRAW);
  oDoorVertexNormalBuffer.itemSize = 3;
  oDoorVertexNormalBuffer.numItems = oDoorData.vertexNormals.length / 3;

  // Pass the texture coordinates into WebGL
  oDoorVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, oDoorVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(oDoorData.vertexTextureCoords), gl.STATIC_DRAW);
  oDoorVertexTextureCoordBuffer.itemSize = 2;
  oDoorVertexTextureCoordBuffer.numItems = oDoorData.vertexTextureCoords.length / 2;

  // Pass the vertex positions into WebGL
  oDoorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, oDoorVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(oDoorData.vertexPositions), gl.STATIC_DRAW);
  oDoorVertexPositionBuffer.itemSize = 3;
  oDoorVertexPositionBuffer.numItems = oDoorData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  oDoorVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oDoorVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(oDoorData.indices), gl.STATIC_DRAW);
  oDoorVertexIndexBuffer.itemSize = 1;
  oDoorVertexIndexBuffer.numItems = oDoorData.indices.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Load oDoor
//
function loadoDoor() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/door-open.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedoDoor(JSON.parse(request.responseText));
    }
  }
  request.send();
}


function loadEnemyLocations() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/enemyLocations"+roomNum+".json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedEnemyLocations(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function handleLoadedEnemy(enemyData) {
  // Pass the normals into WebGL
  enemyVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, enemyVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(enemyData.vertexNormals), gl.STATIC_DRAW);
  enemyVertexNormalBuffer.itemSize = 3;
  enemyVertexNormalBuffer.numItems = enemyData.vertexNormals.length / 3;

  // Pass the texture coordinates into WebGL
  enemyVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, enemyVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(enemyData.vertexTextureCoords), gl.STATIC_DRAW);
  enemyVertexTextureCoordBuffer.itemSize = 2;
  enemyVertexTextureCoordBuffer.numItems = enemyData.vertexTextureCoords.length / 2;

  // Pass the vertex positions into WebGL
  enemyVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, enemyVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(enemyData.vertexPositions), gl.STATIC_DRAW);
  enemyVertexPositionBuffer.itemSize = 3;
  enemyVertexPositionBuffer.numItems = enemyData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  enemyVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, enemyVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(enemyData.indices), gl.STATIC_DRAW);
  enemyVertexIndexBuffer.itemSize = 1;
  enemyVertexIndexBuffer.numItems = enemyData.indices.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Load enemy
//
function loadEnemy() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/enemy.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedEnemy(JSON.parse(request.responseText));
    }
  }
  request.send();
}

function handleLoadedBullet(bulletData) {
  // Pass the normals into WebGL
  bulletVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bulletVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bulletData.vertexNormals), gl.STATIC_DRAW);
  bulletVertexNormalBuffer.itemSize = 3;
  bulletVertexNormalBuffer.numItems = bulletData.vertexNormals.length / 3;

  // Pass the texture coordinates into WebGL
  bulletVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bulletVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bulletData.vertexTextureCoords), gl.STATIC_DRAW);
  bulletVertexTextureCoordBuffer.itemSize = 2;
  bulletVertexTextureCoordBuffer.numItems = bulletData.vertexTextureCoords.length / 2;

  // Pass the vertex positions into WebGL
  bulletVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bulletVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bulletData.vertexPositions), gl.STATIC_DRAW);
  bulletVertexPositionBuffer.itemSize = 3;
  bulletVertexPositionBuffer.numItems = bulletData.vertexPositions.length / 3;

  // Pass the indices into WebGL
  bulletVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bulletVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bulletData.indices), gl.STATIC_DRAW);
  bulletVertexIndexBuffer.itemSize = 1;
  bulletVertexIndexBuffer.numItems = bulletData.indices.length;

  document.getElementById("loadingtext").textContent = "";
}

//
// Load enemy
//
function loadBullet() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/bullet.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedBullet(JSON.parse(request.responseText));
    }
  }
  request.send();
}



//
// handleLoadedWorld
//
// Initialisation of world
//
function handleLoadedWorld(data) {
  var lines = data.split("\n");
  var vertexCount = 0;
  var vertexPositions = [];
  var vertexTextureCoords = [];
  var floorBool = false;
  var floorVertexCount = 0;
  var floorVertexPositions = [];
  var floorVertexTextureCoords = [];
  var ceilingBool = false;
  var ceilingVertexCount = 0;
  var ceilingVertexPositions = [];
  var ceilingVertexTextureCoords = [];

  var count = 0;
  var xz = [2];

  for (var i in lines) {

    var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
    if (vals[1] == "Floor" && vals[2] == "Main") {
      floorBool = true;
      ceilingBool = false;
    } else if (vals[1] == "Ceiling") {
      ceilingBool = true;
      floorBool = false;
    }
    if (vals[0] == "//" && vals[1] != "Floor") {
      floorBool = false;
    }
    if (vals[0] == "//" && vals[1] != "Ceiling") {
      ceilingBool = false;
    }
    if (vals.length == 5 && vals[0] != "//") {
      if (floorBool) {
        floorVertexPositions.push(parseFloat(vals[0]));
        floorVertexPositions.push(parseFloat(vals[1]));
        floorVertexPositions.push(parseFloat(vals[2]));

        // And then the texture coords
        floorVertexTextureCoords.push(parseFloat(vals[3]));
        floorVertexTextureCoords.push(parseFloat(vals[4]));

        floorVertexCount += 1;
      } else if (ceilingBool) {
        ceilingVertexPositions.push(parseFloat(vals[0]));
        ceilingVertexPositions.push(parseFloat(vals[1]));
        ceilingVertexPositions.push(parseFloat(vals[2]));
        ceilingVertexTextureCoords.push(parseFloat(vals[3]));
        ceilingVertexTextureCoords.push(parseFloat(vals[4]));
        ceilingVertexCount += 1;
      }else {
        // It is a line describing a vertex; get X, Y and Z first
        vertexPositions.push(parseFloat(vals[0]));
        vertexPositions.push(parseFloat(vals[1]));
        vertexPositions.push(parseFloat(vals[2]));

        // And then the texture coords
        vertexTextureCoords.push(parseFloat(vals[3]));
        vertexTextureCoords.push(parseFloat(vals[4]));

        vertexCount += 1;

        if (count == 1 && vals[1] == 0) {
          xz[0] = vals[0];
          xz[1] = vals[2];
        } else if (count == 2 && vals[1] == 0) {
          var x = parseInt(vals[0]);
          var z = parseInt(vals[2]);
          if (xz[1] == z) {
            var tmp;
            if (obstaclesX[z+10]) {
              tmp = [obstaclesX[z+10].length + 2];
              var st = 0;
              for (var u = 0; u < obstaclesX[z+10].length; u++) {
                tmp[st] = obstaclesX[z+10][u];
                st++;
              }
              tmp[st] = Math.min(xz[0], x);
              st++;
              tmp[st] = Math.max(xz[0], x);
              obstaclesX[z+10] = tmp;
            } else {
              obstaclesX[z+10] = [(Math.min(xz[0], x)), (Math.max(xz[0], x))];
            }
          } else if (xz[0] == x) {
            var tmp;
            if (obstaclesZ[x+10]) {
              tmp = [obstaclesZ[x+10].length + 2];
              var st = 0;
              for (var u = 0; u < obstaclesZ[x+10].length; u++) {
                tmp[st] = obstaclesZ[x+10][u];
                st++;
              }
              tmp[st] = Math.min(xz[1], z);
              st++;
              tmp[st] = Math.max(xz[1], z);
              obstaclesZ[x+10] = tmp;
            } else {
              obstaclesZ[x+10] = [(Math.min(xz[1], z)), (Math.max(xz[1], z))];
            }
          }
        }
        count++;
        if (count > 5) {
          count = 0;
        }
      }
    }
  }
  floorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPositions), gl.STATIC_DRAW);
  floorVertexPositionBuffer.itemSize = 3;
  floorVertexPositionBuffer.numItems = floorVertexCount;

  floorVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexTextureCoords), gl.STATIC_DRAW);
  floorVertexTextureCoordBuffer.itemSize = 2;
  floorVertexTextureCoordBuffer.numItems = floorVertexCount;

  ceilingVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ceilingVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ceilingVertexPositions), gl.STATIC_DRAW);
  ceilingVertexPositionBuffer.itemSize = 3;
  ceilingVertexPositionBuffer.numItems = ceilingVertexCount;

  ceilingVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ceilingVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ceilingVertexTextureCoords), gl.STATIC_DRAW);
  ceilingVertexTextureCoordBuffer.itemSize = 2;
  ceilingVertexTextureCoordBuffer.numItems = ceilingVertexCount;

  worldVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
  worldVertexPositionBuffer.itemSize = 3;
  worldVertexPositionBuffer.numItems = vertexCount;

  worldVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
  worldVertexTextureCoordBuffer.itemSize = 2;
  worldVertexTextureCoordBuffer.numItems = vertexCount;

  document.getElementById("loadingtext").textContent = "";
}

//
// loadWorld
//
// Loading world
//
function loadWorld() {
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/world.txt");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedWorld(request.responseText);
    }
  }
  request.send();
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  timeSinceStart =  (( new Date().getTime() - startTime )/1000);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = '12pt Calibri';
  ctx.fillText("kills:                         " + kills, 140, textIndent);
  ctx.fillText("time elapsed:        " + timeSinceStart, 140, textIndent + 20);
  ctx.fillText("needed to win:     " + ( killsNeeded - kills ), 140, textIndent + 40);

  ctx.font = '24pt Calibri';
  ctx.fillText("HP:        " + player.hp, 140, textIndent + 70);
  ctx.fillText("bullets: " + player.weapons[player.selectedWeapon].bullets, 140, textIndent + 100);

  if (player.reloading == true) ctx.fillText("reloading", 140, textIndent + 130);

  // set the rendering environment to full canvas size
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // If buffers are empty we stop loading the application.
  if (worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) {
    return;
  }

  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);


  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  mat4.identity(mvMatrix);

  // Now move the drawing position a bit to where we want to start
  // drawing the world.

  //org
  mat4.rotate(mvMatrix, degToRad(-pitch), [1, 0, 0]);
  mat4.rotate(mvMatrix, degToRad(-yaw), [0, 1, 0]);
  mat4.translate(mvMatrix, [-xPosition, -yPosition, -zPosition]);
  var tmp = mvMatrix;

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Draw the world by binding the array buffer to the world's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Draw the cube.
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);

  // Floor textures
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, floorVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, floorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, floorVertexPositionBuffer.numItems);

  // ceiling textures
  gl.bindTexture(gl.TEXTURE_2D, ceilingTexture);
  gl.bindBuffer(gl.ARRAY_BUFFER, ceilingVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, ceilingVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, ceilingVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, ceilingVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, ceilingVertexPositionBuffer.numItems);


  for (var i in enemies) { // draws all enemies
    if (enemies[i] != "")
      enemies[i].draw();
  }

  for (var i in bullets) { // draws all bullets
    if (bullets[i] != "")
      bullets[i].draw();
  }

  // draw first door
  mat4.translate(mvMatrix, [-0.5,0,-2]);
  mat4.scale(mvMatrix, [0.9,0.7,0.5]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);
  drawDoors(doorInfo[0][0]);

  //second door
  mat4.translate(mvMatrix, [-1.1,0,-8]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);
  drawDoors(doorInfo[1][0]);

  //third door
  mat4.translate(mvMatrix, [1.7,0,-4]);
  mat4.scale(mvMatrix, [1,1,3.8]);
  mat4.rotate(mvMatrix, degToRad(90), [0, 1, 0]);
  drawDoors(doorInfo[2][0]);

  // flashlight
  mat4.identity(mvMatrix);

  mat4.translate(mvMatrix, [-0.20, -0.15, -0.30]);
  mat4.scale(mvMatrix, [0.07,0.07,0.07]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);

  gl.bindTexture(gl.TEXTURE_2D, plasticTexture);
  // Set the vertex positions attribute for the teapot vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, flashlightVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, flashlightVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, flashlightVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, flashlightVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, flashlightVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, flashlightVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  // Set the index for the vertices.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flashlightVertexIndexBuffer);
  setMatrixUniforms();
  // Draw the flashlight
  gl.drawElements(gl.TRIANGLES, flashlightVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  //draw gun
  player.weapons[player.selectedWeapon].draw();


}

function drawDoors(s) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, doorTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);
  if (s == "c") {
    gl.bindBuffer(gl.ARRAY_BUFFER, cDoorVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cDoorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cDoorVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cDoorVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cDoorVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cDoorVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cDoorVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cDoorVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, oDoorVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, oDoorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, oDoorVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, oDoorVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, oDoorVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, oDoorVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oDoorVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, oDoorVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }
}

//
// animate
//
// Called every time before redeawing the screen.
//
function animate() {
  var timeNow = new Date().getTime();
  for (var i = 0; i < doorInfo.length; i++) {
    if (doorInfo[i][0] == "o" && timeNow - doorInfo[i][5] > 5000) {
      openDoor(i);
    }
  }
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;

    var oldX = xPosition;
    var oldZ = zPosition;
    var oldY = yPosition;

    xPosition -= Math.sin(degToRad(yaw)) * zSpeed * elapsed;
    zPosition -= Math.cos(degToRad(yaw)) * zSpeed * elapsed;
    xPosition -= Math.sin(degToRad(yaw+90)) * xSpeed * elapsed;
    zPosition -= Math.cos(degToRad(yaw+90)) * xSpeed * elapsed;
    if (xSpeed != 0 || zSpeed != 0) {
      joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
      yPosition = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
    }
    yaw += yawRate * elapsed;
    if (yaw >= 360) {
      yaw -= 360;
    } else if (yaw <= -360) {
      yaw += 360;
    }
    pitch += pitchRate * elapsed;
    var colX = checkForCollisionX(xPosition, zPosition);
    var colZ = checkForCollisionZ(xPosition, zPosition);
    if (colX && !colZ) {
      zPosition = oldZ;
    } else if (!colX && colZ) {
      xPosition = oldX;
    } else if (colX && colZ) {
      xPosition = oldX;
      zPosition = oldZ;
    }
    // if (colX && !colZ) {
    //   xPosition = oldX;
    // } else if (!colX && colZ) {
    //   zPosition = oldZ;
    // } else if (colX && colZ) {
    //   xPosition = oldX;
    //   zPosition = oldZ;
    // }
//    console.log(xPosition, yPosition, zPosition);

    for (var i in enemies) {
      if (enemies[i] != "")
        enemies[i].animate();
    }
    for (var i in bullets) {
      if (bullets[i] != ""){
        var ded = bullets[i].animate();
        if (ded == true)
          bullets[i] = "";
      }
    }

  }
  lastTime = timeNow;
}

function checkForCollisionX(x, z) {
  var newIntZ = Math.round(z);
  var wall = false;
  if (obstaclesX[newIntZ+10]) {
    var line = obstaclesX[newIntZ+10];
    for (var i = 0; i < line.length; i+=2) {
      if (x >= line[i] && x <= line[i+1]) {
        wall = true;
        console.log("Stena med "+line[i]+" in "+line[i+1]+" na X osi");
        break;
      }
    }
  }
  if (!wall) {
    for (var i = 0; i < doorInfo.length; i++) {
      var door = doorInfo[i];
      if (door[0] == "c" && door[3] == "x") {
        if (x >= door[1] && x <= (door[1]+door[4]) && newIntZ == door[2]) {
          if (qPressed) {
            openDoor(i);
          } else {
            wall = true;
            console.log("Vrata med "+door[1]+" in "+(door[1]+door[4])+" na X osi");
            break;
          }
        }
      }
    }
  }
  return wall;
}

function checkForCollisionZ(x, z) {
  var newIntX = Math.round(x);
  var wall = false;
  if (obstaclesZ[newIntX+10]) {
    var line = obstaclesZ[newIntX+10];
    for (var i = 0; i < line.length; i+=2) {
      if (z >= line[i] && z <= line[i+1]) {
        wall = true;
        console.log("Stena med "+line[i]+" in "+line[i+1]+" na z osi");
        break;
      }
    }
  }
  if (!wall) {
    for (var i = 0; i < doorInfo.length; i++) {
      var door = doorInfo[i];
      if (door[0] == "c" && door[3] == "z") {
        if (z >= door[2] && z <= (door[2]+door[4]) && newIntX == door[1]) {
          if (qPressed) {
            openDoor(i);
          } else {
            wall = true;
            console.log("Vrata med "+door[2]+" in "+(door[2]+door[4])+" na z osi");
            break;
          }
        }
      }
    }
  }
  return wall;
}

function openDoor(st) {
  console.log("vrata spremenjena");
  doorInfo[st][0] = (doorInfo[st][0] == "o" ? "c" : "o");
  doorInfo[st][5] = new Date().getTime();
  qPressed = false;
}

//
// Keyboard handling helper functions
//
// handleKeyDown    ... called on keyDown event
// handleKeyUp      ... called on keyUp event
//
function handleKeyDown(event) {
  // storing the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
  // reseting the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = false;
}

//
// handleKeys
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleKeys() {
  if (currentlyPressedKeys[33]) {
    // Page Up
    pitchRate = 0.1;
  } else if (currentlyPressedKeys[34]) {
    // Page Down
    pitchRate = -0.1;
  } else {
    pitchRate = 0;
    yawRate = 0;
  }

  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
    // Left cursor key or A
    //yawRate = 0.1;
    xSpeed = 0.003;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
    // Right cursor key or D
    //yawRate = -0.1;
    xSpeed = -0.003;
  } else {
    //yawRate = 0;
    xSpeed = 0;
  }

  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
    // Up cursor key or W
    zSpeed = 0.003;
  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
    // Down cursor key
    zSpeed = -0.003;
  } else {
    zSpeed = 0;
  }

  if (currentlyPressedKeys[84]){ // T
    console.log("");
    console.log("x Position: " + xPosition.toFixed(2) + " vs ");
    //console.log("y Position: " + yPosition);
    console.log("z Position: " + zPosition.toFixed(2) + " vs ");
    //console.log("angle  " + enemies[0].angle.toFixed(2));

    if (!spawns.some(e => e.x == xPosition.toFixed(2))) {
      spawns.push( {x:xPosition.toFixed(2), z:zPosition.toFixed(2)} );
      console.log(spawns);
    }
  }

  if (currentlyPressedKeys[70]) { // F ( shoot )
    player.shoot();
  }

  if (currentlyPressedKeys[82]) { // r ( reload )
    player.reload();
  }

  if (currentlyPressedKeys[81]) {
    changeQ();
  }
}

function changeQ() {
  var temp = qPressed;
  qPressed = (temp == true ? false : true);
}

//
// Mouse handling helper functions
//
// handleMouseDown    ... on mouse button down event
// handleMouseUp      ... on mouse button up event
//
function handleMouseDown(event) {
  if (event.which == 1) {
    rightMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function handleMouseUp(event) {
  if (event.which == 1) {
    rightMouseDown = false;
  }
}

//
// handleMouse
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleMouseMove(event) {
  if (!rightMouseDown) {
      return;
  }
  var newX = event.clientX;
  var newY = event.clientY;

  var mouseSensitivity = 0.015;

  var deltaX = newX - lastMouseX
  var deltaY = newY - lastMouseY;

  yawRate -= mouseSensitivity * deltaX;
  pitchRate -= mouseSensitivity * deltaY;

  lastMouseX = newX
  lastMouseY = newY;
}

function startGame() {
  startNow = true;
}

function initKills() {
  kills = 0;
  switch (roomNum) {
    case 1: killsNeeded = 15; break;
    case 2: killsNeeded = 8;  break;
    case 3: killsNeeded = 16; break;
    default: killsNeeded = 15; console.log("invalid roomNum");
  }
}

//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
  document.getElementById("startmenu").style.display = "none";
  canvas = document.getElementById("glcanvas");

  difficulty = document.querySelector('input[name = "difficulty"]:checked').value;

  gl = initGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    initShaders();

    //canvas stuff
    initCan();
    // Next, load and set up the textures we'll be using.
    initTextures();
    loadFlashlight();
    loadGun();
    loadcDoor();
    loadoDoor();
    loadEnemy();
    loadBullet();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.
    //initBuffers();

    // Initialise world objects
    loadWorld();

    loadEnemyLocations();
    initKills();




    player = new Player();

    startTime = new Date().getTime();

    //initWorldObjects()

    // Bind keyboard handling functions to document handlers
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    setInterval(function() {
      if (kills >= killsNeeded)
        youWin();
    }, 2000);

    // Set up to draw the scene periodically.
    var idFunc = setInterval(function() {
      if (texturesLoaded == allTexturesLoaded) { // only draw scene and animate when textures are loaded.
        if (stopGame) {
          document.getElementById("startmenu").style.display = "inline";
          document.getElementById('startGame').style.display = "none";
          document.getElementById('textDiff').innerHTML = "You played at selected difficulty:";
          document.getElementById("restart").style.display = "inline";
          clearInterval(idFunc);
        }
        requestAnimationFrame(animate);
        handleKeys();
        drawScene();
      }
    }, 15);
  }
}
