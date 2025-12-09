<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';

const canvasRef = ref(null);
let renderer = null;
let animationId = null;
let gsapTimeline = null;

onMounted(() => {
    if (!canvasRef.value) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 1000);
    camera.position.z = 3;

    renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.value, 
        alpha: true,
        antialias: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const textureLoader = new THREE.TextureLoader();
    const texturePromises = [
        '/images/M.webp',
        '/images/P.webp',
        '/images/U.webp',
        '/images/6.webp'
    ].map(src => new Promise(resolve => {
        textureLoader.load(src, texture => resolve(texture));
    }));

    Promise.all(texturePromises).then(textures => {
        textures.forEach(texture => {
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
        });

        // Apply rotations/centers as per original requirement if needed
        // The user's snippet had:
        // textures[3] (6) -> center 0.5,0.5, rotation PI/2
        // textures[1] (P) -> center 0.5,0.5, rotation -PI/2
        
        // Let's map them:
        // 0: M
        // 1: P
        // 2: U
        // 3: 6
        
        textures[3].center.set(0.5, 0.5);
        textures[3].rotation = Math.PI / 2;
        
        textures[1].center.set(0.5, 0.5);
        textures[1].rotation = -Math.PI / 2;

        const materials = [
            new THREE.MeshBasicMaterial({ map: textures[0] }), // Right (M)
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), // Top
            new THREE.MeshBasicMaterial({ map: textures[3] }), // Back (6)
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), // Bottom
            new THREE.MeshBasicMaterial({ map: textures[2] }), // Front (U)
            new THREE.MeshBasicMaterial({ map: textures[1] }), // Left (P)
        ];

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const cube = new THREE.Mesh(geometry, materials);
        // Match the rotation order from the snippet
        cube.rotation.order = "YXZ"; 
        scene.add(cube);

        gsapTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

        // Front face visible
        gsapTimeline.set(cube.rotation, { x: 0, y: 0 });

        // Front -> Right
        gsapTimeline.to(cube.rotation, {
            y: "-=" + Math.PI / 2,
            duration: 0.5,
            ease: "power1.inOut",
        });

        // Right -> Top
        gsapTimeline.to(cube.rotation, {
            z: "-=" + Math.PI / 2,
            duration: 0.5,
            ease: "power1.inOut",
        });

        // Top -> Right
        gsapTimeline.to(cube.rotation, {
            y: "-=" + Math.PI / 2,
            duration: 0.5,
            ease: "power1.inOut",
        });

        const tick = () => {
            // Check if renderer still exists before rendering
            if (!renderer) return;
            
            renderer.render(scene, camera);
            animationId = requestAnimationFrame(tick);
        };

        tick();
    });

    const handleResize = () => {
        if (!canvasRef.value) return;
        const width = canvasRef.value.clientWidth;
        const height = canvasRef.value.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    // Cancel animation frame first
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Kill GSAP timeline
    if (gsapTimeline) {
        gsapTimeline.kill();
        gsapTimeline = null;
    }
    
    // Dispose renderer and set to null
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement = null;
        renderer = null;
    }
});
</script>

<template>
    <div class="cube-loader">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
.cube-loader {
    width: 100%;
    height: 100%;
}
canvas {
    width: 100% !important;
    height: 100% !important;
}
</style>
