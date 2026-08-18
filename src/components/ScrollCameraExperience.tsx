import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, Component, Suspense } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { useGLTF, Environment, ContactShadows, Sparkles } from '@react-three/drei';

useGLTF.preload('/models/camera.glb');

interface ScrollCameraExperienceProps {
    scrollProgress: number;
}

interface ModelErrorBoundaryProps {
    children: ReactNode;
    fallback: ReactNode;
}

interface ModelErrorBoundaryState {
    hasError: boolean;
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
    constructor(props: ModelErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.warn('Model loading error, falling back to procedural geometry:', error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const mix = (start: number, end: number, amount: number) => start + (end - start) * amount;

const Model = () => {
    const { scene } = useGLTF('/models/camera.glb');

    useMemo(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const material = (child as THREE.Mesh).material as THREE.Material;
                if (material && 'roughness' in material) {
                    (material as THREE.MeshStandardMaterial).roughness = Math.max((material as THREE.MeshStandardMaterial).roughness, 0.4);
                }
            }
        });
    }, [scene]);

    return <primitive object={scene} />;
};

const createRoundedRectShape = (width: number, height: number, radius: number) => {
    const x = -width / 2;
    const y = -height / 2;
    const shape = new THREE.Shape();

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return shape;
};

const useMotionSettings = () => {
    const [settings, setSettings] = useState({ isMobile: false, isReducedMotion: false });

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 760px)');
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const update = () => {
            setSettings({
                isMobile: mobileQuery.matches,
                isReducedMotion: reducedMotionQuery.matches
            });
        };

        update();
        mobileQuery.addEventListener('change', update);
        reducedMotionQuery.addEventListener('change', update);

        return () => {
            mobileQuery.removeEventListener('change', update);
            reducedMotionQuery.removeEventListener('change', update);
        };
    }, []);

    return settings;
};

const ApertureBlades = ({ progress, isMobile }: { progress: number; isMobile: boolean }) => {
    const blades = useMemo(() => Array.from({ length: isMobile ? 6 : 8 }), [isMobile]);
    const exit = clamp((progress - 0.82) / 0.18);
    const normalOpening = mix(0.18, 0.58, 1 - Math.abs(progress - 0.48) * 1.4);
    const opening = mix(normalOpening, 0, exit);

    return (
        <group position={[0, 0, 0.31]} rotation={[0, 0, progress * Math.PI * 1.4]}>
            {blades.map((_, index) => {
                const angle = (index / blades.length) * Math.PI * 2;
                return (
                    <mesh key={index} position={[Math.cos(angle) * opening, Math.sin(angle) * opening, 0]} rotation={[0, 0, angle + 0.52]}>
                        <boxGeometry args={[0.68, 0.11, 0.025]} />
                        <meshStandardMaterial color="#d4bfa1" metalness={0.54} roughness={0.36} transparent opacity={0.68} />
                    </mesh>
                );
            })}
        </group>
    );
};

