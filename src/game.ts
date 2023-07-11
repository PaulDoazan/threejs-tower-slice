import * as THREE from "three";
import * as CANNON from "cannon-es";
import quotes from "./quotes.json"
import "../assets/style.css"

const bestScoreElement = document.querySelector('.best-score') as HTMLInputElement;
const commentElement = document.querySelector('.comment') as HTMLInputElement;
const scoreElement = document.querySelector('.score') as HTMLInputElement;

type Layer = { threejs: THREE.Mesh, cannonjs: CANNON.Body, width: number, depth: number, direction: string }

let world: CANNON.World
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let originalBoxSize = 3
let boxHeight = 1
let stack: Layer[] = []
let overhangs: Layer[] = []
let falls = true
let gameEnded = false
let forwardX: number
let forwardZ: number
let bestScore: number

init();

function init() {
    console.log(quotes)
    forwardX = 1
    forwardZ = 1
    bestScore = -1

    // Create physics engine
    world = new CANNON.World()
    world.gravity.set(0, -10, 0)
    world.broadphase = new CANNON.NaiveBroadphase();
    (world.solver as CANNON.GSSolver).iterations = 40

    // Add scene
    scene = new THREE.Scene()

    // Add Layer
    // addLayer(0, 0, originalBoxSize, originalBoxSize)
    // addLayer(0, 0, originalBoxSize, originalBoxSize)

    // Set up lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(15, 30, 0)
    scene.add(directionalLight)

    // Camera
    const width: number = 15
    const height: number = width * (window.innerHeight / window.innerWidth)
    camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        1,
        1000
    )

    camera.position.set(6, 6, 6)
    camera.lookAt(0, 0, 0)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    // renderer.render(scene, camera)
    renderer.setAnimationLoop(animation)
    document.body.appendChild(renderer.domElement)

    startGame()
}

function addLayer(x: number, z: number, width: number, depth: number, direction: string = 'x') {
    const y = boxHeight * stack.length
    const layer = generateBox(x, y, z, width, depth)
    layer.direction = direction

    stack.push(layer)
}

function generateBox(x: number, y: number, z: number, width: number, depth: number, isOverhang = false) {
    // ThreeJS
    const geometry = new THREE.BoxGeometry(width, boxHeight, depth)
    const lastIndex = gameEnded || isOverhang ? stack.length - 1 : stack.length
    const color = new THREE.Color(`hsl(${30 + lastIndex * 4}, 100%, 50%)`)
    const material = new THREE.MeshLambertMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z);
    scene.add(mesh)

    // CannonJS
    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
    )

    let mass = falls ? 5 : 0
    const body = new CANNON.Body({ mass, shape })
    body.position.set(x, y, z)
    world.addBody(body)

    const layer: Layer = {
        threejs: mesh,
        cannonjs: body,
        width,
        depth,
        direction: 'x'
    }

    return layer
}

window.addEventListener('pointerdown', () => {
    if (gameEnded) {
        gameEnded = false
        startGame()
        return
    }
    const topLayer = stack[stack.length - 1]
    const previousLayer = stack[stack.length - 2]

    const direction = topLayer.direction
    let delta
    if (direction === 'x') {
        delta = topLayer.threejs.position.x - previousLayer.threejs.position.x
    } else {
        delta = topLayer.threejs.position.z - previousLayer.threejs.position.z
    }

    const overhangSize = Math.abs(delta)
    const size = direction === 'x' ? topLayer.width : topLayer.depth
    const overlap = size - overhangSize

    if (overlap > 0) {
        // Cut layer
        const newDimensions = cutBox(topLayer, overlap, size, delta)

        // overhang
        const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta)
        const overhangX = direction === 'x' ? topLayer.threejs.position.x + overhangShift : topLayer.threejs.position.x
        const overhangZ = direction === 'z' ? topLayer.threejs.position.z + overhangShift : topLayer.threejs.position.z
        const overhangWidth = direction === 'x' ? overhangSize : newDimensions.newWidth
        const overhangDepth = direction === 'z' ? overhangSize : newDimensions.newDepth

        addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth)
        scoreElement.innerText = overhangs.length.toString()
    } else {
        missedTheSpot();
        return;
    }

    // next layer
    const nextX = direction == "x" ? topLayer.threejs.position.x : -5
    const nextZ = direction == "z" ? topLayer.threejs.position.z : -5;
    forwardX = 1
    forwardZ = 1
    const newWidth = topLayer.width
    const newDepth = topLayer.depth
    const nextDirection = direction === 'x' ? 'z' : 'x'

    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection)
})

