/**
 *	Farah
 *	Mohamed Farah
 *	2246646
 */

import * as THREE from "three";

import Stats from "./libs/stats.module.js";

import { ColladaLoader } from "ColladaLoader";

import { OrbitControls } from "OrbitControls";

//SPECIAL IMPORT
// THREEx.KeyboardState.js keep the current state of the keyboard.
// It is possible to query it at any time. No need of an event.
// This is particularly convenient in loop driven case, like in
// 3D demos or games.
//
// # Usage
//
// **Step 1**: Create the object
//
// ```var keyboard	= new THREEx.KeyboardState();```
//
// **Step 2**: Query the keyboard state
//
// This will return true if shift and A are pressed, false otherwise
//
// ```keyboard.pressed("shift+A")```
//
// **Step 3**: Stop listening to the keyboard
//
// ```keyboard.destroy()```
//
// NOTE: this library may be nice as standaline. independant from three.js
// - rename it keyboardForGame
//
// # Code
//

/** @namespace */
var THREEx = THREEx || {};

/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
 */
THREEx.KeyboardState = function (domElement) {
  this.domElement = domElement || document;
  // to store the current state
  this.keyCodes = {};
  this.modifiers = {};

  // create callback to bind/unbind keyboard events
  var _this = this;
  this._onKeyDown = function (event) {
    _this._onKeyChange(event);
  };
  this._onKeyUp = function (event) {
    _this._onKeyChange(event);
  };

  // bind keyEvents
  this.domElement.addEventListener("keydown", this._onKeyDown, false);
  this.domElement.addEventListener("keyup", this._onKeyUp, false);

  // create callback to bind/unbind window blur event
  this._onBlur = function () {
    for (var prop in _this.keyCodes) _this.keyCodes[prop] = false;
    for (var prop in _this.modifiers) _this.modifiers[prop] = false;
  };

  // bind window blur
  window.addEventListener("blur", this._onBlur, false);
};

/**
 * To stop listening of the keyboard events
 */
THREEx.KeyboardState.prototype.destroy = function () {
  // unbind keyEvents
  this.domElement.removeEventListener("keydown", this._onKeyDown, false);
  this.domElement.removeEventListener("keyup", this._onKeyUp, false);

  // unbind window blur event
  window.removeEventListener("blur", this._onBlur, false);
};

THREEx.KeyboardState.MODIFIERS = ["shift", "ctrl", "alt", "meta"];
THREEx.KeyboardState.ALIAS = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  space: 32,
  pageup: 33,
  pagedown: 34,
  tab: 9,
  escape: 27,
};

/**
 * to process the keyboard dom event
 */
THREEx.KeyboardState.prototype._onKeyChange = function (event) {
  // log to debug
  //console.log("onKeyChange", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

  // update this.keyCodes
  var keyCode = event.keyCode;
  var pressed = event.type === "keydown" ? true : false;
  this.keyCodes[keyCode] = pressed;
  // update this.modifiers
  this.modifiers["shift"] = event.shiftKey;
  this.modifiers["ctrl"] = event.ctrlKey;
  this.modifiers["alt"] = event.altKey;
  this.modifiers["meta"] = event.metaKey;
};

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
 */
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
  var keys = keyDesc.split("+");
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var pressed = false;
    if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
      pressed = this.modifiers[key];
    } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
      pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
    } else {
      pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)];
    }
    if (!pressed) return false;
  }
  return true;
};

/**
 * return true if an event match a keyDesc
 * @param  {KeyboardEvent} event   keyboard event
 * @param  {String} keyDesc string description of the key
 * @return {Boolean}         true if the event match keyDesc, false otherwise
 */
THREEx.KeyboardState.prototype.eventMatches = function (event, keyDesc) {
  var aliases = THREEx.KeyboardState.ALIAS;
  var aliasKeys = Object.keys(aliases);
  var keys = keyDesc.split("+");
  // log to debug
  // console.log("eventMatches", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var pressed = false;
    if (key === "shift") {
      pressed = event.shiftKey ? true : false;
    } else if (key === "ctrl") {
      pressed = event.ctrlKey ? true : false;
    } else if (key === "alt") {
      pressed = event.altKey ? true : false;
    } else if (key === "meta") {
      pressed = event.metaKey ? true : false;
    } else if (aliasKeys.indexOf(key) !== -1) {
      pressed = event.keyCode === aliases[key] ? true : false;
    } else if (event.keyCode === key.toUpperCase().charCodeAt(0)) {
      pressed = true;
    }
    if (!pressed) return false;
  }
  return true;
};

let container, stats, clock, controls;
let lights,
  camera,
  scene,
  renderer,
  human,
  humanGeometry,
  humanMaterial,
  humanMesh,
  robot;
let skinWeight, skinIndices, boneArray, realBones, boneDict, centerOfMass, ballMaterial;

THREE.Object3D.prototype.setMatrix = function (m) {
  this.matrixAutoUpdate = false;
  this.matrix.copy(m);
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};
class Robot {
    constructor(h) {
this.spineLength = 0.65305 ;
		this.chestLength =0.46487;
		this.neckLength = 0.24523
		this.headLength = 0.39284;

		this.armLength = 0.72111;
		this.forearmLength = 0.61242;
		this.legLength = 1.16245;
		this.shinLength = 1.03432;

		this.armLeftRotation = realBones[4].rotation;
		this.forearmLeftRotation = realBones[5].rotation;
		this.armRightRotation  = realBones[6].rotation;
		this.forearmRightRotation = realBones[7].rotation;

		this.legLeftRotation = realBones[8].rotation;
		this.shinLeftRotation = realBones[9].rotation;
		this.legRightRotation = realBones[10].rotation;
		this.shinRightRotation = realBones[11].rotation;

		this.spineTranslation = realBones[0].position;
		this.chestTranslation = realBones[1].position;
		this.neckTranslation = realBones[2].position;
		this.headTranslation = realBones[3].position;

		this.armLeftTranslation = realBones[4].position;
		this.forearmLeftTranslation =  realBones[5].position;
		this.armRightTranslation  = realBones[6].position;
		this.forearmRightTranslation = realBones[7].position;

		this.legLeftTranslation =  realBones[8].position;
		this.shinLeftTranslation =  realBones[9].position;
		this.legRightTranslation=  realBones[10].position;
		this.shinRightTranslation =  realBones[11].position;


        this.bodyWidth = 0.2;
        this.bodyDepth = 0.2;


        this.neckRadius = 0.1;

        this.headRadius = 0.32;


        this.legRadius = 0.10;
        this.thighRadius = 0.1;
        this.footDepth = 0.4;
        this.footWidth = 0.25;

        this.armRadius = 0.10;

        this.handRadius = 0.1;

        this.position = new THREE.Vector3(0, 0, 0);
        this.movementSpeed = 10.0;
        this.rotation = 0; 
        this.rotationSpeed = 7;

        // Material
        this.material = new THREE.MeshNormalMaterial();
        this.human = h;
        // Initial pose
        this.initialize()
    }
    

