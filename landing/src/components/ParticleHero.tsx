'use client';

import { useEffect, useRef } from 'react';

/**
 * 3D Particle Hero — Blue Stars, Atomic Rays, Black Hole Particles, Nodal Structure
 * Scroll-responsive: camera parallax + scene rotation tied to scroll position
 */
export default function ParticleHero({ scrollY = 0 }: { scrollY?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    (async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      if (disposed) return;

      const container = containerRef.current!;
      const W = () => container.clientWidth;
      const H = () => container.clientHeight;

      /* ── Renderer ── */
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W(), H());
      container.appendChild(renderer.domElement);

      /* ── Soft radial background ── */
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = bgCanvas.height = 512;
      const b2d = bgCanvas.getContext('2d')!;
      const grad = b2d.createRadialGradient(256, 256, 10, 256, 256, 370);
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.45, '#f6faf5');
      grad.addColorStop(1.0, '#e8f0e6');
      b2d.fillStyle = grad;
      b2d.fillRect(0, 0, 512, 512);
      const bgTexture = new THREE.CanvasTexture(bgCanvas);

      const scene = new THREE.Scene();
      scene.background = bgTexture;

      /* ── Camera ── */
      const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 300);
      camera.position.set(0, 6.5, 19);

      /* ── Lights ── */
      scene.add(new THREE.HemisphereLight(0xffffff, 0xb8d4c8, 0.6));
      const dl1 = new THREE.DirectionalLight(0xffffff, 1.2);
      dl1.position.set(6, 12, 8);
      scene.add(dl1);
      const dl2 = new THREE.DirectionalLight(0x88bbaa, 0.6);
      dl2.position.set(-7, -4, -6);
      scene.add(dl2);

      /* ── Helpers ── */
      function makeSoftTexture(bright = 'rgba(255,255,255,1)') {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d')!;
        const r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0.0, bright);
        r.addColorStop(0.35, 'rgba(160,210,180,0.85)');
        r.addColorStop(1.0, 'rgba(0,0,0,0)');
        x.fillStyle = r;
        x.beginPath();
        x.arc(32, 32, 32, 0, 7);
        x.fill();
        return new THREE.CanvasTexture(c);
      }
      const softTex = makeSoftTexture();

      /* ── Aura Shader ── */
      const AURA_VERT = `
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`;
      const AURA_FRAG = `
        uniform vec3 uColor; uniform float uPower; uniform float uOpacity;
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          float f = 1.0 - abs(dot(normalize(vNormal), vView));
          f = pow(f, uPower);
          gl_FragColor = vec4(uColor * f * uOpacity, f * uOpacity);
        }`;

      /* ══════════════════════════════════════════════
         BLUE STARS  (twinkling shader points)
      ══════════════════════════════════════════════ */
      let allowTwinkle = true;
      const COUNT = 1200;
      const sPos = new Float32Array(COUNT * 3);
      const sCol = new Float32Array(COUNT * 3);
      const sScl = new Float32Array(COUNT);
      const sSeed = new Float32Array(COUNT);
      const tmp = new THREE.Color();

      for (let i = 0; i < COUNT; i++) {
        const y = 1 - 2 * (i / (COUNT - 1));
        const phi = i * 2.399963229728653;
        const radius = 27 + Math.sin(i * 11.3) * 3;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        sPos[i * 3] = Math.cos(phi) * r * radius;
        sPos[i * 3 + 1] = y * radius;
        sPos[i * 3 + 2] = Math.sin(phi) * r * radius;

        tmp.setHSL(0.555 + Math.random() * 0.16, 1.0, 0.42 + Math.random() * 0.3);
        sCol[i * 3] = tmp.r;
        sCol[i * 3 + 1] = tmp.g;
        sCol[i * 3 + 2] = tmp.b;
        sScl[i] = 0.3 + Math.random() * 1.15;
        sSeed[i] = Math.random() * 6.28318;
      }

      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
      starGeo.setAttribute('aColor', new THREE.BufferAttribute(sCol, 3));
      starGeo.setAttribute('aScale', new THREE.BufferAttribute(sScl, 1));
      starGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));

      const starMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMap: { value: softTex },
          uRes: { value: renderer.getPixelRatio() },
          uOn: { value: 1.0 },
        },
        vertexShader: `
          attribute float aScale; attribute float aSeed; attribute vec3 aColor;
          uniform float uTime; uniform float uRes; uniform float uOn;
          varying vec3 vColor; varying float vTw;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vTw = mix(1.0, 0.45 + 0.55 * sin(uTime * 2.4 + aSeed * 37.0), uOn);
            vColor = aColor;
            gl_PointSize = clamp(aScale * uRes * (170.0 / -mv.z), 0.0, 5.5);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uMap;
          varying vec3 vColor; varying float vTw;
          void main() {
            vec4 tex = texture2D(uMap, gl_PointCoord);
            gl_FragColor = vec4(vColor, tex.a * vTw);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });

      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      /* ══════════════════════════════════════════════
         NODAL / NEURAL STRUCTURE
      ══════════════════════════════════════════════ */
      const nodesRoot = new THREE.Group();

      const V3 = THREE.Vector3;
      function fibSphere(n: number, radius: number, jitter = 0): any[] {
        const out: any[] = [];
        for (let i = 0; i < n; i++) {
          const y = 1 - 2 * (i / (n - 1));
          const phi = i * 2.399963229728653;
          const r = Math.sqrt(Math.max(0, 1 - y * y));
          out.push(
            new V3(
              Math.cos(phi) * r * radius + (Math.random() - 0.5) * jitter,
              y * radius + (Math.random() - 0.5) * jitter,
              Math.sin(phi) * r * radius + (Math.random() - 0.5) * jitter
            )
          );
        }
        return out;
      }

      const pts = fibSphere(90, 6.6, 0.9);
      const MAXD2 = 3.1 * 3.1;
      const pairs: number[] = [];
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          if (pts[i].distanceToSquared(pts[j]) < MAXD2) pairs.push(i, j);

      const lp = new Float32Array(pairs.length * 3);
      pairs.forEach((idx, k) => {
        lp[k * 3] = pts[idx].x;
        lp[k * 3 + 1] = pts[idx].y;
        lp[k * 3 + 2] = pts[idx].z;
      });
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x7ea6ff,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
      nodesRoot.add(new THREE.LineSegments(lineGeo, lineMat));

      const np = new Float32Array(pts.length * 3);
      pts.forEach((p, i) => {
        np[i * 3] = p.x;
        np[i * 3 + 1] = p.y;
        np[i * 3 + 2] = p.z;
      });
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute('position', new THREE.BufferAttribute(np, 3));
      const nodeMat = new THREE.PointsMaterial({
        map: softTex,
        color: 0x3f7dff,
        size: 0.24,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      nodesRoot.add(new THREE.Points(nodeGeo, nodeMat));

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xb8d0ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mkRing = (R: number, rx: number, ry: number, rz: number) => {
        const g = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 120), ringMat);
        g.rotation.set(rx, ry, rz);
        nodesRoot.add(g);
      };
      mkRing(8.1, 1.35, 0.2, 0.0);
      mkRing(9.4, 0.3, 1.1, 1.2);
      mkRing(7.3, 0.9, -1.0, 0.6);

      scene.add(nodesRoot);

      /* ══════════════════════════════════════════════
         BLACK HOLES  +  ATOMIC RAYS
      ══════════════════════════════════════════════ */
      const rayMeshes: any[] = [];

      function makeAtomicRay(length: number, dir: any, baseRadius = 1.2) {
        const holder = new THREE.Group();

        const coreGeo = new THREE.CylinderGeometry(0.014, 0.05, length, 5, 1, true);
        coreGeo.translate(0, length * 0.5, 0);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0x2f6bff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.NormalBlending,
        });
        holder.add(new THREE.Mesh(coreGeo, coreMat));

        const glowGeo = new THREE.CylinderGeometry(0.05, 0.16, length, 7, 1, true);
        glowGeo.translate(0, length * 0.5, 0);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x9ec6ff,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        holder.add(glow);

        holder.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        holder.position.copy(dir).normalize().multiplyScalar(baseRadius);

        const core = holder.children[0] as any;
        rayMeshes.push({ core, glow, holder, phase: Math.random() * 6.283 });
        return holder;
      }

      function makeBlackHole(position: any) {
        const group = new THREE.Group();
        group.position.copy(position);

        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x000008,
          roughness: 0.32,
          metalness: 0.9,
          emissive: 0x0a1a55,
          emissiveIntensity: 0.16,
        });
        group.add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 32), coreMat));

        const auraMat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(0x5f96ff) },
            uPower: { value: 3.2 },
            uOpacity: { value: 0.85 },
          },
          vertexShader: AURA_VERT,
          fragmentShader: AURA_FRAG,
          transparent: true,
          depthWrite: false,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(new THREE.SphereGeometry(1.28, 32, 24), auraMat));

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.78, 0.016, 12, 64),
          new THREE.MeshBasicMaterial({
            color: 0xcfe4ff,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        ring.rotation.x = Math.PI / 2 + Math.random() * 0.8;
        ring.rotation.y = Math.random() * 3.14;
        group.add(ring);

        const rays = new THREE.Group();
        const rng = (() => {
          let s = position.x * 37 + position.y * 71 + position.z * 123;
          return () => (s = (s * 16807) % 2147483647) / 2147483647;
        })();
        for (let i = 0; i < 12; i++) {
          const dir = new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
          rays.add(makeAtomicRay(2.6 + rng() * 3.4, dir, 0.95));
        }
        group.add(rays);

        group.userData.rays = rays;
        scene.add(group);
        return group;
      }

      const holes = [
        makeBlackHole(new THREE.Vector3(-5.6, 1.3, -1.2)),
        makeBlackHole(new THREE.Vector3(5.0, -1.4, 0.7)),
        makeBlackHole(new THREE.Vector3(0.7, 2.7, 2.3)),
      ];

      /* ── Animation Loop ── */
      const clock = new THREE.Clock();
      let raf: number;

      function animate() {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Stars twinkle + shell rotation
        starMat.uniforms.uTime.value = t;
        stars.rotation.y += 0.00035;

        // Nodal structure drift
        nodesRoot.rotation.y += 0.0011;
        nodesRoot.rotation.x = Math.sin(t * 0.1) * 0.12;

        // Black holes: spin rays + pulse
        holes.forEach((h) => {
          h.userData.rays.rotation.y += 0.012;
          h.userData.rays.rotation.z = Math.sin(t * 0.35 + h.position.x) * 0.02;
        });
        rayMeshes.forEach((r: any) => {
          const s = 1 + 0.1 * Math.sin(t * 3.2 + r.phase);
          r.holder.scale.set(1, s, 1);
          const pulse = 0.28 + 0.1 * Math.sin(t * 3.2 + r.phase);
          r.core.material.opacity = pulse;
          r.glow.material.opacity = pulse * 0.75;
        });

        renderer.render(scene, camera);
      }
      animate();

      /* ── Resize ── */
      const onResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', onResize);

      sceneRef.current = { scene, camera, renderer, stars, nodesRoot, holes };

      // Cleanup
      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  /* ── Scroll parallax ── */
  useEffect(() => {
    if (!sceneRef.current) return;
    const { camera, nodesRoot, stars } = sceneRef.current;
    const factor = scrollY * 0.003;
    camera.position.y = 6.5 - factor * 2;
    camera.position.z = 19 - factor * 0.5;
    nodesRoot.rotation.y = factor * 0.5;
    stars.rotation.y = factor * 0.3;
  }, [scrollY]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