const ModernCameraFallback = ({ isMobile }: { isMobile: boolean }) => {
    const bodyShape = useMemo(() => createRoundedRectShape(3.45, 1.86, 0.2), []);
    const gripShape = useMemo(() => createRoundedRectShape(0.62, 1.58, 0.22), []);
    const plateShape = useMemo(() => createRoundedRectShape(1.12, 0.22, 0.08), []);
    const dialSegments = isMobile ? 28 : 40;
    const lensSegments = isMobile ? 72 : 128;
    const gripRidges = useMemo(() => Array.from({ length: 7 }), []);
    const lensRidges = useMemo(() => Array.from({ length: isMobile ? 28 : 42 }), [isMobile]);

    return (
        <group aria-hidden="true" rotation={[0.04, -0.2, 0.02]}>
            <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[bodyShape, { depth: 0.42, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 5 }]} />
                <meshPhysicalMaterial color="#22282b" metalness={0.28} roughness={0.46} clearcoat={0.34} />
            </mesh>

            <mesh position={[1.46, -0.06, 0.16]} castShadow receiveShadow>
                <extrudeGeometry args={[gripShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 5 }]} />
                <meshPhysicalMaterial color="#15191b" metalness={0.18} roughness={0.68} clearcoat={0.16} />
            </mesh>

            {gripRidges.map((_, index) => (
                <mesh key={index} position={[1.48, mix(-0.58, 0.58, index / 6), 0.7]} castShadow>
                    <boxGeometry args={[0.42, 0.035, 0.045]} />
                    <meshStandardMaterial color="#384044" metalness={0.2} roughness={0.6} />
                </mesh>
            ))}

            <mesh position={[-0.32, 1.04, 0.05]} castShadow receiveShadow>
                <coneGeometry args={[0.82, 0.58, 4]} />
                <meshPhysicalMaterial color="#202529" metalness={0.34} roughness={0.42} clearcoat={0.24} />
            </mesh>

            <mesh position={[-0.64, 1.02, 0.34]} rotation={[0, 0, 0]} castShadow>
                <extrudeGeometry args={[plateShape, { depth: 0.24, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4 }]} />
                <meshStandardMaterial color="#3a4246" metalness={0.5} roughness={0.32} />
            </mesh>

            <mesh position={[1.03, 1.04, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.18, dialSegments]} />
                <meshStandardMaterial color="#3d464a" metalness={0.58} roughness={0.3} />
            </mesh>

            <mesh position={[-1.12, 1.03, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.16, dialSegments]} />
                <meshStandardMaterial color="#2f373b" metalness={0.55} roughness={0.34} />
            </mesh>

            <mesh position={[-0.14, -0.02, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.92, 1.06, 0.76, lensSegments]} />
                <meshPhysicalMaterial color="#101315" metalness={0.72} roughness={0.22} clearcoat={0.9} />
            </mesh>

            {lensRidges.map((_, index) => {
                const angle = (index / lensRidges.length) * Math.PI * 2;
                return (
                    <mesh
                        key={index}
                        position={[Math.cos(angle) * 1.08 - 0.14, Math.sin(angle) * 1.08 - 0.02, 0.72]}
                        rotation={[0, 0, angle]}
                        castShadow
                    >
                        <boxGeometry args={[0.035, 0.16, 0.22]} />
                        <meshStandardMaterial color="#30373a" metalness={0.34} roughness={0.5} />
                    </mesh>
                );
            })}

            <mesh position={[-0.14, -0.02, 0.88]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.72, 0.86, 0.28, lensSegments]} />
                <meshPhysicalMaterial color="#1c2225" metalness={0.8} roughness={0.18} clearcoat={0.92} />
            </mesh>

            <mesh position={[-0.14, -0.02, 1.04]}>
                <circleGeometry args={[0.56, lensSegments]} />
                <meshPhysicalMaterial color="#101a18" transparent opacity={0.84} roughness={0.02} metalness={0.16} clearcoat={1} transmission={0.16} />
            </mesh>

            <mesh position={[-0.36, 0.22, 1.055]}>
                <circleGeometry args={[0.13, 36]} />
                <meshBasicMaterial color="#fff4e6" transparent opacity={0.72} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            <mesh position={[0.15, -0.22, 1.06]}>
                <circleGeometry args={[0.2, 48]} />
                <meshBasicMaterial color="#b86f60" transparent opacity={0.34} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            <mesh position={[0.54, 0.55, 0.66]}>
                <circleGeometry args={[0.055, 24]} />
                <meshBasicMaterial color="#ffb37c" transparent opacity={0.9} />
            </mesh>

            <mesh position={[-1.12, 0.34, 0.66]}>
                <circleGeometry args={[0.2, 36]} />
                <meshPhysicalMaterial color="#090b0d" metalness={0.28} roughness={0.18} clearcoat={0.6} />
            </mesh>
        </group>
    );
};