    initialize() {
      var identity = new THREE.Matrix4().identity(); // matrice identité juste pour des tests
      // Spine geomerty
        var spineGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2,this.spineLength, 64);
        if (!this.hasOwnProperty("spine"))
            this.spine = new THREE.Mesh(spineGeometry, this.material);

		var chestGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2, this.chestLength, 64);
		 if (!this.hasOwnProperty("chest"))
            this.chest = new THREE.Mesh(chestGeometry, this.material);

        // Neck geomerty
        var neckGeometry = new THREE.CylinderGeometry(0.5*this.neckRadius, this.neckRadius, this.neckLength, 64);
        if (!this.hasOwnProperty("neck"))
            this.neck = new THREE.Mesh(neckGeometry, this.material);

        // Head geomerty
        var headGeometry = new THREE.SphereGeometry(this.headLength/2, 64, 3);
        if (!this.hasOwnProperty("head"))
            this.head = new THREE.Mesh(headGeometry, this.material);

        //------------------------------------------------------------------------------------------------

        // Right Arm geomerty  -------------------------------------------------
        var armGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.armLength, 64);
        if (!this.hasOwnProperty("armRight"))
            this.armRight = new THREE.Mesh(armGeometry, this.material);
        // Right Forearm geomerty -------------------------------------------------
        var forearmGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.forearmLength, 64);
        if (!this.hasOwnProperty("forearmRight"))
            this.forearmRight = new THREE.Mesh(forearmGeometry, this.material);
        // Hand geomerty
        var handGeometry = new THREE.SphereGeometry(this.handRadius, 64, 3);
        if (!this.hasOwnProperty("handRight"))
            this.handRight = new THREE.Mesh(handGeometry, this.material);

        //------------------------------------------------------------------------------------------------
        
        // Left Arm geomerty  -------------------------------------------------
        var armLeftGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.armLength, 64);
        if (!this.hasOwnProperty("armLeft"))
            this.armLeft = new THREE.Mesh(armLeftGeometry, this.material);
        // Left Forearm geomerty -------------------------------------------------
        var forearmLeftGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.forearmLength, 64);
        if (!this.hasOwnProperty("forearmLeft"))
            this.forearmLeft = new THREE.Mesh(forearmLeftGeometry, this.material);
        // Left Hand geomerty
        var handLeftGeometry = new THREE.SphereGeometry(this.handRadius, 64, 3);
        if (!this.hasOwnProperty("handLeft"))
            this.handLeft = new THREE.Mesh(handLeftGeometry, this.material);

        //------------------------------------------------------------------------------------------------
        
        // Right Leg geomerty (thigh) -------------------------------------------------
        var legRightGeometry = new THREE.CylinderGeometry(0.5*this.thighRadius, this.thighRadius, this.legLength, 64);
        if (!this.hasOwnProperty("legRight"))
            this.legRight = new THREE.Mesh(legRightGeometry, this.material);
        // Right Shin geomerty -------------------------------------------------
        var shinRightGeometry = new THREE.CylinderGeometry(0.5*this.legRadius, this.legRadius, this.shinLength, 64);
        if (!this.hasOwnProperty("shinRight"))
            this.shinRight = new THREE.Mesh(shinRightGeometry, this.material);

        // Right Foot geomerty
        var footRightGeometry = new THREE.BoxGeometry(this.footWidth, this.handRadius, this.footDepth);
        if (!this.hasOwnProperty("footRight"))
            this.footRight = new THREE.Mesh(footRightGeometry, this.material);

        //------------------------------------------------------------------------------------------------
        
        // Left Leg geomerty (thigh) -------------------------------------------------
        var legLeftGeometry = new THREE.CylinderGeometry(0.5*this.thighRadius, this.thighRadius, this.legLength, 64);
        if (!this.hasOwnProperty("legLeft"))
            this.legLeft = new THREE.Mesh(legLeftGeometry, this.material);
        // Left Shin geomerty -------------------------------------------------
        var shinLeftGeometry = new THREE.CylinderGeometry(0.5*this.legRadius, this.legRadius, this.shinLength, 64);
        if (!this.hasOwnProperty("shinLeft"))
            this.shinLeft = new THREE.Mesh(shinLeftGeometry, this.material);

        // Left Foot geomerty
        var footLeftGeometry = new THREE.BoxGeometry(this.footWidth, this.handRadius, this.footDepth);
        if (!this.hasOwnProperty("footLeft"))
            this.footLeft = new THREE.Mesh(footLeftGeometry, this.material);

        //------------------------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------------
        
        // Spine matrix
        this.spineMatrix = new THREE.Matrix4().set(

                1, 0, 0, 0,
                0, 1, 0, this.spineTranslation.y+this.spineLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        this.chestMatrix = new THREE.Matrix4().set(

                    1, 0, 0, 0,
                    0, 1, 0, this.chestTranslation.y-this.spineLength/2+this.chestLength/2,
                    0, 0, 1, 0,
                    0, 0, 0, 1);
        var chestMatrix =  new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.chestMatrix);


        // Neck matrix
        this.neckMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.neckTranslation.y-this.chestLength/2+this.neckLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);


        // Head matrix
        this.headMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.headTranslation.y-this.neckLength/2+this.headLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);

        //------------------------------------------------------------------------------------------------

        // Right Arm matrix -------------------------------------------------
        var armTranslation = translation(
            this.armRightTranslation.x*2,
            0,  
            this.armRightTranslation.z
        );
        var armRotZ = rotZ(this.armRightRotation.z);
        var armRotY = rotY(this.armRightRotation.y);
        var armRotX = rotX(this.armRightRotation.x);
        this.armRightMatrix = new THREE.Matrix4().multiplyMatrices(armTranslation, armRotZ);
        this.armRightMatrix.multiply(armRotY);
        this.armRightMatrix.multiply(armRotX);
        var armRightMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);
        // Right Forearm matrix -------------------------------------------------
        var forearmTranslation = translation(
            this.forearmRightTranslation.x,
            this.armLength/2 + this.forearmLength/2,
            0
        );
        var forearmRotZ = rotZ(-this.forearmRightRotation.z); 
        var forearmRotY = rotY(this.forearmRightRotation.y);
        var forearmRotX = rotX(this.forearmRightRotation.x);
        this.forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmTranslation, forearmRotZ);
        this.forearmRightMatrix.multiply(forearmRotY);
        this.forearmRightMatrix.multiply(forearmRotX);
        var forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(armRightMatrix, this.forearmRightMatrix);

        // Hand matrix -------------------------------------------------
        this.handRightMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.forearmLength/2 + this.handRadius/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var handRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmRightMatrix, this.handRightMatrix);

        //------------------------------------------------------------------------------------------------

        // Left Arm matrix -------------------------------------------------
        var armLeftTranslation = translation(
            this.armLength,
            0,  
            this.armLeftTranslation.z 
        );
        var armLeftRotZ = rotZ(this.armLeftRotation.z);
        var armLeftRotY = rotY(this.armLeftRotation.y);
        var armLeftRotX = rotX(this.armLeftRotation.x);
        this.armLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftTranslation, armLeftRotZ);
        this.armLeftMatrix.multiply(armLeftRotY);
        this.armLeftMatrix.multiply(armLeftRotX);
        var armLeftMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);
        // Left Forearm matrix -------------------------------------------------
        var forearmLeftTranslation = translation(
            this.forearmLeftTranslation.x,
            this.armLength/2 + this.forearmLength/2,
            0
        );
        var forearmLeftRotZ = rotZ(-this.forearmLeftRotation.z); 
        var forearmLeftRotY = rotY(this.forearmLeftRotation.y);
        var forearmLeftRotX = rotX(this.forearmLeftRotation.x);
        this.forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftTranslation, forearmLeftRotZ);
        var forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftMatrix, this.forearmLeftMatrix);

        // Left Hand matrix -------------------------------------------------
        this.handLeftMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.forearmLength/2 + this.handRadius/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var handLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftMatrix, this.handLeftMatrix);

        //------------------------------------------------------------------------------------------------

        // Right Leg matrix (thigh) -------------------------------------------------
        var legRightTranslation = translation(
            this.legRightTranslation.x,
            -this.spineLength/2 - this.legLength/2,  
            this.legRightTranslation.z
        );
        var legRightRotZ = rotZ(this.legRightRotation.z);
        var legRightRotY = rotY(this.legRightRotation.y);
        var legRightRotX = rotX(this.legRightRotation.x);
        this.legRightMatrix = new THREE.Matrix4().multiplyMatrices(legRightTranslation, legRightRotZ);
        this.legRightMatrix.multiply(legRightRotY);
        // this.legRightMatrix.multiply(legRightRotX);
        var legRightMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legRightMatrix);
        // Right Shin matrix -------------------------------------------------
        var shinRightTranslation = translation(
            this.shinRightTranslation.x,
            this.legLength/2 + this.shinLength/2,
            this.shinRightTranslation.z
        );
        var shinRightRotZ = rotZ(this.shinRightRotation.z); 
        var shinRightRotY = rotY(this.shinRightRotation.y);
        var shinRightRotX = rotX(-this.shinRightRotation.x);
        this.shinRightMatrix = new THREE.Matrix4().multiplyMatrices(shinRightTranslation, shinRightRotZ);
      
        var shinRightMatrix = new THREE.Matrix4().multiplyMatrices(legRightMatrix, this.shinRightMatrix);

        // Right Foot matrix -------------------------------------------------
        this.footRightMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.shinLength/2 + this.handRadius/2,
                0, 0, 1, this.footDepth/4,
                0, 0, 0, 1);
        var footRightMatrix = new THREE.Matrix4().multiplyMatrices(shinRightMatrix, this.footRightMatrix);

        //------------------------------------------------------------------------------------------------

        // Left Leg matrix (thigh) -------------------------------------------------
        var legLeftTranslation = translation(
            this.legLeftTranslation.x,
            -this.spineLength/2 - this.legLength/2,  
            this.legLeftTranslation.z
        );
        var legLeftRotZ = rotZ(this.legLeftRotation.z);
        var legLeftRotY = rotY(this.legLeftRotation.y);
        var legLeftRotX = rotX(this.legLeftRotation.x);
        this.legLeftMatrix = new THREE.Matrix4().multiplyMatrices(legLeftTranslation, legLeftRotZ);
        this.legLeftMatrix.multiply(legLeftRotY);
        // this.legLeftMatrix.multiply(legLeftRotX);
        var legLeftMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legLeftMatrix);
        // Left Shin matrix -------------------------------------------------
        var shinLeftTranslation = translation(
            this.shinLeftTranslation.x,
            this.legLength/2 + this.shinLength/2,
            this.shinLeftTranslation.z
        );
        var shinLeftRotZ = rotZ(this.shinLeftRotation.z); 
        var shinLeftRotY = rotY(this.shinLeftRotation.y);
        var shinLeftRotX = rotX(this.shinLeftRotation.x);
        this.shinLeftMatrix = new THREE.Matrix4().multiplyMatrices(shinLeftTranslation, shinLeftRotZ);
        var shinLeftMatrix = new THREE.Matrix4().multiplyMatrices(legLeftMatrix, this.shinLeftMatrix);

        // Left Foot matrix -------------------------------------------------
        this.footLeftMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.shinLength/2 + this.handRadius/2,
                0, 0, 1, this.footDepth/4,
                0, 0, 0, 1);
        var footLeftMatrix = new THREE.Matrix4().multiplyMatrices(shinLeftMatrix, this.footLeftMatrix);

        // Ball
        var ballGeometry = new THREE.SphereGeometry(0.35, 32, 16);
        
        if (!this.hasOwnProperty("ball")) {
            this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
            this.ball.visible = true; 
        }
        
        this.ballMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, translation(0,-4, 0.5));
        this.ball.setMatrix(this.ballMatrix);




        this.spine.setMatrix(this.spineMatrix);

        if (scene.getObjectById(this.spine.id) === undefined)
            scene.add(this.spine);

		  this.chest.setMatrix(chestMatrix);

        if (scene.getObjectById(this.chest.id) === undefined)
            scene.add(this.chest);

        this.neck.setMatrix(neckMatrix);
        if (scene.getObjectById(this.neck.id) === undefined)
            scene.add(this.neck);

        this.head.setMatrix(headMatrix);
        if (scene.getObjectById(this.head.id) === undefined)
            scene.add(this.head);

        this.armRight.setMatrix(armRightMatrix);
        if (scene.getObjectById(this.armRight.id) === undefined)
            scene.add(this.armRight);

        this.forearmRight.setMatrix(forearmRightMatrix);
        if (scene.getObjectById(this.forearmRight.id) === undefined)
            scene.add(this.forearmRight);

        this.handRight.setMatrix(handRightMatrix);
        if (scene.getObjectById(this.handRight.id) === undefined)
            scene.add(this.handRight);

        this.armLeft.setMatrix(armLeftMatrix);
        if (scene.getObjectById(this.armLeft.id) === undefined)
            scene.add(this.armLeft);

        this.forearmLeft.setMatrix(forearmLeftMatrix);
        if (scene.getObjectById(this.forearmLeft.id) === undefined)
            scene.add(this.forearmLeft);

        this.handLeft.setMatrix(handLeftMatrix);
        if (scene.getObjectById(this.handLeft.id) === undefined)
            scene.add(this.handLeft);

        this.legRight.setMatrix(legRightMatrix);
        if (scene.getObjectById(this.legRight.id) === undefined)
            scene.add(this.legRight);

        this.shinRight.setMatrix(shinRightMatrix);
        if (scene.getObjectById(this.shinRight.id) === undefined)
            scene.add(this.shinRight);

        this.footRight.setMatrix(footRightMatrix);
        if (scene.getObjectById(this.footRight.id) === undefined)
            scene.add(this.footRight);

        this.legLeft.setMatrix(legLeftMatrix);
        if (scene.getObjectById(this.legLeft.id) === undefined)
            scene.add(this.legLeft);

        this.shinLeft.setMatrix(shinLeftMatrix);
        if (scene.getObjectById(this.shinLeft.id) === undefined)
            scene.add(this.shinLeft);

        this.footLeft.setMatrix(footLeftMatrix);
        if (scene.getObjectById(this.footLeft.id) === undefined)
            scene.add(this.footLeft);

        this.ball.setMatrix(this.ballMatrix);
        if (scene.getObjectById(this.ball.id) === undefined)
            scene.add(this.ball);
    }
    hideRobot() {
        this.spine.visible = false;
        this.chest.visible = false;
        this.neck.visible = false;
        this.head.visible = false;
        this.armRight.visible = false;
        this.forearmRight.visible = false;
        this.handRight.visible = false;
        this.armLeft.visible = false;
        this.forearmLeft.visible = false;
        this.handLeft.visible = false;
        this.legRight.visible = false;
        this.shinRight.visible = false;
        this.footRight.visible = false;
        this.legLeft.visible = false;
        this.shinLeft.visible = false;
        this.footLeft.visible = false;
        // this.ball.visible = false;
    }
    hideHuman() {
        this.human.visible = false;
    }

    showRobot() {
        this.spine.visible = true;
        this.chest.visible = true;
        this.neck.visible = true;
        this.head.visible = true;
        this.armRight.visible = true;
        this.forearmRight.visible = true;
        this.handRight.visible = true;
        this.armLeft.visible = true;
        this.forearmLeft.visible = true;
        this.handLeft.visible = true;
        this.legRight.visible = true;
        this.shinRight.visible = true;
        this.footRight.visible = true;
        this.legLeft.visible = true;
        this.shinLeft.visible = true;
        this.footLeft.visible = true;
    }
    showHuman() {
        this.human.visible = true;
    }

  resetPose(){

    this.rotation = 0;
    this.position = new THREE.Vector3(0, 0, 0);

    this.spine.setMatrix(this.spineMatrix);
    
    var chestMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.chestMatrix);
    this.chest.setMatrix(chestMatrix);
    
    var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);
    this.neck.setMatrix(neckMatrix);
    
    var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);
    this.head.setMatrix(headMatrix);

    // Right arm
    var armRightMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);
    this.armRight.setMatrix(armRightMatrix);
    var forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(armRightMatrix, this.forearmRightMatrix);
    this.forearmRight.setMatrix(forearmRightMatrix);
    var handRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmRightMatrix, this.handRightMatrix);
    this.handRight.setMatrix(handRightMatrix);

    // Left arm
    var armLeftMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);
    this.armLeft.setMatrix(armLeftMatrix);
    var forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftMatrix, this.forearmLeftMatrix);
    this.forearmLeft.setMatrix(forearmLeftMatrix);
    var handLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftMatrix, this.handLeftMatrix);
    this.handLeft.setMatrix(handLeftMatrix);

    // Right leg
    var legRightMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legRightMatrix);
    this.legRight.setMatrix(legRightMatrix);
    var shinRightMatrix = new THREE.Matrix4().multiplyMatrices(legRightMatrix, this.shinRightMatrix);
    this.shinRight.setMatrix(shinRightMatrix);
    var footRightMatrix = new THREE.Matrix4().multiplyMatrices(shinRightMatrix, this.footRightMatrix);
    this.footRight.setMatrix(footRightMatrix);

    // Left leg
    var legLeftMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legLeftMatrix);
    this.legLeft.setMatrix(legLeftMatrix);
    var shinLeftMatrix = new THREE.Matrix4().multiplyMatrices(legLeftMatrix, this.shinLeftMatrix);
    this.shinLeft.setMatrix(shinLeftMatrix);
    var footLeftMatrix = new THREE.Matrix4().multiplyMatrices(shinLeftMatrix, this.footLeftMatrix);
    this.footLeft.setMatrix(footLeftMatrix);
    
    this.ball.visible = false;
    
    updateShaderBones(this);
  }
	pose1(){
		// Spider-Man crouching pose

    this.rotation = 0;
    this.position = new THREE.Vector3(0, 0, 0);
    this.resetPose();
		// Spine
		var spineMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, translation(0, -1.63, 0));
		this.spine.setMatrix(spineMatrix);

		// Chest
		var chestMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.chestMatrix);
		this.chest.setMatrix(chestMatrix);
		
		// Neck, Head
		var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);
		this.neck.setMatrix(neckMatrix);
		var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);
		this.head.setMatrix(headMatrix);
		
		// RIGHT ARM 
		var armRightMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);
    
    armRightMatrix.multiply(rotZ(Math.PI/8))
    armRightMatrix.multiply(rotX(-Math.PI/2))
    armRightMatrix.multiply(rotY(-Math.PI/1.5)) 
    armRightMatrix.multiply(translation(0,0.5,0))

		this.armRight.setMatrix(armRightMatrix);
		var forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(armRightMatrix, this.forearmRightMatrix);
		this.forearmRight.setMatrix(forearmRightMatrix);
		var handRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmRightMatrix, this.handRightMatrix);
		this.handRight.setMatrix(handRightMatrix);
		
		var armLeftMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);
    
    armLeftMatrix.multiply(rotX(Math.PI/5))
    this.armLeft.setMatrix(armLeftMatrix);

		var forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftMatrix, this.forearmLeftMatrix);

    forearmLeftMatrix.multiply(translation(0, -this.forearmLength/2, 0)); 
    forearmLeftMatrix.multiply(rotX(-Math.PI/4)); 
    forearmLeftMatrix.multiply(translation(0, this.forearmLength/2, 0)); 

		this.forearmLeft.setMatrix(forearmLeftMatrix);
		var handLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftMatrix, this.handLeftMatrix);
		this.handLeft.setMatrix(handLeftMatrix);
		
		// RIGHT LEG 
		var legRightRot = rotX(-Math.PI/2.5); 
		var legRightMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.legRightMatrix);
		legRightMatrix.multiply(translation(0, -this.legLength/2, 0));
		legRightMatrix.multiply(legRightRot);
    legRightMatrix.multiply(rotZ(-Math.PI/4))
		legRightMatrix.multiply(translation(0, this.legLength/2, 0));
		this.legRight.setMatrix(legRightMatrix);
		
		// Right shin 
		var shinRightMatrix = new THREE.Matrix4().multiplyMatrices(legRightMatrix, this.shinRightMatrix);
		shinRightMatrix.multiply(translation(0, -this.shinLength/2, 0));
		shinRightMatrix.multiply(rotX(Math.PI/1.2));
		shinRightMatrix.multiply(translation(0, this.shinLength/2, 0)); 
		this.shinRight.setMatrix(shinRightMatrix);
		
		var footRightMatrix = new THREE.Matrix4().multiplyMatrices(shinRightMatrix, this.footRightMatrix);
		this.footRight.setMatrix(footRightMatrix);
		
		// LEFT LEG 
		var legLeftRot = rotX(-Math.PI/2.5); 
		var legLeftMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.legLeftMatrix);
		legLeftMatrix.multiply(translation(0, -this.legLength/2, 0));
		legLeftMatrix.multiply(legLeftRot);
    legLeftMatrix.multiply(rotZ(Math.PI/6))
		legLeftMatrix.multiply(translation(0, this.legLength/2, 0));
    this.legLeft.setMatrix(legLeftMatrix);
		
		// Left shin 
		var shinLeftMatrix = new THREE.Matrix4().multiplyMatrices(legLeftMatrix, this.shinLeftMatrix);
		shinLeftMatrix.multiply(translation(0, -this.shinLength/2, 0)); 
		shinLeftMatrix.multiply(rotX(Math.PI/1.2)); 
		shinLeftMatrix.multiply(translation(0, this.shinLength/2, 0));
		this.shinLeft.setMatrix(shinLeftMatrix);
		
		var footLeftMatrix = new THREE.Matrix4().multiplyMatrices(shinLeftMatrix, this.footLeftMatrix);
		this.footLeft.setMatrix(footLeftMatrix);
		
		
		updateShaderBones(this);
	}

	
  pose2(){
    
    // Backflip Kick
    
    this.rotation = 0;
    this.position = new THREE.Vector3(0, 0, 0);
    this.resetPose();

    var spineMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, translation(0, 0.5332, 0));
    spineMatrix.multiply(rotX(Math.PI/2.1)); 
    this.spine.setMatrix(spineMatrix);    
   
    var chestMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.chestMatrix);
    chestMatrix.multiply(rotX(-Math.PI/10)); 
    this.chest.setMatrix(chestMatrix);
    
    var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);
    neckMatrix.multiply(rotX(-Math.PI/15));
    this.neck.setMatrix(neckMatrix);
    
    var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);
    headMatrix.multiply(rotX(-Math.PI/10));
    this.head.setMatrix(headMatrix);

    // Right arm
    var armRightMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);
    armRightMatrix.multiply(translation(0, -this.armLength/2, 0)); 
    armRightMatrix.multiply(rotX(-Math.PI/12)); 
    armRightMatrix.multiply(translation(0, this.armLength/2, 0)); 
    this.armRight.setMatrix(armRightMatrix);

    var forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(armRightMatrix, this.forearmRightMatrix);
    
    forearmRightMatrix.multiply(translation(0, -this.forearmLength/2, 0)); 
    forearmRightMatrix.multiply(rotX(-Math.PI/4)); 
    forearmRightMatrix.multiply(translation(0, this.forearmLength/2, 0)); 
    
    this.forearmRight.setMatrix(forearmRightMatrix);
    var handRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmRightMatrix, this.handRightMatrix);
    this.handRight.setMatrix(handRightMatrix);

    // Left arm
    var armLeftMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);
    armLeftMatrix.multiply(translation(0, -this.armLength/2, 0)); 
    armLeftMatrix.multiply(rotZ(-Math.PI/4));
    armLeftMatrix.multiply(translation(0, this.armLength/2, 0)); 
    this.armLeft.setMatrix(armLeftMatrix);

    var forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftMatrix, this.forearmLeftMatrix);
    forearmLeftMatrix.multiply(translation(0, -this.forearmLength/2, 0)); 
    forearmLeftMatrix.multiply(rotZ(-Math.PI/12)); 
    forearmLeftMatrix.multiply(translation(0, this.forearmLength/2, 0)); 
    this.forearmLeft.setMatrix(forearmLeftMatrix);

    var handLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftMatrix, this.handLeftMatrix);
    handLeftMatrix.multiply(translation(0, -this.handRadius/2, 0)); 
    handLeftMatrix.multiply(rotX(Math.PI/6));
    handLeftMatrix.multiply(translation(0, this.handRadius/2, 0)); 
    this.handLeft.setMatrix(handLeftMatrix);

    // Right leg 
    var legRightMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.legRightMatrix);
    legRightMatrix.multiply(translation(0, -this.legLength/2, 0));
    legRightMatrix.multiply(rotX(-Math.PI/15));
    legRightMatrix.multiply(translation(0, this.legLength/2, 0));
    this.legRight.setMatrix(legRightMatrix);

    var shinRightMatrix = new THREE.Matrix4().multiplyMatrices(legRightMatrix, this.shinRightMatrix);
    shinRightMatrix.multiply(translation(0, -this.shinLength/2, 0)); 
    shinRightMatrix.multiply(rotX(Math.PI/2)); 
    shinRightMatrix.multiply(translation(0, this.shinLength/2, 0)); 
    this.shinRight.setMatrix(shinRightMatrix);
    var footRightMatrix = new THREE.Matrix4().multiplyMatrices(shinRightMatrix, this.footRightMatrix);
    this.footRight.setMatrix(footRightMatrix);

    // Left leg 
    var legLeftMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.legLeftMatrix);
    legLeftMatrix.multiply(translation(0, -this.legLength/2, 0));
    legLeftMatrix.multiply(rotX(-Math.PI/2.5));
    legLeftMatrix.multiply(translation(0, this.legLength/2, 0));
    this.legLeft.setMatrix(legLeftMatrix);
    var shinLeftMatrix = new THREE.Matrix4().multiplyMatrices(legLeftMatrix, this.shinLeftMatrix);
    this.shinLeft.setMatrix(shinLeftMatrix);
    var footLeftMatrix = new THREE.Matrix4().multiplyMatrices(shinLeftMatrix, this.footLeftMatrix);
    this.footLeft.setMatrix(footLeftMatrix);
    
    
    // Ball
    var ballMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, translation(0, -0.2, 2));
    this.ball.setMatrix(ballMatrix);
    this.ball.visible = true
    updateShaderBones(this);
  }

  updateMovement(t) {
    if (channel !== 0) return;
    
    if (!this.lastTime) this.lastTime = t;
    const deltaTime = t - this.lastTime;
    this.lastTime = t;
    
    if (keyboard.pressed("w")) {
      this.position.x -= Math.sin(this.rotation) * this.movementSpeed * deltaTime;
      this.position.z += Math.cos(this.rotation) * this.movementSpeed * deltaTime;
    }

    if (keyboard.pressed("s")) {
      this.position.x += Math.sin(this.rotation) * this.movementSpeed * deltaTime;
      this.position.z -= Math.cos(this.rotation) * this.movementSpeed * deltaTime;
    }
    
    if (keyboard.pressed("a")) {
      this.rotation -= this.rotationSpeed * deltaTime; 
      if (this.rotation < 0) this.rotation += 2 * Math.PI;
    }

    if (keyboard.pressed("d")) {
      this.rotation += this.rotationSpeed * deltaTime; 
      if (this.rotation >= 2 * Math.PI) this.rotation -= 2 * Math.PI;
    }
  }

  animate(t) {
    // this.resetPose();
    
    this.updateMovement(t);
    
    const cycleSpeed = 8.0; 
    const cycle = (t * cycleSpeed) % (2 * Math.PI);
    

    const rightLegPhase = cycle;
    const leftLegPhase = cycle + Math.PI;
    
   
    this.applyRunningMotion(rightLegPhase, leftLegPhase, t);
    
    updateShaderBones(this);
  }

  applyRunningMotion(rightPhase, leftPhase, t) {
    const bodyBob = Math.sin(rightPhase * 2) * 0.1; 
    const bodyLean = Math.sin(rightPhase) * 0.05; 
    
    this.animateBody(bodyBob, bodyLean);
    
    // Spine, Chest
    var spineMatrix = this.spine.matrix;
    var chestMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.chestMatrix);
    this.chest.setMatrix(chestMatrix);
    
    // Neck, Head
    this.animateUpperBody(chestMatrix);
    
    // Arms  
    this.animateArm('right', leftPhase + Math.PI, chestMatrix);  
    this.animateArm('left', rightPhase + Math.PI, chestMatrix);   
    
    // Legs
    this.animateLeg('right', rightPhase, spineMatrix);
    this.animateLeg('left', leftPhase, spineMatrix);
  }

  animateBody(bodyBob, bodyLean) {
    var spineMatrix = new THREE.Matrix4().multiplyMatrices(
      this.spineMatrix,
      translation(this.position.x, this.position.y + bodyBob, this.position.z + bodyLean)
    );
    spineMatrix.multiply(rotY(this.rotation));
    spineMatrix.multiply(rotX(-Math.PI/20));

    //this.spineMatrix = spineMatrix;
    
    this.spine.setMatrix(spineMatrix);
  

    // Ball 
    var ballMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, translation(0, - this.legLength - this.shinLength + this.footDepth, 2));
    this.ball.setMatrix(ballMatrix);
    this.ball.visible = true

  }

  

  animateUpperBody(chestMatrix) {
    var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);
    this.neck.setMatrix(neckMatrix);
    
    var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);
    this.head.setMatrix(headMatrix);
  }

  animateArm(side, phase, chestMatrix) {
    var armMatrix, forearmMatrix, handMatrix;
    
    var armSwing = Math.sin(phase) * Math.PI/4; 
    
    var elbowBend;
    if (Math.sin(phase) < 0) {
      elbowBend = Math.abs(Math.sin(phase)) * Math.PI/2; 
    } else {
      elbowBend = Math.abs(Math.sin(phase)) * Math.PI/9; 
    }
    
    if (side === 'right') {
      // Righ arm
      armMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);
      armMatrix.multiply(translation(0, -this.armLength/2, 0)); 
      armMatrix.multiply(rotX(armSwing)); 
      armMatrix.multiply(rotZ(Math.PI/8));
      armMatrix.multiply(translation(0, this.armLength/2, 0)); 
      this.armRight.setMatrix(armMatrix);
      
      // Right forearm 
      forearmMatrix = new THREE.Matrix4().multiplyMatrices(armMatrix, this.forearmRightMatrix);
      forearmMatrix.multiply(translation(0, -this.forearmLength/2, 0)); 
      forearmMatrix.multiply(rotX(-elbowBend)); 
      forearmMatrix.multiply(translation(0, this.forearmLength/2, 0)); 
      this.forearmRight.setMatrix(forearmMatrix);
      
      // Right hand
      handMatrix = new THREE.Matrix4().multiplyMatrices(forearmMatrix, this.handRightMatrix);
      this.handRight.setMatrix(handMatrix);
      
    } else { 
      // left arm
      armMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);
      armMatrix.multiply(translation(0, -this.armLength/2, 0)); 
      armMatrix.multiply(rotX(armSwing)); 
      armMatrix.multiply(rotZ(-Math.PI/8)); 
      armMatrix.multiply(translation(0, this.armLength/2, 0)); 
      this.armLeft.setMatrix(armMatrix);
      
      // Left forearm 
      forearmMatrix = new THREE.Matrix4().multiplyMatrices(armMatrix, this.forearmLeftMatrix);
      forearmMatrix.multiply(translation(0, -this.forearmLength/2, 0)); 
      forearmMatrix.multiply(rotX(-elbowBend)); 
      forearmMatrix.multiply(translation(0, this.forearmLength/2, 0)); 
      this.forearmLeft.setMatrix(forearmMatrix);
      
      // Left hand
      handMatrix = new THREE.Matrix4().multiplyMatrices(forearmMatrix, this.handLeftMatrix);
      this.handLeft.setMatrix(handMatrix);
    }
  }

  animateLeg(side, phase, spineMatrix) {
    var legMatrix, shinMatrix, footMatrix;
    
    var thighSwing = Math.sin(phase) * Math.PI/3; 
    var kneeFlexion = (Math.sin(phase * 2) * 0.5 + 0.7) * Math.PI/3; 
    
    if (side === 'right') {
      // Right leg 
      legMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.legRightMatrix);
      legMatrix.multiply(translation(0, -this.legLength/2, 0));
      legMatrix.multiply(rotX(thighSwing)); 
      legMatrix.multiply(translation(0, this.legLength/2, 0)); 
      this.legRight.setMatrix(legMatrix);
      
      // Right shin 
      shinMatrix = new THREE.Matrix4().multiplyMatrices(legMatrix, this.shinRightMatrix);
      shinMatrix.multiply(translation(0, -this.shinLength/2, 0)); 
      shinMatrix.multiply(rotX(kneeFlexion)); 
      shinMatrix.multiply(translation(0, this.shinLength/2, 0)); 
      this.shinRight.setMatrix(shinMatrix);
      
      // Right foot
      footMatrix = new THREE.Matrix4().multiplyMatrices(shinMatrix, this.footRightMatrix);
      this.footRight.setMatrix(footMatrix);
      
    } else { 
      // left leg
      legMatrix = new THREE.Matrix4().multiplyMatrices(spineMatrix, this.legLeftMatrix);
      legMatrix.multiply(translation(0, -this.legLength/2, 0));
      legMatrix.multiply(rotX(thighSwing)); 
      legMatrix.multiply(translation(0, this.legLength/2, 0)); 
      this.legLeft.setMatrix(legMatrix);
      
      // Left shin 
      shinMatrix = new THREE.Matrix4().multiplyMatrices(legMatrix, this.shinLeftMatrix);
      shinMatrix.multiply(translation(0, -this.shinLength/2, 0)); 
      shinMatrix.multiply(rotX(kneeFlexion)); 
      shinMatrix.multiply(translation(0, this.shinLength/2, 0)); 
      this.shinLeft.setMatrix(shinMatrix);
      
      // Left foot
      footMatrix = new THREE.Matrix4().multiplyMatrices(shinMatrix, this.footLeftMatrix);
      this.footLeft.setMatrix(footMatrix);
    }
  }

}

