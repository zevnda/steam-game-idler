import React, { useEffect, useState, useRef, useMemo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useAnimation } from 'framer-motion';

class ParticleEngineManager {
    static instance;
    initialized = false;

    static getInstance() {
        if (!ParticleEngineManager.instance) {
            ParticleEngineManager.instance = new ParticleEngineManager();
        }
        return ParticleEngineManager.instance;
    }

    async initialize() {
        if (!this.initialized) {
            await initParticlesEngine(async (engine) => {
                await loadSlim(engine);
            });
            this.initialized = true;
        }
        return this.initialized;
    }

    isInitialized() {
        return this.initialized;
    }
}

export default function Sparkles({ children }) {
    const [isReady, setIsReady] = useState(false);
    const particlesRef = useRef(null);
    const controls = useAnimation();
    const engineManager = useMemo(() => ParticleEngineManager.getInstance(), []);

    const particleOptions = useMemo(() => ({
        fpsLimit: 120,
        particles: {
            bounce: {
                horizontal: {
                    value: 1,
                },
                vertical: {
                    value: 1,
                },
            },
            collisions: {
                absorb: {
                    speed: 2,
                },
                bounce: {
                    horizontal: {
                        value: 1,
                    },
                    vertical: {
                        value: 1,
                    },
                },
                enable: false,
                maxSpeed: 50,
                mode: 'bounce',
                overlap: {
                    enable: true,
                    retries: 0,
                },
            },
            color: {
                value: '#ffc700',
                animation: {
                    h: {
                        count: 0,
                        enable: false,
                        speed: 1,
                        decay: 0,
                        delay: 0,
                        sync: true,
                        offset: 0,
                    },
                    s: {
                        count: 0,
                        enable: false,
                        speed: 1,
                        decay: 0,
                        delay: 0,
                        sync: true,
                        offset: 0,
                    },
                    l: {
                        count: 0,
                        enable: false,
                        speed: 1,
                        decay: 0,
                        delay: 0,
                        sync: true,
                        offset: 0,
                    },
                },
            },
            effect: {
                close: true,
                fill: true,
                options: {},
                type: {},
            },
            groups: {},
            move: {
                angle: {
                    offset: 0,
                    value: 90,
                },
                attract: {
                    distance: 200,
                    enable: false,
                    rotate: {
                        x: 3000,
                        y: 3000,
                    },
                },
                center: {
                    x: 50,
                    y: 50,
                    mode: 'percent',
                    radius: 0,
                },
                decay: 0,
                distance: {},
                direction: 'none',
                drift: 0,
                enable: true,
                gravity: {
                    acceleration: 9.81,
                    enable: false,
                    inverse: false,
                    maxSpeed: 50,
                },
                path: {
                    clamp: true,
                    delay: {
                        value: 0,
                    },
                    enable: false,
                    options: {},
                },
                outModes: {
                    default: 'out',
                },
                random: false,
                size: false,
                speed: {
                    min: 0.1,
                    max: 1,
                },
                spin: {
                    acceleration: 0,
                    enable: false,
                },
                straight: false,
                trail: {
                    enable: false,
                    length: 10,
                    fill: {},
                },
                vibrate: false,
                warp: false,
            },
            number: {
                density: {
                    enable: true,
                    width: 400,
                    height: 400,
                },
                limit: {
                    mode: 'delete',
                    value: 0,
                },
                value: 200,
            },
            opacity: {
                value: {
                    min: 0.1,
                    max: 1,
                },
                animation: {
                    count: 0,
                    enable: true,
                    speed: 4,
                    decay: 0,
                    delay: 0,
                    sync: false,
                    mode: 'auto',
                    startValue: 'random',
                    destroy: 'none',
                },
            },
            reduceDuplicates: false,
            shadow: {
                blur: 0,
                color: {
                    value: '#000',
                },
                enable: false,
                offset: {
                    x: 0,
                    y: 0,
                },
            },
            shape: {
                close: true,
                fill: true,
                options: {},
                type: 'circle',
            },
            size: {
                value: {
                    min: 1,
                    max: 2,
                },
                animation: {
                    count: 0,
                    enable: false,
                    speed: 5,
                    decay: 0,
                    delay: 0,
                    sync: false,
                    mode: 'auto',
                    startValue: 'random',
                    destroy: 'none',
                },
            },
            stroke: {
                width: 0,
            },
            zIndex: {
                value: 0,
                opacityRate: 1,
                sizeRate: 1,
                velocityRate: 1,
            },
            destroy: {
                bounds: {},
                mode: 'none',
                split: {
                    count: 1,
                    factor: {
                        value: 3,
                    },
                    rate: {
                        value: {
                            min: 4,
                            max: 9,
                        },
                    },
                    sizeOffset: true,
                },
            },
            roll: {
                darken: {
                    enable: false,
                    value: 0,
                },
                enable: false,
                enlighten: {
                    enable: false,
                    value: 0,
                },
                mode: 'vertical',
                speed: 25,
            },
            tilt: {
                value: 0,
                animation: {
                    enable: false,
                    speed: 0,
                    decay: 0,
                    sync: false,
                },
                direction: 'clockwise',
                enable: false,
            },
            twinkle: {
                lines: {
                    enable: false,
                    frequency: 0.05,
                    opacity: 1,
                },
                particles: {
                    enable: false,
                    frequency: 0.05,
                    opacity: 1,
                },
            },
            wobble: {
                distance: 5,
                enable: false,
                speed: {
                    angle: 50,
                    move: 10,
                },
            },
            life: {
                count: 0,
                delay: {
                    value: 0,
                    sync: false,
                },
                duration: {
                    value: 0,
                    sync: false,
                },
            },
            rotate: {
                value: 0,
                animation: {
                    enable: false,
                    speed: 0,
                    decay: 0,
                    sync: false,
                },
                direction: 'clockwise',
                path: false,
            },
            orbit: {
                animation: {
                    count: 0,
                    enable: false,
                    speed: 1,
                    decay: 0,
                    delay: 0,
                    sync: false,
                },
                enable: false,
                opacity: 1,
                rotation: {
                    value: 45,
                },
                width: 1,
            },
            links: {
                blink: false,
                color: {
                    value: '#fff',
                },
                consent: false,
                distance: 100,
                enable: false,
                frequency: 1,
                opacity: 1,
                shadow: {
                    blur: 5,
                    color: {
                        value: '#000',
                    },
                    enable: false,
                },
                triangles: {
                    enable: false,
                    frequency: 1,
                },
                width: 1,
                warp: false,
            },
            repulse: {
                value: 0,
                enabled: false,
                distance: 1,
                duration: 1,
                factor: 1,
                speed: 1,
            },
        },
        fullScreen: { enable: false },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: false },
                onclick: { enable: false },
                resize: false
            }
        },

        retina_detect: false
    }), []);

    useEffect(() => {
        let isMounted = true;

        const prepareParticles = async () => {
            await engineManager.initialize();

            if (isMounted) {
                setIsReady(true);
                controls.start({
                    opacity: 1,
                    transition: { duration: 1 }
                });
            }
        };

        prepareParticles();

        return () => {
            isMounted = false;
            if (particlesRef.current) {
                particlesRef.current.destroy();
            }
        };
    }, [controls, engineManager]);

    const particlesLoaded = (container) => {
        particlesRef.current = container;
    };

    return (
        <div className='absolute items-center justify-center'>
            {children}
            {isReady && (
                <div className='relative inset-0 pointer-events-none z-10 overflow-hidden' style={{
                    width: '100%',
                    height: '62px',
                }}>
                    <Particles
                        className='w-full h-full'
                        particlesLoaded={particlesLoaded}
                        options={particleOptions}
                    />
                </div>
            )}
        </div>
    );
}