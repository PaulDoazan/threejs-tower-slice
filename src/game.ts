import * as THREE from "three"

// Add scene
const scene = new THREE.Scene()

// Add Cube
const geometry = new THREE.BoxGeometry(3, 1, 3)
const material = new THREE.MeshLambertMaterial({ color: 0xfb8e00 })
const mesh = new THREE.Mesh(geometry, material)

mesh.position.set(0, 0, 0)
scene.add(mesh)

// Set up lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.position.set(10, 20, 0)
scene.add(directionalLight)

// Camera
const width: number = 10
const height: number = width * (window.innerHeight / window.innerWidth)
const camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    1,
    100
)

camera.position.set(4, 4, 4)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.render(scene, camera)

document.body.appendChild(renderer.domElement)