var keyboard = new THREEx.KeyboardState();
var channel = "p";
var pi = Math.PI;


function init() {
  container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(5,3,5); // 8,10,8  = camera de base
  camera.lookAt(0, 3, 0);

  scene = new THREE.Scene();
  scene.add(camera);

  controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;

  clock = new THREE.Clock();

  boneDict = {};

  boneArray = new Float32Array(12 * 16);

  humanMaterial = new THREE.ShaderMaterial({
    uniforms: {
      bones: {
        value: boneArray,
      },
    },
  });

  const shaderLoader = new THREE.FileLoader();
  shaderLoader.load("glsl/human.vs.glsl", function (data) {
    humanMaterial.vertexShader = data;
  });
  shaderLoader.load("glsl/human.fs.glsl", function (data) {
    humanMaterial.fragmentShader = data;
  });

  ballMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
    }
  });

  const ballShaderLoader = new THREE.FileLoader();
  ballShaderLoader.load("glsl/ball.vs.glsl", function (data) {
    ballMaterial.vertexShader = data;
  });
  ballShaderLoader.load("glsl/ball.fs.glsl", function (data) {
    ballMaterial.fragmentShader = data;
  });

  // loading manager

  const loadingManager = new THREE.LoadingManager(function () {
    scene.add(humanMesh);
  });

  // collada
  humanGeometry = new THREE.BufferGeometry();
  const loader = new ColladaLoader(loadingManager);
  loader.load("./model/human.dae", function (collada) {
    skinIndices =
      collada.library.geometries["human-mesh"].build.triangles.data.attributes
        .skinIndex.array;
    skinWeight =
      collada.library.geometries["human-mesh"].build.triangles.data.attributes
        .skinWeight.array;
    realBones = collada.library.nodes.human.build.skeleton.bones;

    buildSkeleton();
    buildShaderBoneMatrix();
    humanGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        collada.library.geometries[
          "human-mesh"
        ].build.triangles.data.attributes.position.array,
        3
      )
    );
    humanGeometry.setAttribute(
      "skinWeight",
      new THREE.BufferAttribute(skinWeight, 4)
    );
    humanGeometry.setAttribute(
      "skinIndex",
      new THREE.BufferAttribute(skinIndices, 4)
    );
    humanGeometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(
        collada.library.geometries[
          "human-mesh"
        ].build.triangles.data.attributes.normal.array,
        3
      )
    );

   
        
    
    humanMesh = new THREE.Mesh(humanGeometry, humanMaterial);
    robot = new Robot(humanMesh);
    robot.hideHuman();
    // robot.pose1();
    //robot.pose2()
  });

  //

  const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 0).normalize();
  scene.add(directionalLight);

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  //

  stats = new Stats();
  container.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);
  lights = [];
  lights[0] = new THREE.PointLight(0xffffff, 1, 0);
  lights[1] = new THREE.PointLight(0xffffff, 1, 0);
  lights[2] = new THREE.PointLight(0xffffff, 1, 0);

  lights[0].position.set(0, 200, 0);
  lights[1].position.set(100, 200, 100);
  lights[2].position.set(-100, -200, -100);

  scene.add(lights[0]);
  scene.add(lights[1]);
  scene.add(lights[2]);

  

  var floorTexture = new THREE.TextureLoader().load(
    "textures/hardwood2_diffuse.jpg"
  );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(4, 4);

  var floorMaterial = new THREE.MeshBasicMaterial({
    map: floorTexture,
    side: THREE.DoubleSide,
  });
  var floorGeometry = new THREE.PlaneGeometry(30, 30);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI / 2;
  floor.position.y -= 2.5;
  scene.add(floor);
  
}