const CameraRig = ({
    scrollProgress,
    isMobile,
    isReducedMotion
}: {
    scrollProgress: number;
    isMobile: boolean;
    isReducedMotion: boolean;
}) => {
    const rigRef = useRef<THREE.Group>(null);
    const lensRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const progressRef = useRef(scrollProgress);

    useEffect(() => {
        progressRef.current = scrollProgress;
    }, [scrollProgress]);

    useFrame(({ clock }) => {
        const p = isReducedMotion ? 0.18 : progressRef.current;
        const sectionPulse = Math.sin(clock.elapsedTime * (isMobile ? 0.55 : 0.85));
        const exit = clamp((p - 0.82) / 0.18);
        const galleryFocus = clamp((p - 0.18) / 0.34);
        const studioFocus = clamp((p - 0.52) / 0.34);

        if (rigRef.current) {
            const side = isMobile ? 0.46 : 1;
            const serviceFocus = clamp((p - 0.42) / 0.28);
            rigRef.current.position.x = mix(1.92 * side, -1.12 * side, galleryFocus) + mix(0, 1.45 * side, exit);
            rigRef.current.position.y = mix(-0.1, 0.64, studioFocus) + sectionPulse * (isMobile ? 0.025 : 0.055) + mix(0, 0.86, exit);
            rigRef.current.position.z = mix(-1.1, -1.65, serviceFocus);
            rigRef.current.rotation.x = mix(-0.08, 0.18, studioFocus) + sectionPulse * 0.012;
            rigRef.current.rotation.y = mix(-0.38, 0.82, galleryFocus) + mix(0, 0.64, exit);
            rigRef.current.rotation.z = mix(0.04, -0.18, p) + mix(0, 0.38, exit);
            const scale = isMobile ? mix(0.42, 0.7, galleryFocus) : mix(0.52, 0.84, galleryFocus);
            rigRef.current.scale.setScalar(scale * mix(1, 0.76, exit));
        }

        if (lensRef.current) {
            lensRef.current.rotation.z = clock.elapsedTime * (isMobile ? 0.16 : 0.28) + p * Math.PI * 2.1;
        }

        if (glowRef.current) {
            const material = glowRef.current.material as THREE.MeshBasicMaterial;
            const flashSpike = clamp((exit - 0.85) / 0.15) * clamp((1 - exit) / 0.08);
            material.opacity = mix(0.18, 0.34, Math.sin(clock.elapsedTime * 1.2) * 0.5 + 0.5) * (1 - exit * 0.6) + flashSpike * 0.8;
        }
    });

    return (
        <group ref={rigRef} aria-hidden="true">
            <Suspense fallback={<ModernCameraFallback isMobile={isMobile} />}>
                <ModelErrorBoundary fallback={<ModernCameraFallback isMobile={isMobile} />}>
                    <Model />
                </ModelErrorBoundary>
            </Suspense>

            <group ref={lensRef} position={[0.06, 0.06, 0.74]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0.5, 0]}>
                    <torusGeometry args={[0.36, 0.012, 12, isMobile ? 40 : 72]} />
                    <meshBasicMaterial color="#fff4e6" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
                <ApertureBlades progress={scrollProgress} isMobile={isMobile} />
            </group>

            <mesh ref={glowRef} position={[0.08, 0.02, 1.2]}>
                <circleGeometry args={[0.62, isMobile ? 48 : 96]} />
                <meshBasicMaterial color="#d4bfa1" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </group>
    );
};

const ScrollCameraScene = ({ scrollProgress, isMobile, isReducedMotion }: ScrollCameraExperienceProps & {
    isMobile: boolean;
    isReducedMotion: boolean;
}) => {
    return (
        <>
            <fog attach="fog" args={['#111719', 4, 12]} />
            {!isMobile && <Environment preset="studio" />}
            <ambientLight intensity={isMobile ? 0.82 : 0.68} />
            <directionalLight position={[3, 4, 5]} intensity={isMobile ? 2.2 : 2.8} color="#fff4e6" />
            <pointLight position={[-3, 1.6, 2.8]} intensity={isMobile ? 1.55 : 2.0} color="#b86f60" />
            <pointLight position={[2.2, -1.8, 2.6]} intensity={isMobile ? 1 : 1.2} color="#637568" />
            {!isMobile && <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={10} blur={2.5} far={20} resolution={256} />}
            {!isReducedMotion && <Sparkles count={isMobile ? 30 : 150} scale={[10, 10, 10]} speed={0.6} opacity={0.3} />}
            <CameraRig scrollProgress={scrollProgress} isMobile={isMobile} isReducedMotion={isReducedMotion} />
        </>
    );
};

const ScrollCameraExperience = ({ scrollProgress }: ScrollCameraExperienceProps) => {
    const { isMobile, isReducedMotion } = useMotionSettings();
    const dpr: [number, number] = isMobile ? [1, 1.25] : [1, 1.65];
    const pageExitThreshold = 0.90;
    const containerOpacity = scrollProgress > pageExitThreshold ? 1 - (scrollProgress - pageExitThreshold) / 0.10 : 1;

    return (
        <div
            className={`scroll-camera-experience ${isReducedMotion ? 'is-reduced-motion' : ''} ${scrollProgress > 0.82 ? 'is-vanishing' : ''}`}
            aria-hidden="true"
            style={{ opacity: containerOpacity }}
        >
            <Canvas
                camera={{ position: [0, 0, isMobile ? 5.8 : 4.8], fov: isMobile ? 42 : 38 }}
                dpr={dpr}
                gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
                performance={{ min: 0.55 }}
            >
                <ScrollCameraScene scrollProgress={scrollProgress} isMobile={isMobile} isReducedMotion={isReducedMotion} />
            </Canvas>
        </div>
    );
};

export default ScrollCameraExperience;