function missedTheSpot() {
    commentElement.style.transition = 'opacity 1s'
    bestScoreElement.style.transition = 'opacity 1s'

    const topLayer = stack[stack.length - 1];

    gameEnded = true;
    // Turn to top layer into an overhang and let it fall down
    addOverhang(
        topLayer.threejs.position.x,
        topLayer.threejs.position.z,
        topLayer.width,
        topLayer.depth,
    );
    world.removeBody(topLayer.cannonjs);
    scene.remove(topLayer.threejs);

    bestScoreElement.style.opacity = '1'
    if (bestScore === -1 && stack.length - 2 === 0) {
        commentElement.innerHTML = `<div class='quote'>"Il y a un début à tout !"</div>`
        bestScoreElement.innerText = `Best : ${(stack.length - 2).toString()}`
        bestScore = stack.length - 2
    } else if (stack.length - 2 > bestScore) {
        // win
        let index = getRandomIntInclusive(0, quotes.win.length - 1)
        commentElement.innerHTML = `
            <div class='quote'>"${quotes.win[index].quote}"</div>
            <div class='author'>${quotes.win[index].author}</div>
            `
        bestScoreElement.innerText = `Best : ${(stack.length - 2).toString()}`
        bestScore = stack.length - 2
    } else if (stack.length - 2 === bestScore) {
        // same
        let index = getRandomIntInclusive(0, quotes.equal.length - 1)
        commentElement.innerHTML = `
            <div class='quote'>"${quotes.equal[index].quote}"</div>
            <div class='author'>${quotes.equal[index].author}</div>
        `
    } else {
        // lose
        let index = getRandomIntInclusive(0, quotes.fail.length - 1)
        commentElement.innerHTML = `
            <div class='quote'>"${quotes.fail[index].quote}"</div>
            <div class='author'>${quotes.fail[index].author}</div>
        `
    }

    commentElement.style.opacity = '1'

}

function addOverhang(x: number, z: number, width: number, depth: number) {
    const y = boxHeight * (stack.length - 1)
    const overhang = generateBox(x, y, z, width, depth, true)
    overhangs.push(overhang)
}

function cutBox(topLayer: Layer, overlap: number, size: number, delta: number) {
    const direction = topLayer.direction
    const newWidth = direction === 'x' ? overlap : topLayer.width
    const newDepth = direction === 'z' ? overlap : topLayer.depth

    // Update metadata
    topLayer.width = newWidth
    topLayer.depth = newDepth

    // Update Threejs model
    if (direction === 'x') {
        topLayer.threejs.scale.x = overlap / size
        topLayer.threejs.position.x -= delta / 2
        topLayer.cannonjs.position.x -= delta / 2
    } else {
        topLayer.threejs.scale.z = overlap / size
        topLayer.threejs.position.z -= delta / 2
        topLayer.cannonjs.position.z -= delta / 2
    }

    const shape = new CANNON.Box(
        new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
    )

    topLayer.cannonjs.shapes = []
    topLayer.cannonjs.addShape(shape)

    return { newWidth, newDepth }
}

function animation() {
    const speed = 0.15

    if (!gameEnded) {
        const topLayer = stack[stack.length - 1]
        if (topLayer.direction === 'x') {
            if (topLayer.threejs.position.x > camera.right || topLayer.threejs.position.x < camera.left) forwardX *= -1
            topLayer.threejs.position.x += speed * forwardX
            topLayer.cannonjs.position.x += speed * forwardX

        } else {
            if (topLayer.threejs.position.z > 7.5 || topLayer.threejs.position.z < -7.5) forwardZ *= -1
            topLayer.threejs.position.z += speed * forwardZ
            topLayer.cannonjs.position.z += speed * forwardZ
        }
        if (camera.position.y < boxHeight * (stack.length - 2) + 6) {
            camera.position.y += speed
        }
    }



    updatePhysics()
    renderer.render(scene, camera)
}

function updatePhysics() {
    world.step(1 / 60)
    overhangs.forEach(el => {
        el.threejs.position.x = el.cannonjs.position.x
        el.threejs.position.y = el.cannonjs.position.y
        el.threejs.position.z = el.cannonjs.position.z

        el.threejs.quaternion.x = el.cannonjs.quaternion.x
        el.threejs.quaternion.y = el.cannonjs.quaternion.y
        el.threejs.quaternion.z = el.cannonjs.quaternion.z
        el.threejs.quaternion.w = el.cannonjs.quaternion.w
    })
}

function startGame() {
    stack = [];
    overhangs = [];

    scoreElement.innerText = '0';
    commentElement.style.opacity = '0'

    if (world) {
        // Remove every object from world
        while (world.bodies.length > 0) {
            world.removeBody(world.bodies[0]);
        }
    }

    if (scene) {
        // Remove every Mesh from the scene
        for (let i = scene.children.length - 1; i >= 0; i--) {
            if (scene.children[i].type === "Mesh")
                scene.remove(scene.children[i]);
        }

        // Foundation
        addLayer(0, 0, originalBoxSize, originalBoxSize);

        // First layer
        addLayer(-7.5, 0, originalBoxSize, originalBoxSize, "x");
    }

    if (camera) {
        // Reset camera positions
        camera.position.set(6, 6, 6);
        camera.lookAt(0, 0, 0);
    }
}

window.addEventListener("resize", () => {
    // Adjust camera
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    camera.top = height / 2;
    camera.bottom = height / -2;

    // Reset renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}