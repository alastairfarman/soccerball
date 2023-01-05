import React, { useEffect, useRef } from "react";
import "./App.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Group } from "three";

function App() {
  const click_ref = useRef(null);

  useEffect(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const canvas = document.getElementById("soccer");
    const scene = new THREE.Scene();
    const ballSize = 10;
    const arenaWidth = (screenWidth / 100) * 17;
    console.log("a width: ", arenaWidth);
    console.log("s width: ", screenWidth);
    const arenaHeight = (screenHeight / 100) * 17;
    console.log("a height :", arenaHeight);
    console.log("s height: ", screenHeight);

    const ceilingHeight = new CANNON.Vec3(0, 0, ballSize * 2 + 40);

    let deviceBetaRotation = 0;
    // let deviceBetaRotationDeg = 0;
    let deviceGammaRotation = 0;
    let deviceAlphaRotation = 0;

    //start function

    function handleClick() {
      startMotionDetection();
      document.getElementById("play-button").style.display = "none";
    }

    //access useRef function (necessary for iOS permission)

    click_ref.current = handleClick;

    // Device motion functions

    function startMotionDetection() {
      console.log("Checking for iOS device");
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        console.log("iOS device - ask permission");
        DeviceMotionEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === "granted") {
              //can i remove this event listener to improve iOS performance
              window.addEventListener("devicemotion", () => {
                detectMotion();
              });
            }
          })
          .catch(console.error);
      } else {
        console.log("Not iOS device, no permission necessary");
        detectMotion();
      }
    }

    function throttle(callback, interval) {
      let enableCall = true;

      return function (...args) {
        if (!enableCall) return;

        enableCall = false;
        callback.apply(this, args);
        setTimeout(() => (enableCall = true), interval);
      };
    }

    function detectMotion() {
      "Attempting to detect motion";
      window.addEventListener(
        "deviceorientation",
        throttle(updateSceneOrientation, 500)
      );
    }

    function updateSceneOrientation(event) {
      console.log("scene updated");
      //get gyroscope position and convert deg to rad

      deviceBetaRotation = event.beta * (Math.PI / 180);
      deviceGammaRotation = event.gamma * (Math.PI / 180);
      deviceAlphaRotation = event.alpha * (Math.PI / 180);

      //////check how vertical device is on 0-1 scale to modify alpha/gamma rotation influence - didn't work as intended and not neccessary

      // deviceBetaRotationDeg = event.beta;

      // const influenceFactor = deviceBetaRotationPosNormal();

      // function deviceBetaRotationPosNormal() {
      //   return normalizeDegScale(convertToPositve(deviceBetaRotationDeg));
      // }

      // function convertToPositve(num) {
      //   return Math.abs(num);
      // }

      // function normalizeDegScale(num) {
      //   return num / 90;
      // }

      //move box

      // box.quaternion.setFromEuler(
      //   deviceBetaRotation,
      //   deviceGammaRotation * (1 - influenceFactor),
      //   deviceAlphaRotation * influenceFactor
      // );

      // //move camera

      // cameraControl.quaternion.setFromEuler(
      //   new THREE.Euler(
      //     deviceBetaRotation,
      //     deviceGammaRotation * (1 - influenceFactor),
      //     deviceAlphaRotation * influenceFactor
      //   )
      // );

      /////////// simple fix

      box.quaternion.setFromEuler(
        deviceBetaRotation,
        deviceGammaRotation,
        deviceAlphaRotation
      );

      //move camera

      cameraControl.quaternion.setFromEuler(
        new THREE.Euler(
          deviceBetaRotation,
          deviceGammaRotation,
          deviceAlphaRotation
        )
      );
    }

    //camera and render set up

    const camera = new THREE.PerspectiveCamera(
      30,
      screenWidth / screenHeight,
      1,
      2000
    );

    camera.position.z = 300;

    const cameraControl = new Group();
    cameraControl.add(camera);
    scene.add(cameraControl);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });

    renderer.setSize(screenWidth, screenHeight, false);
    console.log("device pixel ratio", window.devicePixelRatio);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById("root").appendChild(renderer.domElement);

    //physics set up

    const physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, 0, -9.82 * 30),
    });

    const spherePhysMat = new CANNON.Material();
    const groundPhysMat = new CANNON.Material();

    // ball bounciness

    const groundContactMat = new CANNON.ContactMaterial(
      groundPhysMat,
      spherePhysMat,
      { restitution: 0.5 }
    );

    physicsWorld.addContactMaterial(groundContactMat);

    const box = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: groundPhysMat,
    });

    const groundBody = new CANNON.Plane();
    const wallL = new CANNON.Plane();
    const wallR = new CANNON.Plane();
    const wallT = new CANNON.Plane();
    const wallB = new CANNON.Plane();
    const ceiling = new CANNON.Plane();

    box.addShape(groundBody);

    box.addShape(
      wallL,
      new CANNON.Vec3((arenaWidth / 2) * -1, 0, 0),
      new CANNON.Quaternion(0, 0.707, 0, 0.707)
    );

    box.addShape(
      wallR,
      new CANNON.Vec3(arenaWidth / 2, 0, 0),
      new CANNON.Quaternion(0, -0.707, 0, 0.707)
    );

    box.addShape(
      wallT,
      new CANNON.Vec3(0, arenaHeight / 2, 0),
      new CANNON.Quaternion(0.707, 0, 0, 0.707)
    );

    box.addShape(
      wallB,
      new CANNON.Vec3(0, (arenaHeight / 2) * -1, 0),
      new CANNON.Quaternion(-0.707, 0, 0, 0.707)
    );

    box.addShape(ceiling, ceilingHeight, new CANNON.Quaternion(0, 1, 0, 0));

    physicsWorld.addBody(box);

    const sphereBody = new CANNON.Body({
      mass: 200,
      shape: new CANNON.Sphere(ballSize),
      material: spherePhysMat,
    });

    sphereBody.position.set(0, 0, ballSize + 10);
    physicsWorld.addBody(sphereBody);

    //light

    //shadow caster

    const Dlight = new THREE.DirectionalLight(0xffffff, 1);
    Dlight.position.set(100, 150, 300);
    Dlight.castShadow = true;
    Dlight.shadow.camera.top = 200;
    Dlight.shadow.camera.bottom = -200;
    Dlight.shadow.camera.right = 200;
    Dlight.shadow.camera.left = -200;
    Dlight.shadow.mapSize.set(4096 * 2, 4096 * 2);

    scene.add(Dlight);

    //fill & reflections HDRI texture

    const hdrTextureURL = new URL(
      "../public/studio_small_03_4k.hdr",
      import.meta.url
    );
    const HDRloader = new RGBELoader();
    HDRloader.load(hdrTextureURL, function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    //soccerball model (slightly larger than physics)

    const ballLoader = new GLTFLoader();
    const ballURL = "./ball.glb";
    let loadedBall;
    ballLoader.load(
      ballURL,
      function (gltf) {
        loadedBall = gltf;
        scene.add(gltf.scene);
        gltf.scene.scale.set(95, 95, 95);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );

    //fallback sphere if model load fails (matches physics geo)

    const sphereGeo = new THREE.SphereGeometry(ballSize, 128, 128);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: "1",
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
    sphere.castShadow = true;
    scene.add(sphere);

    //box graphics

    const arenaGeo = new THREE.PlaneGeometry(
      arenaWidth + arenaWidth * 0.5,
      arenaHeight + arenaHeight * 0.5
    );
    const arenaMaterial = new THREE.MeshStandardMaterial({
      color: "#AAAAAA",
      roughness: "0.5",
    });

    const arenaFloor = new THREE.Mesh(arenaGeo, arenaMaterial);
    arenaFloor.receiveShadow = true;

    scene.add(arenaFloor);

    // animate (runs physics)

    const animate = () => {
      renderer.render(scene, camera);
      physicsWorld.fixedStep();

      //pair graphics to physics

      if (loadedBall) {
        loadedBall.scene.position.copy(sphereBody.position);
        loadedBall.scene.quaternion.copy(sphereBody.quaternion);
      }

      sphere.position.copy(sphereBody.position);
      sphere.quaternion.copy(sphereBody.quaternion);
      arenaFloor.quaternion.copy(box.quaternion);

      window.requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <>
      <h1 id="title">Soccerball</h1>
      <canvas id="soccer"></canvas>
      <button id="play-button" onClick={() => click_ref.current()}>
        Play
      </button>
    </>
  );
}

export default App;