function buildSkeleton() {
  boneDict["Spine"] = new THREE.Bone();
    boneDict["Chest"] = new THREE.Bone();
    boneDict["Neck"] = new THREE.Bone();
    boneDict["Head"] = new THREE.Bone();
    boneDict["Arm_L"] = new THREE.Bone();
    boneDict["Forearm_L"] = new THREE.Bone();
    boneDict["Arm_R"] = new THREE.Bone();
    boneDict["Forearm_R"] = new THREE.Bone();
    boneDict["Leg_L"] = new THREE.Bone();
    boneDict["Shin_L"] = new THREE.Bone();
    boneDict["Leg_R"] = new THREE.Bone();
    boneDict["Shin_R"] = new THREE.Bone();
  
    boneDict['Chest'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[1].matrix);
    boneDict['Neck'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[2].matrix);
    boneDict['Head'].matrixWorld = matMul(boneDict['Neck'].matrixWorld, realBones[3].matrix);
    boneDict['Arm_L'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[4].matrix);
    boneDict['Forearm_L'].matrixWorld = matMul(boneDict['Arm_L'].matrixWorld, realBones[5].matrix);
    boneDict['Arm_R'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[6].matrix);
    boneDict['Forearm_R'].matrixWorld = matMul(boneDict['Arm_R'].matrixWorld, realBones[7].matrix);
    boneDict['Leg_L'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[8].matrix);
    boneDict['Shin_L'].matrixWorld = matMul(boneDict['Leg_L'].matrixWorld, realBones[9].matrix);
    boneDict['Leg_R'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[10].matrix);
    boneDict['Shin_R'].matrixWorld = matMul(boneDict['Leg_R'].matrixWorld, realBones[11].matrix);
  
  // Inverse
  var _boneOrder = [
    "Spine",
    "Chest",
    "Neck",
    "Head",
    "Arm_L",
    "Forearm_L",
    "Arm_R",
    "Forearm_R",
    "Leg_L",
    "Shin_L",
    "Leg_R",
    "Shin_R",
  ];
  for (var _i = 0; _i < _boneOrder.length; _i++) {
    var _k = _boneOrder[_i];
    boneDict[_k].bindMatrix = boneDict[_k].matrixWorld.clone();
    boneDict[_k].invBindMatrix = boneDict[_k].bindMatrix.clone().invert();
  }
}


