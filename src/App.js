import React, { useEffect } from "react";
import "./App.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "./OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

function App() {
  useEffect(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const canvas = document.getElementById("soccer");
    const scene = new THREE.Scene();
    const ballSize = 10;
    const arenaWidth = (screenWidth / 100) * 15;
    const arenaHeight = (screenHeight / 100) * 15;

    // gyroscope

    function getAccel() {
      DeviceMotionEvent.requestPermission().then((response) => {
        if (response === "granted") {
          console.log("acc permission granted");

          window.addEventListener("devicemotion", (event) => {
            console.log(event);
          });
          window.addEventListener("deviceorientation", (event) => {
            console.log(event);
          });
        }
      });
    }

    //camera and render set up

    const camera = new THREE.PerspectiveCamera(
      30,
      screenWidth / screenHeight,
      1,
      2000
    );

    camera.position.z = 300;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    document.getElementById("root").appendChild(renderer.domElement);

    //physics set up

    const physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, 0, -9.82 * 10),
    });

    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });

    const wallL = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });

    groundBody.quaternion.setFromEuler(0, -0.2, 0);
    wallL.quaternion.setFromEuler(0, 1, 0);
    wallL.position.set((arenaWidth / 2) * -1, 0, 0);
    physicsWorld.addBody(groundBody);
    physicsWorld.addBody(wallL);

    const sphereBody = new CANNON.Body({
      mass: 5,
      shape: new CANNON.Sphere(ballSize),
    });
    sphereBody.position.set(0, 0, ballSize + 100);
    physicsWorld.addBody(sphereBody);

    //light

    const hdrTextureURL = new URL(
      "../public/studio_small_03_4k.hdr",
      import.meta.url
    );
    const HDRloader = new RGBELoader();
    HDRloader.load(hdrTextureURL, function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    const orbit = new OrbitControls(camera, renderer.domElement);

    //sphere

    const ballLoader = new GLTFLoader();
    const ballURL = "../ball.glb";
    let loadedBall;
    ballLoader.load(
      ballURL,
      function (gltf) {
        loadedBall = gltf;
        scene.add(gltf.scene);
        gltf.scene.scale.set(100, 100, 100);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );

    const sphereGeo = new THREE.SphereGeometry(ballSize, 128, 128);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: "#006f83",
      roughness: "0.3",
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
    // scene.add(sphere);

    //arena

    const arenaGeo = new THREE.PlaneGeometry(arenaWidth, arenaHeight);
    const arenaMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: "0.3",
    });
    const arenaMaterialWall = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: "0.3",
    });

    const arenaFloor = new THREE.Mesh(arenaGeo, arenaMaterial);
    const arenaWallTop = new THREE.Mesh(arenaGeo, arenaMaterialWall);
    const arenaWallBottom = new THREE.Mesh(arenaGeo, arenaMaterialWall);
    const arenaWallLeft = new THREE.Mesh(arenaGeo, arenaMaterialWall);
    const arenaWallRight = new THREE.Mesh(arenaGeo, arenaMaterialWall);

    scene.add(arenaFloor);
    // scene.add(arenaWallTop);
    // scene.add(arenaWallBottom);
    // scene.add(arenaWallLeft);
    // scene.add(arenaWallRight);

    arenaWallTop.position.y = arenaHeight / 2;
    arenaWallTop.position.z = arenaHeight / 2;
    arenaWallTop.rotation.x = 1.5708;

    arenaWallBottom.position.y = (arenaHeight / 2) * -1;
    arenaWallBottom.position.z = (arenaHeight / 2) * 1;
    arenaWallBottom.rotation.x = 1.5708 * -1;

    arenaWallLeft.position.x = (arenaWidth / 2) * -1;
    arenaWallLeft.position.z = arenaWidth / 2;
    arenaWallLeft.rotation.y = 1.5708;

    arenaWallRight.position.x = arenaWidth / 2;
    arenaWallRight.position.z = arenaWidth / 2;
    arenaWallRight.rotation.y = 1.5708 * -1;

    //animate

    const animate = () => {
      renderer.render(scene, camera);
      physicsWorld.fixedStep();

      if (loadedBall) {
        loadedBall.scene.position.copy(sphereBody.position);
        loadedBall.scene.quaternion.copy(sphereBody.quaternion);
      }

      sphere.position.copy(sphereBody.position);
      sphere.quaternion.copy(sphereBody.quaternion);
      arenaFloor.quaternion.copy(groundBody.quaternion);
      window.requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <>
      <canvas id="soccer"></canvas>
    </>
  );
}

export default App;
