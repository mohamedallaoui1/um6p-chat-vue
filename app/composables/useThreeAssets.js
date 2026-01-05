import * as THREE from 'three';
import gsap from 'gsap';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { APP_CONSTANTS } from '@/utils/constants';

export const useThreeAssets = () => {

    const createLoadingManager = (onLoad, onProgress) => {
        return new THREE.LoadingManager(onLoad, onProgress);
    };

    const setupLights = (scene) => {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        const spotLight = new THREE.SpotLight(APP_CONSTANTS.THREE.COLORS.LIGHT_SPOT, 2);
        spotLight.position.set(-5, 10, -5);
        scene.add(spotLight);
    };

    const createParticles = (scene) => {
        const particlesCount = 80;
        const positions = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }

        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const createSquareTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = APP_CONSTANTS.THREE.COLORS.PARTICLES_SQUARE;
            ctx.fillRect(0, 0, 64, 64);
            const texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter;
            return texture;
        };

        const particlesMaterial = new THREE.PointsMaterial({
            color: APP_CONSTANTS.THREE.COLORS.PARTICLES_MAIN,
            size: 0.3,
            sizeAttenuation: true,
            map: createSquareTexture(),
            transparent: true,
            alphaTest: 0.1,
            depthWrite: false
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.position.set(-3.5, 0, 0);
        scene.add(particles);
        return particles;
    };

    const setupAnimatedText = (font, textScene) => {
        const animatedWords = ['UM6P', '1337', 'EMINES', 'ABS', 'FGSES', 'SHBM', 'FMS', 'SAP+D', 'GTI'];
        let wordIndex = 0;
        let currentWordMesh = null;

        const wordGeometries = {};
        const textOptions = {
            font: font,
            size: 0.15,
            depth: 0.01,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005,
            bevelSize: 0.002,
            bevelSegments: 4
        };

        animatedWords.forEach(word => {
            const geo = new TextGeometry(word, textOptions);
            geo.center();
            wordGeometries[word] = geo;
        });

        const createWordMesh = (word, opacity = 1) => {
            const geometry = wordGeometries[word];

            const material = new THREE.MeshBasicMaterial({
                color: APP_CONSTANTS.THREE.COLORS.TEXT_WHITE,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: opacity,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData.outlineParameters = { visible: false };
            mesh.rotation.y = Math.PI * 0.5;

            const group = new THREE.Group();
            group.add(mesh);
            group.position.set(0.5, -0.28, 0);

            return group;
        };

        currentWordMesh = createWordMesh(animatedWords[0], 1);
        textScene.add(currentWordMesh);

        const animateText = () => {
            const nextIndex = (wordIndex + 1) % animatedWords.length;
            const nextWordGroup = createWordMesh(animatedWords[nextIndex], 0);
            nextWordGroup.rotation.z = -Math.PI * 0.5;
            textScene.add(nextWordGroup);

            const tl = gsap.timeline({
                delay: 1.5,
                onComplete: () => {
                    textScene.remove(currentWordMesh);
                    currentWordMesh.children[0].material.dispose();
                    currentWordMesh = nextWordGroup;
                    wordIndex = nextIndex;
                    animateText();
                }
            });

            tl.to(currentWordMesh.rotation, { duration: 1, z: Math.PI * 0.5, ease: "power2.in" }, 0);
            tl.to(currentWordMesh.children[0].material, { duration: 0.5, opacity: 0, ease: "power1.in" }, 0);
            tl.to(nextWordGroup.rotation, { duration: 1, z: 0, ease: "power2.out" }, 0.2);
            tl.to(nextWordGroup.children[0].material, { duration: 0.8, opacity: 1, ease: "power1.out" }, 0.2);
        };

        animateText();
    };

    return {
        createLoadingManager,
        setupLights,
        createParticles,
        setupAnimatedText
    };
};