function updateShaderBones(robot) {

  var tempMatrix = new THREE.Matrix4();
  var invRestMatrix = new THREE.Matrix4();
  var invPivot = new THREE.Matrix4();

  function getInvPivotForBone(key) {
    var m = new THREE.Matrix4().identity();
    switch (key) {
      case "Arm_L":
      case "Arm_R":
        m = translation(0, -robot.armLength / 2, 0);
        break;
      case "Forearm_L":
      case "Forearm_R":
        m = translation(0, -robot.forearmLength / 2, 0);
        break;
      case "Leg_L":
      case "Leg_R":
        m = translation(0, -robot.legLength / 2, 0);
        break;
      case "Shin_L":
      case "Shin_R":
        m = translation(0, -robot.shinLength / 2, 0);
        break;
      default:
        m = new THREE.Matrix4().identity();
    }
    return m;
  }

  // Helper 
  function updateBone(key, currentMatrix) {
    invRestMatrix.copy(boneDict[key].invBindMatrix);
    invPivot.copy(getInvPivotForBone(key));
    invRestMatrix.premultiply(invPivot); 
    tempMatrix.multiplyMatrices(currentMatrix, invRestMatrix);
    boneDict[key].matrix.copy(tempMatrix);
  }

  // Update all bones
  updateBone("Spine", robot.spine.matrix);
  updateBone("Chest", robot.chest.matrix);
  updateBone("Neck", robot.neck.matrix);
  updateBone("Head", robot.head.matrix);
  updateBone("Arm_L", robot.armLeft.matrix);
  updateBone("Forearm_L", robot.forearmLeft.matrix);
  updateBone("Arm_R", robot.armRight.matrix);
  updateBone("Forearm_R", robot.forearmRight.matrix);
  updateBone("Leg_L", robot.legLeft.matrix);
  updateBone("Shin_L", robot.shinLeft.matrix);
  updateBone("Leg_R", robot.legRight.matrix);
  updateBone("Shin_R", robot.shinRight.matrix);

  buildShaderBoneMatrix();
}


