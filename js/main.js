try {
    document.documentElement.dataset.theme =
        localStorage.getItem("ja-theme") === "light"
            ? "light"
            : "dark";
} catch { }

(() => {
    const initialize = () => {
        (() => {
            "use strict";
            const root = document.documentElement;
            const theme = document.getElementById("jaTheme");
            const motion = document.getElementById("jaMotion");
            const reduced = matchMedia("(prefers-reduced-motion: reduce)");
            const finePointer = matchMedia(
                "(hover: hover) and (pointer: fine)",
            );
            let effects = true;
            try {
                effects = localStorage.getItem("ja-effects") !== "off";
            } catch { }
            const updateEffects = () => {
                const on = effects && !reduced.matches;
                root.dataset.effects = on ? "on" : "off";
                motion.setAttribute("aria-pressed", String(on));
                motion.setAttribute(
                    "aria-label",
                    on ? "Pausar efectos" : "Activar efectos",
                );
                motion.disabled = reduced.matches;
                motion.title = reduced.matches
                    ? "Movimiento reducido según tus preferencias del sistema"
                    : on
                        ? "Pausar efectos"
                        : "Activar efectos";
                document
                    .querySelectorAll('[style*="--pointer"]')
                    .forEach((card) => {
                        card.style.removeProperty("--pointer-x");
                        card.style.removeProperty("--pointer-y");
                    });
            };
            updateEffects();
            motion.addEventListener("click", () => {
                effects = !effects;
                updateEffects();
                try {
                    localStorage.setItem(
                        "ja-effects",
                        effects ? "on" : "off",
                    );
                } catch { }
            });
            reduced.addEventListener("change", updateEffects);

            const setTheme = (value) => {
                const dark = value !== "light";
                root.dataset.theme = dark ? "dark" : "light";
                theme.setAttribute("aria-pressed", String(dark));
                theme.setAttribute(
                    "aria-label",
                    dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
                );
                document.querySelector('meta[name="theme-color"]').content =
                    getComputedStyle(root).getPropertyValue("--ja-bg").trim() ||
                    (dark ? "#12090d" : "#fff6f7");
            };
            setTheme(root.dataset.theme);
            theme.addEventListener("click", () => {
                setTheme(root.dataset.theme === "dark" ? "light" : "dark");
                try {
                    localStorage.setItem("ja-theme", root.dataset.theme);
                } catch { }
            });
            window.addEventListener("storage", (event) => {
                if (event.key === "ja-theme") setTheme(event.newValue);
                if (event.key === "ja-effects") {
                    effects = event.newValue !== "off";
                    updateEffects();
                }
            });

            const tabs = [...document.querySelectorAll("[data-person]")];
            const panels = {
                angel: document.getElementById("profile-angel"),
                juanjo: document.getElementById("profile-juanjo"),
            };
            document
                .querySelector(".ja-profile-switch")
                .setAttribute("role", "tablist");
            tabs.forEach((tab) => {
                tab.setAttribute("role", "tab");
                tab.setAttribute(
                    "aria-controls",
                    `profile-${tab.dataset.person}`,
                );
            });
            Object.values(panels).forEach((panel) =>
                panel.setAttribute("role", "tabpanel"),
            );
            const selectProfile = (person) => {
                const selected = person === "juanjo" ? "juanjo" : "angel";
                root.dataset.person = selected;
                Object.entries(panels).forEach(([key, panel]) => {
                    panel.hidden = key !== selected;
                });
                tabs.forEach((tab) => {
                    const active = tab.dataset.person === selected;
                    tab.setAttribute("aria-selected", String(active));
                    tab.tabIndex = active ? 0 : -1;
                });
                document
                    .querySelectorAll("[data-person-link]")
                    .forEach((link) => {
                        if (link.dataset.personLink === selected)
                            link.setAttribute("aria-current", "location");
                        else link.removeAttribute("aria-current");
                    });
            };
            const profileForHash = (hash) => {
                const target = document.getElementById(
                    hash.replace(/^#/, ""),
                );
                return target?.closest("#profile-juanjo") ||
                    hash === "#juanjo"
                    ? "juanjo"
                    : "angel";
            };
            const followHash = (scroll = false) => {
                selectProfile(profileForHash(location.hash));
                if (scroll)
                    document
                        .getElementById(location.hash.slice(1))
                        ?.scrollIntoView({
                            behavior: "instant",
                            block: "start",
                        });
            };
            followHash();
            if (location.hash)
                requestAnimationFrame(() => followHash(true));
            window.addEventListener("hashchange", () => followHash(true));
            window.addEventListener("popstate", () => followHash(true));

            tabs.forEach((tab, index) =>
                tab.addEventListener("keydown", (event) => {
                    let next;
                    if (event.key === "ArrowRight")
                        next = (index + 1) % tabs.length;
                    if (event.key === "ArrowLeft")
                        next = (index + tabs.length - 1) % tabs.length;
                    if (event.key === "Home") next = 0;
                    if (event.key === "End") next = tabs.length - 1;
                    if (next !== undefined) {
                        event.preventDefault();
                        tabs[next].focus();
                    }
                    if (event.key === " ") {
                        event.preventDefault();
                        tab.click();
                    }
                }),
            );
            document.querySelectorAll('a[href^="#"]').forEach((link) =>
                link.addEventListener("click", (event) => {
                    if (
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey
                    )
                        return;
                    const target = document.getElementById(
                        link.hash.slice(1),
                    );
                    if (!target) return;
                    event.preventDefault();
                    if (link.hash !== "#inicio")
                        selectProfile(profileForHash(link.hash));
                    if (location.hash !== link.hash)
                        history.pushState(null, "", link.hash);
                    const destination = link.dataset.person
                        ? panels[link.dataset.person]
                        : target;
                    destination.scrollIntoView({
                        behavior:
                            root.dataset.effects === "on"
                                ? "smooth"
                                : "instant",
                        block: "start",
                    });
                    if (!link.dataset.person) {
                        if (!destination.hasAttribute("tabindex"))
                            destination.setAttribute("tabindex", "-1");
                        destination.focus({ preventScroll: true });
                    }
                }),
            );

            if ("IntersectionObserver" in window && !reduced.matches) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add("is-visible");
                                observer.unobserve(entry.target);
                            }
                        });
                    },
                    { threshold: 0.06 },
                );
                document
                    .querySelectorAll("[data-reveal]")
                    .forEach((item) => observer.observe(item));
                root.classList.add("ja-reveal-ready");
                reduced.addEventListener("change", () => {
                    if (reduced.matches) {
                        root.classList.remove("ja-reveal-ready");
                        observer.disconnect();
                    }
                });
                window.addEventListener("beforeprint", () =>
                    root.classList.remove("ja-reveal-ready"),
                );
            }
            document
                .querySelectorAll(
                    ".ja-person-choice,.ja-profile,.ja-project,.ja-interest-primary,.ja-hobby-grid article,.ja-juanjo-placeholder",
                )
                .forEach((card) => {
                    let frame;
                    card.addEventListener("pointermove", (event) => {
                        if (
                            root.dataset.effects !== "on" ||
                            !finePointer.matches
                        )
                            return;
                        cancelAnimationFrame(frame);
                        frame = requestAnimationFrame(() => {
                            if (
                                root.dataset.effects !== "on" ||
                                !finePointer.matches
                            )
                                return;
                            const box = card.getBoundingClientRect();
                            card.style.setProperty(
                                "--pointer-x",
                                `${event.clientX - box.left}px`,
                            );
                            card.style.setProperty(
                                "--pointer-y",
                                `${event.clientY - box.top}px`,
                            );
                        });
                    });
                    card.addEventListener("pointerleave", () => {
                        cancelAnimationFrame(frame);
                        card.style.removeProperty("--pointer-x");
                        card.style.removeProperty("--pointer-y");
                    });
                });

            const photoDialog = document.getElementById('jaPhotoDialog');
            const photoImage = document.getElementById('jaPhotoImage');
            const photoCaption = document.getElementById('jaPhotoCaption');
            const photoCount = document.getElementById('jaPhotoCount');
            const photoClose = document.getElementById('jaPhotoClose');
            const photoStage = photoDialog.querySelector('.ja-lightbox-stage');
            const photoStatus = document.getElementById('jaPhotoStatus');
            const photoOriginal = document.getElementById('jaPhotoOriginal');
            const photoThumbs = [...document.querySelectorAll('[data-gallery-photo]')];
            const photos = [
                { src: 'Angel.webp', alt: 'Retrato de Ángel Jesús Escamilla Rodríguez', caption: 'Ángel Escamilla', width: 1060, height: 1484 },
                { src: 'Angel.Vehiculo.jpeg', alt: 'Ángel con casco, sentado en el vehículo de Photonix 7', caption: 'Ángel · Photonix 7', width: 1080, height: 1440 },
                { src: 'moto_angel.jpeg', alt: 'Ángel en su motocicleta', caption: 'Ángel · Motocicleta', width: 900, height: 1600 }
            ];
            let photoIndex = 0;
            let photoTrigger;
            const setPhotoStatus = (loading, error = false) => {
                if (photoStage) {
                    photoStage.dataset.loading = String(loading);
                    photoStage.dataset.error = String(error);
                }
                if (photoStatus) {
                    photoStatus.hidden = !loading && !error;
                    photoStatus.textContent = loading
                        ? 'Cargando fotografía…'
                        : error
                            ? 'No se pudo cargar la foto. Abre la imagen original.'
                            : '';
                }
            };
            photoImage.addEventListener('load', () => setPhotoStatus(false));
            photoImage.addEventListener('error', () => setPhotoStatus(false, true));
            const showPhoto = (index) => {
                photoIndex = (index + photos.length) % photos.length;
                const photo = photos[photoIndex];
                setPhotoStatus(true);
                photoImage.width = photo.width;
                photoImage.height = photo.height;
                photoImage.alt = photo.alt;
                photoCaption.textContent = photo.caption;
                photoCount.textContent = `${photoIndex + 1} / ${photos.length}`;
                if (photoOriginal) photoOriginal.href = photo.src;
                photoThumbs.forEach(thumb => thumb.setAttribute('aria-pressed', String(Number(thumb.dataset.galleryPhoto) === photoIndex)));
                photoImage.src = photo.src;
                requestAnimationFrame(() => {
                    if (photoImage.getAttribute('src') === photo.src && photoImage.complete)
                        setPhotoStatus(false, photoImage.naturalWidth === 0);
                });
            };
            if (typeof photoDialog.showModal === 'function') {
                document.querySelectorAll('[data-photo]').forEach((link) => {
                    link.setAttribute('aria-haspopup', 'dialog');
                    link.addEventListener('click', (event) => {
                        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                        event.preventDefault();
                        photoTrigger = link;
                        showPhoto(Number(link.dataset.photo));
                        if (!photoDialog.open) photoDialog.showModal();
                        root.classList.add('ja-photo-open');
                        photoClose.focus();
                    });
                });
                photoThumbs.forEach(thumb => thumb.addEventListener('click', () => showPhoto(Number(thumb.dataset.galleryPhoto))));
                photoClose.addEventListener('click', () => photoDialog.close());
                document.getElementById('jaPhotoPrevious').addEventListener('click', () => showPhoto(photoIndex - 1));
                document.getElementById('jaPhotoNext').addEventListener('click', () => showPhoto(photoIndex + 1));
                photoDialog.addEventListener('keydown', (event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                        event.preventDefault();
                        showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
                    }
                });
                photoDialog.addEventListener('click', (event) => {
                    if (event.target !== photoDialog) return;
                    const box = photoDialog.getBoundingClientRect();
                    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) photoDialog.close();
                });
                photoDialog.addEventListener('close', () => {
                    root.classList.remove('ja-photo-open');
                    photoTrigger?.focus({ preventScroll: true });
                });
            }

        })();
                (() => {
            'use strict';
            const d = document, root = d.documentElement;
            const q = (s, c = d) => c.querySelector(s);
            const qa = (s, c = d) => [...c.querySelectorAll(s)];
            const fine = matchMedia('(hover: hover) and (pointer: fine)');
            const reduced = matchMedia('(prefers-reduced-motion: reduce)');
            const motionOn = () => root.dataset.effects !== 'off' && !reduced.matches;
            const bar = d.createElement('div');
            bar.className = 'ja-bar';
            bar.setAttribute('aria-hidden', 'true');
            d.body.append(bar);
            const lights = qa('.ja-ambient__light');
            const backTop = q('#jaBackTop');
            const exploreLinks = qa('.ja-explore-link');
            const exploreSections = exploreLinks.map(link => q(link.hash));
            let currentExplore = -1;
            const updateExplore = () => {
                if (root.dataset.person === 'juanjo') return;
                const marker = (q('.ja-nav')?.getBoundingClientRect().height || 100) + 70;
                let active = 0;
                exploreSections.forEach((section, index) => {
                    if (section && section.getBoundingClientRect().top <= marker) active = index;
                });
                if (active === currentExplore) return;
                currentExplore = active;
                exploreLinks.forEach((link, index) => {
                    if (index === active) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            };
            let scrollFrame = 0;
            const updateScroll = () => {
                scrollFrame = 0;
                const max = root.scrollHeight - innerHeight;
                if (backTop) {
                    backTop.hidden = scrollY < 500;
                    backTop.style.setProperty('--ja-reading', max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0);
                }
                updateExplore();
                bar.style.transform = `scaleX(${max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0})`;
                lights.forEach((light, i) => {
                    light.style.translate = motionOn() ? `0 ${Math.min(scrollY, 1500) * (i % 2 ? -.06 : .09)}px` : '';
                });
            };
            addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, {passive:true});
            addEventListener('resize', updateScroll);
            updateScroll();
            const halo = d.createElement('div');
            halo.className = 'ja-halo';
            halo.setAttribute('aria-hidden','true');
            d.body.append(halo);
            let hx = 0, hy = 0, tx = 0, ty = 0, haloFrame = 0;
            const moveHalo = () => {
                if (!motionOn() || !fine.matches) { haloFrame = 0; return; }
                hx += (tx - hx) * .14;
                hy += (ty - hy) * .14;
                halo.style.transform = `translate(${hx}px,${hy}px)`;
                haloFrame = Math.abs(tx - hx) + Math.abs(ty - hy) > .5 ? requestAnimationFrame(moveHalo) : 0;
            };
            addEventListener('pointermove', (e) => {
                if (!motionOn() || !fine.matches || e.pointerType !== 'mouse') return;
                tx = e.clientX; ty = e.clientY;
                halo.classList.add('on');
                if (!haloFrame) haloFrame = requestAnimationFrame(moveHalo);
            }, {passive:true});
            root.addEventListener('pointerleave', () => halo.classList.remove('on'));
            const snapshots = qa('.ja-snapshot');
            const tiltFrames = new Map();
            const resetCardTilt = (card) => {
                cancelAnimationFrame(tiltFrames.get(card));
                tiltFrames.delete(card);
                card.style.removeProperty('--rx');
                card.style.removeProperty('--ry');
            };
            const resetTilt = () => snapshots.forEach(resetCardTilt);
            snapshots.forEach(card => {
                let pointerX = 0, pointerY = 0;
                card.addEventListener('pointermove', (e) => {
                    if (!motionOn() || !fine.matches || e.pointerType !== 'mouse') return;
                    pointerX = e.clientX;
                    pointerY = e.clientY;
                    if (tiltFrames.has(card)) return;
                    tiltFrames.set(card, requestAnimationFrame(() => {
                        tiltFrames.delete(card);
                        if (!motionOn() || !fine.matches) return;
                        const box = card.getBoundingClientRect();
                        if (!box.width || !box.height) return;
                        card.style.setProperty('--ry', ((pointerX - box.left) / box.width - .5) * 10 + 'deg');
                        card.style.setProperty('--rx', (.5 - (pointerY - box.top) / box.height) * 10 + 'deg');
                    }));
                });
                card.addEventListener('pointerleave', () => resetCardTilt(card));
            });
            const name = q('.ja-name');
            if (name) name.dataset.text = name.textContent.trim();
            qa('.ja-drawing svg').forEach(svg => {
                qa('path',svg).forEach(path => path.setAttribute('pathLength','1'));
                svg.classList.add('ja-pl');
            });
            let fadeTimer;
            q('#jaTheme')?.addEventListener('click', () => {
                if (!motionOn()) return;
                clearTimeout(fadeTimer);
                root.classList.add('ja-fade');
                fadeTimer = setTimeout(() => root.classList.remove('ja-fade'),500);
            });
            const sparks = new Set();
            const burst = () => {
                const medal = q('.ja-medal');
                if (!medal || !motionOn() || !Element.prototype.animate) return;
                for (let i = 0; i < 14; i++) {
                    const spark = d.createElement('i');
                    spark.className = 'ja-spark';
                    spark.setAttribute('aria-hidden','true');
                    medal.append(spark);
                    sparks.add(spark);
                    const angle = i / 14 * Math.PI * 2, distance = 90 + Math.random() * 80;
                    const animation = spark.animate([
                        {transform:'translate(0,0) scale(1)',opacity:1},
                        {transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance}px) rotate(180deg) scale(.2)`,opacity:0}
                    ],{duration:900 + Math.random()*500,easing:'cubic-bezier(.2,.7,.2,1)'});
                    animation.onfinish = () => { sparks.delete(spark); spark.remove(); };
                }
            };
            const tally = q('.ja-tally');
            const numbers = tally ? qa('[data-to]',tally) : [];
            let counterFrame = 0;
            const finishCount = () => {
                cancelAnimationFrame(counterFrame);
                counterFrame = 0;
                numbers.forEach(n => n.textContent = n.dataset.to);
                tally?.classList.remove('pre');
            };
            if (tally) {
                const icons = {
                    medal:'<path d="M6 1h5l3 8-3 1zM18 1h-5l-3 8 3 1z"/><circle cx="12" cy="16.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/>',
                    spark:'<path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>'
                };
                qa('.ja-pips',tally).forEach(pips => {
                    pips.innerHTML = Array.from({length:Number(pips.dataset.n)},(_,i)=>`<svg class="ja-pip" style="--i:${i}" viewBox="0 0 24 24" aria-hidden="true">${icons[pips.dataset.k]}</svg>`).join('');
                });
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver((entries) => {
                        if (!entries.some(entry => entry.isIntersecting)) return;
                        observer.disconnect();
                        if (!motionOn()) { finishCount(); return; }
                        tally.classList.add('go');
                        const start = performance.now();
                        const count = (time) => {
                            if (!motionOn()) { finishCount(); return; }
                            const progress = Math.min(1,(time-start)/1400);
                            const eased = 1-Math.pow(1-progress,3);
                            numbers.forEach(n => n.textContent = Math.round(Number(n.dataset.to)*eased));
                            if (progress < 1) counterFrame = requestAnimationFrame(count);
                            else { finishCount(); burst(); }
                        };
                        counterFrame = requestAnimationFrame(count);
                    },{threshold:.25});
                    observer.observe(tally);
                }
            }
            const syncMotion = () => {
                if (!motionOn()) {
                    cancelAnimationFrame(haloFrame); haloFrame = 0;
                    halo.classList.remove('on');
                    resetTilt();
                    finishCount();
                    root.classList.remove('ja-fade');
                    sparks.forEach(spark => { spark.getAnimations().forEach(animation=>animation.cancel()); spark.remove(); });
                    sparks.clear();
                }
                updateScroll();
            };
            new MutationObserver(syncMotion).observe(root,{attributes:true,attributeFilter:['data-effects','data-person']});
            reduced.addEventListener('change',syncMotion);
            fine.addEventListener('change',() => { resetTilt(); halo.classList.remove('on'); });
            syncMotion();
        })();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
