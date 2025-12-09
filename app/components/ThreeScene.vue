<template>
  <div class="scene-container">
    <div v-if="isLoading" ref="loadingOverlayRef" class="loading-overlay">
      <div class="loader">
        <div class="bar" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="loading-text">Loading UM6P Campus... {{ Math.round(progress) }}%</div>
    </div>
    <canvas ref="canvasRef" class="webgl"></canvas>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvasRef = ref(null)
const loadingOverlayRef = ref(null)
let renderer = null
let effect = null
let animationId = null

// Loading State
const isLoading = ref(true)
const progress = ref(0)

onMounted(() => {
    if (!canvasRef.value) return

    // -------------------------------------------------
    // LOADING MANAGER
    // -------------------------------------------------
    const loadingManager = new THREE.LoadingManager(
        // onLoad
        () => {
            console.log('Assets loaded')
            if (loadingOverlayRef.value) {
                gsap.to(loadingOverlayRef.value, {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        isLoading.value = false
                    }
                })
            } else {
                isLoading.value = false
            }
        },
        // onProgress
        (itemUrl, itemsLoaded, itemsTotal) => {
            const ratio = itemsLoaded / itemsTotal
            progress.value = ratio * 100
        }
    )

    const canvas = canvasRef.value
    const scene = new THREE.Scene()
    const textScene = new THREE.Scene()

    // -------------------------------------------------
    // PARTICLES & ENV
    // -------------------------------------------------
    const gradientMap = new THREE.DataTexture(
        new Uint8Array([0, 128, 255]),
        3, 1,
        THREE.RedFormat
    )
    gradientMap.minFilter = THREE.NearestFilter
    gradientMap.magFilter = THREE.NearestFilter
    gradientMap.needsUpdate = true

    const particlesCount = 80
    const positions = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 10
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }

    const particlesGeometry = new THREE.BufferGeometry()
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const createSquareTexture = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ff6600'
        ctx.fillRect(0, 0, 64, 64)
        const texture = new THREE.CanvasTexture(canvas)
        texture.magFilter = THREE.NearestFilter
        return texture
    }

    const particlesMaterial = new THREE.PointsMaterial({
        color: '#ffeded',
        size: 0.3,
        sizeAttenuation: true,
        map: createSquareTexture(),
        transparent: true,
        alphaTest: 0.1,
        depthWrite: false
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particles.position.set(-3.5, 0, 0)
    scene.add(particles)

    // -------------------------------------------------
    // YELLOW PLANE
    // -------------------------------------------------

    const textureLoader = new THREE.TextureLoader()

    const texture = textureLoader.load('/models/mask.webp')
    const planeGeometry = new THREE.PlaneGeometry(20, 20)
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: '#DAA06D',
        side: THREE.DoubleSide,
        alphaMap: texture,
        transparent: true,
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI * 0.5
    plane.position.y = -1
    scene.add(plane)

    // -------------------------------------------------
    // MODEL LOADER
    // -------------------------------------------------
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')

    const gltfLoader = new GLTFLoader(loadingManager)
    gltfLoader.setDRACOLoader(dracoLoader)

    let mixer = null
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)

    gltfLoader.load(
        '/models/um6p-pergola.glb',
        (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    const oldMat = child.material
                    child.material = new THREE.MeshToonMaterial({
                        color: oldMat.color,
                        map: oldMat.map,
                        gradientMap: gradientMap,
                        side: THREE.DoubleSide
                    })
                }
            })

            modelGroup.add(gltf.scene)

            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(gltf.scene)
                mixer.clipAction(gltf.animations[0]).play()
            }

            const box = new THREE.Box3().setFromObject(gltf.scene)
            const center = box.getCenter(new THREE.Vector3())
            gltf.scene.position.sub(center)
        }
    )

    // -------------------------------------------------
    // TEXT SETUP
    // -------------------------------------------------
    const fontloader = new FontLoader(loadingManager)
    fontloader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
        
        // 1. STATIC HEADER TEXT
        const headerGeometry = new TextGeometry(
            'UM6P AI ASSISTANT\n    ASK ME ABOUT',
            {
                font: font,
                size: 0.11,
                depth: 0.01,
                curveSegments: 12,
            }
        )
        const headerMaterial = new THREE.MeshBasicMaterial({
            color: '#ffffff',
            side: THREE.DoubleSide,
        })
        headerGeometry.center()
        const headerText = new THREE.Mesh(headerGeometry, headerMaterial)
        
        // Face the camera (Camera is at x=3, so text rotates 90deg on Y)
        headerText.rotation.y = Math.PI * 0.5 
        headerText.userData.outlineParameters = { visible: false }
        headerText.position.set(0.5, 0, 0)
        textScene.add(headerText)

        // -------------------------------------------------
        // 2. ROTATING "SPINNER" TEXT (FIXED POSITION)
        // -------------------------------------------------
        const animatedWords = ['UM6P', '1337', 'EMINES', 'ABS', 'FGSES', 'SHBM', 'FMS', 'SAP+D', 'GTI']
        let wordIndex = 0
        let currentWordMesh = null
        
        // Optimization: Pre-generate geometries to avoid runtime overhead
        const wordGeometries = {}
        const textOptions = {
            font: font,
            size: 0.15,
            depth: 0.01,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005,
            bevelSize: 0.002,
            bevelSegments: 4
        }
        
        animatedWords.forEach(word => {
            const geo = new TextGeometry(word, textOptions)
            geo.center()
            wordGeometries[word] = geo
        })

        // Helper to create a word mesh wrapped in a Group
        const createWordMesh = (word, opacity = 1) => {
             const geometry = wordGeometries[word]
             
             const material = new THREE.MeshBasicMaterial({ 
                 color: '#ffffff', 
                 side: THREE.DoubleSide,
                 transparent: true,
                 opacity: opacity,
                 depthWrite: false
             })
             const mesh = new THREE.Mesh(geometry, material)
             mesh.userData.outlineParameters = { visible: false }
             
             // Mesh faces camera (Local Y rotation)
             mesh.rotation.y = Math.PI * 0.5 
             
             // Group handles position and Z-rotation
             const group = new THREE.Group()
             group.add(mesh)
             group.position.set(0.5, -0.28, 0)
             
             return group
         }

        // Initialize First Word
        currentWordMesh = createWordMesh(animatedWords[0], 1)
        textScene.add(currentWordMesh)

        // Animation Loop
        const animateText = () => {
            const nextIndex = (wordIndex + 1) % animatedWords.length
            const nextWordGroup = createWordMesh(animatedWords[nextIndex], 0) // Start invisible
            
            // SETUP STARTING ROTATION (Z-Axis)
            // Start from -90 degrees (flipped down)
            nextWordGroup.rotation.z = -Math.PI * 0.5
            
            textScene.add(nextWordGroup)

            const tl = gsap.timeline({
                delay: 1.5,
                onComplete: () => {
                    textScene.remove(currentWordMesh)
                    // Only dispose material, keep geometry cached
                    currentWordMesh.children[0].material.dispose()
                    
                    currentWordMesh = nextWordGroup
                    wordIndex = nextIndex
                    
                    animateText()
                }
            })

            // 1. OUTGOING WORD (Flip Up: 0 -> 90)
            tl.to(currentWordMesh.rotation, {
                duration: 1,
                z: Math.PI * 0.5, 
                ease: "power2.in"
            }, 0)

            tl.to(currentWordMesh.children[0].material, {
                duration: 0.5,
                opacity: 0,
                ease: "power1.in"
            }, 0)

            // 2. INCOMING WORD (Flip Up: -90 -> 0)
            tl.to(nextWordGroup.rotation, {
                duration: 1,
                z: 0,
                ease: "power2.out"
            }, 0.2)

            tl.to(nextWordGroup.children[0].material, {
                duration: 0.8,
                opacity: 1,
                ease: "power1.out"
            }, 0.2)
        }

        animateText()
    })

    // -------------------------------------------------
    // LIGHTS & CAMERA
    // -------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)

    const spotLight = new THREE.SpotLight(0xffa95c, 2)
    spotLight.position.set(-5, 10, -5)
    scene.add(spotLight)

    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    const cameraGroup = new THREE.Group()
    scene.add(cameraGroup)

    const camera = new THREE.PerspectiveCamera(67, sizes.width / sizes.height, 0.1, 1000)
    // Camera is on X axis looking at 0,0,0
    camera.position.set(2, 0, 0)
    cameraGroup.add(camera)

    const cursor = { x: 0, y: 0 }
    
    // Use container for mouse events instead of window
    const handleMouseMove = (event) => {
        // Calculate cursor position relative to container
        // Normalized coordinates: -0.5 to 0.5
        cursor.x = event.offsetX / sizes.width - 0.5
        cursor.y = event.offsetY / sizes.height - 0.5
    }

    // Attach listener to the container element
    if (canvasRef.value && canvasRef.value.parentElement) {
        canvasRef.value.parentElement.addEventListener('mousemove', handleMouseMove)
        // Touch support for mobile parallax
        canvasRef.value.parentElement.addEventListener('touchmove', (event) => {
            // Prevent scrolling while interacting with the 3D scene
            event.preventDefault() 
            const touch = event.touches[0]
            const rect = canvasRef.value.parentElement.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const y = touch.clientY - rect.top
            
            cursor.x = x / sizes.width - 0.5
            cursor.y = y / sizes.height - 0.5
        }, { passive: false })
    }



    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    })

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    effect = new OutlineEffect(renderer, {
        defaultThickness: 0.003,
        defaultColor: [0, 0, 0],
        defaultAlpha: 0.8
    })

    const handleResize = (width, height) => {
        sizes.width = width
        sizes.height = height
        
        const aspect = sizes.width / sizes.height
        camera.aspect = aspect

        // Adjust camera distance to maintain horizontal field of view on portrait screens
        if (aspect < 1) {
            camera.position.x = 2 / aspect
        } else {
            camera.position.x = 2
        }
        
        // Reset FOV to default
        camera.fov = 67

        camera.updateProjectionMatrix()
        
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        
        effect.setSize(sizes.width, sizes.height)
    }

    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            handleResize(entry.contentRect.width, entry.contentRect.height)
        }
    })
    

    
    if (canvasRef.value && canvasRef.value.parentElement) {
        resizeObserver.observe(canvasRef.value.parentElement)
    }

    const clock = new THREE.Clock()
    let previousTime = 0

    const tick = () => {
        const elapsedTime = clock.getElapsedTime()
        const deltaTime = elapsedTime - previousTime
        previousTime = elapsedTime

        if (mixer) mixer.update(deltaTime)

        particles.rotation.y = elapsedTime * 0.01
        particles.rotation.x = elapsedTime * 0.01

        const parallaxX = cursor.x * 0.5
        const parallaxY = -cursor.y * 0.5

        cameraGroup.position.z += (parallaxX - cameraGroup.position.z) * 5 * deltaTime
        cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime

        camera.lookAt(0, 0, 0)
        
        effect.render(scene, camera)
        
        renderer.autoClear = false
        renderer.render(textScene, camera)
        renderer.autoClear = true

        animationId = requestAnimationFrame(tick)
    }

    tick()

    onBeforeUnmount(() => {
        resizeObserver.disconnect()
        if (canvasRef.value && canvasRef.value.parentElement) {
            canvasRef.value.parentElement.removeEventListener('mousemove', handleMouseMove)
        }
        
        if (animationId) cancelAnimationFrame(animationId)
        
        // Kill all GSAP animations related to this component
        if (loadingOverlayRef.value) {
            gsap.killTweensOf(loadingOverlayRef.value)
        }
        gsap.killTweensOf(scene)
        
        // Dispose of specific textures
        gradientMap.dispose()
        particlesMaterial.map?.dispose()
        planeMaterial.alphaMap?.dispose()
        
        // Traverse and dispose
        scene.traverse((child) => {
            if (child.isMesh || child.isPoints) {
                child.geometry?.dispose()
                
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            m.map?.dispose()
                            m.dispose()
                        })
                    } else {
                        child.material.map?.dispose()
                        child.material.dispose()
                    }
                }
            }
        })
        
        scene.clear()
        
        if (renderer) {
            renderer.dispose()
            renderer.forceContextLoss()
            renderer.domElement = null
            renderer = null
        }
    })
})
</script>

<style scoped>
.scene-container {
    position: relative;
    width: 100%;
    height: 100%; /* Fill parent */
    background: #CC5500;
    overflow: hidden; /* Ensure no spillover */
}

.webgl {
  position: absolute; /* Absolute within container */
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  outline: none;
  z-index: 0;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    transition: opacity 1s ease-out;
}

.loader {
    width: 50%; /* Responsive width */
    max-width: 200px;
    height: 4px;
    background: #333;
    border-radius: 2px;
    margin-bottom: 20px;
    overflow: hidden;
}

.bar {
    height: 100%;
    background: #ff6600;
    transition: width 0.2s ease-out;
}

.loading-text {
    color: #ff6600;
    font-family: 'Helvetica', sans-serif;
    font-size: 12px; /* Smaller font for small containers */
    letter-spacing: 2px;
    text-align: center;
}
</style>