function buildShaderBoneMatrix() {
    var c = 0;
    for (var key in boneDict) {
        for (var i = 0; i < 16; i++) {
            boneArray[c++] = boneDict[key].matrix.elements[i];
        }
    }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  checkKeyboard();

  updateBody();
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  const delta = clock.getDelta();

  renderer.render(scene, camera);
}

/**
 * Returns a new Matrix4 as a multiplcation of m1 and m2
 *
 * @param {Matrix4} m1 The first matrix
 * @param {Matrix4} m2 The second matrix
 * @return {Matrix4} m1 x m2
 */
function matMul(m1, m2) {
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

/**
 * Returns a new Matrix4 as a scalar multiplcation of s and m
 *
 * @param {number} s The scalar
 * @param {Matrix4} m The  matrix
 * @return {Matrix4} s * m2
 */
function scalarMul(s, m) {
  var r = m;
  return r.multiplyScalar(s);
}

/**
 * Returns an array containing the x,y and z translation component
 * of a transformation matrix
 *
 * @param {Matrix4} M The transformation matrix
 * @return {Array} x,y,z translation components
 */
function getTranslationValues(M) {
  var elems = M.elements;
  return elems.slice(12, 15);
}

/**
 * Returns a new Matrix4 as a translation matrix of [x,y,z]
 *
 * @param {number} x x component
 * @param {number} y y component
 * @param {number} z z component
 * @return {Matrix4} The translation matrix of [x,y,z]
 */
function translation(x, y, z) {
  //TODO Définir cette fonction
  // you can't use three.js built-in function here
  // you need to build the matrix "manually"
  var m = new THREE.Matrix4();
  m.set(
    1, 0, 0, x,  // Column 1
    0, 1, 0, y,  // Column 2
    0, 0, 1, z,  // Column 3
    0, 0, 0, 1   // Column 4
  );
  return m;
}

/**
 * Returns a new Matrix4 as a rotation matrix of theta radians around the x-axis
 *
 * @param {number} theta The angle expressed in radians
 * @return {Matrix4} The rotation matrix of theta rad around the x-axis
 */
function rotX(theta) {
  //TODO Définir cette fonction
  // you can't use three.js built-in function here
  // you need to build the matrix "manually"
  var m = new THREE.Matrix4();
  m.set(
    1, 0, 0, 0,
    0, cos(theta), sin(theta), 0,
    0, -sin(theta), cos(theta), 0,
    0, 0, 0, 1
  );
  return m;
}

/**
 * Returns a new Matrix4 as a rotation matrix of theta radians around the y-axis
 *
 * @param {number} theta The angle expressed in radians
 * @return {Matrix4} The rotation matrix of theta rad around the y-axis
 */
function rotY(theta) {
  //TODO Définir cette fonction
  var m = new THREE.Matrix4();
  m.set(
    cos(theta), 0, -sin(theta), 0,
    0, 1, 0, 0,
    sin(theta), 0, cos(theta), 0,
    0, 0, 0, 1
  );
  return m;
}

/**
 * Returns a new Matrix4 as a rotation matrix of theta radians around the z-axis
 *
 * @param {number} theta The angle expressed in radians
 * @return {Matrix4} The rotation matrix of theta rad around the z-axis
 */
function rotZ(theta) {
  //TODO Définir cette fonction
  var m = new THREE.Matrix4();
  m.set(
    cos(theta),
    -sin(theta),
    0,
    0,
    sin(theta),
    cos(theta),
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  );
  return m;
}

/**
 * Returns a new Matrix4 as a scaling matrix with factors of x,y,z
 *
 * @param {number} x x component
 * @param {number} y y component
 * @param {number} z z component
 * @return {Matrix4} The scaling matrix with factors of x,y,z
 */
function scale(x, y, z) {
  //TODO Définir cette fonction
  var m = new THREE.Matrix4();
  m.set(
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  );
  return m;
}

function cos(angle) {
  return Math.cos(angle);
}

function sin(angle) {
  return Math.sin(angle);
}

function checkKeyboard() {
  for (var i = 0; i < 10; i++) {
    if (keyboard.pressed(i.toString())) {
      channel = i;
      break;
    }
  }
}
function updateBody() {
  // Check if robot exists first (it's created after Collada loads)
  if (!robot) return;
  
  // Update ball shader time uniform
  if (robot.ball) {
    robot.ball.material.uniforms.time.value = clock.getElapsedTime();
  }
  
  switch (channel) {
    case 0:
      var t = clock.getElapsedTime();
      robot.animate(t); 
      break;

    // add poses here:
    case 1:
      robot.pose1();
      break;

    case 2:
      robot.pose2();
      break;

    case 3:
      break;

    case 4:
      robot.resetPose();
      break;

    case 5:
      break;
    case 6:
      robot.hideRobot();
      break;
    case 7:
      robot.showRobot();
      break;
    case 8:
      robot.hideHuman();
      break;
    case 9:
      robot.showHuman();
      break;
    default:
      break;
  }
}

init();
animate();