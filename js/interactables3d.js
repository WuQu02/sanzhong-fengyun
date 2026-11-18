/* 三中风云 — 环境中的可交互生灵与器物 */
(function () {
  'use strict';
  if (!window.THREE || !window.ThreeWorld) return;
  const THREE = window.THREE;
  const T = window.ThreeWorld.prototype;

  function addShadow(self, g, sx, sz) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: self.tex.shadow, transparent: true, opacity: .55, depthWrite: false, color: 0x000000 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = .008; sh.renderOrder = 2; g.add(sh); return sh;
  }

  T._makeRabbit = function () {
    const g = new THREE.Group();
    const fur = this._std(0xf0f3ef, { roughness: .88 });
    const pink = this._basic(0xe9a3ad);
    this._mesh(g, new THREE.SphereGeometry(.23, 14, 10), fur, 0, .26, 0, 1.1, .9, 1.25);
    this._mesh(g, new THREE.SphereGeometry(.16, 12, 10), fur, .1, .52, .03, 1, .95, .95);
    this._mesh(g, new THREE.CapsuleGeometry(.04, .22, 4, 6), fur, .04, .76, .02, 1, 1, .8, 0, 0, -.14);
    this._mesh(g, new THREE.CapsuleGeometry(.04, .22, 4, 6), fur, .16, .76, .02, 1, 1, .8, 0, 0, .14);
    this._mesh(g, new THREE.SphereGeometry(.028, 8, 6), this._basic(0x182a34), .04, .56, .17);
    this._mesh(g, new THREE.SphereGeometry(.028, 8, 6), this._basic(0x182a34), .17, .56, .17);
    this._mesh(g, new THREE.SphereGeometry(.02, 6, 5), pink, .11, .51, .18);
    this._mesh(g, new THREE.SphereGeometry(.07, 8, 6), fur, -.2, .3, -.12);
    addShadow(this, g, .7, .3);
    g.scale.setScalar(1.15);
    return { group: g, kind: 'rabbit' };
  };

  T._makeCat = function () {
    const g = new THREE.Group();
    const fur = this._std(0x30363a, { roughness: .9 });
    const dark = this._std(0x171b1e, { roughness: .9 });
    this._mesh(g, new THREE.SphereGeometry(.25, 14, 10), fur, 0, .3, 0, 1.5, .7, .9);
    this._mesh(g, new THREE.SphereGeometry(.19, 12, 10), fur, .18, .55, .04, 1, .9, 1);
    this._mesh(g, new THREE.ConeGeometry(.09, .22, 4), dark, .07, .74, .02, 1, 1, .8, 0, 0, -.2);
    this._mesh(g, new THREE.ConeGeometry(.09, .22, 4), dark, .28, .74, .02, 1, 1, .8, 0, 0, .2);
    this._mesh(g, new THREE.SphereGeometry(.035, 8, 6), this._basic(0xbff27b), .12, .57, .2);
    this._mesh(g, new THREE.SphereGeometry(.035, 8, 6), this._basic(0xbff27b), .25, .57, .2);
    const tail = new THREE.Group(); tail.position.set(-.35, .28, 0); g.add(tail);
    this._mesh(tail, new THREE.CapsuleGeometry(.05, .4, 4, 6), fur, -.15, .16, 0, 1, 1, 1, 0, 0, -.8);
    addShadow(this, g, .9, .4);
    g.scale.setScalar(1.1);
    return { group: g, kind: 'cat', tail };
  };

  T._makeLantern = function () {
    const g = new THREE.Group();
    const stone = this._std(0x3c4a4c, { roughness: 1, flat: true });
    const warm = this._std(0xffcf8c, { roughness: .5, emissive: 0xff9e52, ei: .8 });
    this._mesh(g, new THREE.CylinderGeometry(.2, .28, .65, 6), stone, 0, .32, 0);
    this._mesh(g, new THREE.BoxGeometry(.5, .55, .5), stone, 0, .9, 0);
    this._mesh(g, new THREE.BoxGeometry(.3, .33, .31), warm, 0, .9, .02);
    this._mesh(g, new THREE.ConeGeometry(.44, .28, 4), stone, 0, 1.28, 0, 1, 1, 1, 0, Math.PI / 4, 0);
    const glow = this._sprite(g, this.tex.glowGold, 0xffb66e, 0, .9, .2, 1.4, 1.4, .18, true);
    addShadow(this, g, 1.2, .5);
    return { group: g, kind: 'lantern', glow, warm };
  };

  T._makeKoi = function () {
    const g = new THREE.Group();
    const water = this._basic(0x88dfee, { transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
    this._mesh(g, new THREE.CircleGeometry(.75, 22), water, 0, .012, 0, 1.2, 1, .5, -Math.PI / 2, 0, 0);
    const fish = new THREE.Group(); fish.position.y = .06; g.add(fish);
    const orange = this._std(0xf18b4e, { roughness: .55, emissive: 0x6d2c13, ei: .1 });
    this._mesh(fish, new THREE.SphereGeometry(.14, 12, 8), orange, 0, .03, 0, 1.6, .55, .8);
    this._mesh(fish, new THREE.ConeGeometry(.1, .18, 4), orange, -.24, .03, 0, 1, 1, .5, 0, 0, 1.3);
    this._mesh(fish, new THREE.SphereGeometry(.018, 6, 5), this._basic(0x18232a), .16, .06, .07);
    addShadow(this, g, .8, .35);
    return { group: g, kind: 'koi', fish };
  };

  T._makeChime = function () {
    const g = new THREE.Group();
    const wood = this._std(0x4a382a, { roughness: 1 });
    this._mesh(g, new THREE.CylinderGeometry(.04, .06, 1.4, 5), wood, -.34, .7, 0);
    this._mesh(g, new THREE.CylinderGeometry(.04, .06, 1.4, 5), wood, .34, .7, 0);
    this._mesh(g, new THREE.BoxGeometry(.9, .06, .08), wood, 0, 1.38, 0);
    const chime = new THREE.Group(); chime.position.y = 1.35; g.add(chime);
    const metal = this._std(0xb9c4c4, { roughness: .35, metalness: .45 });
    for (let i = 0; i < 4; i++) this._mesh(chime, new THREE.CylinderGeometry(.03, .045, .45 + i * .1, 6), metal, -.25 + i * .17, -.32 - i * .05, 0);
    addShadow(this, g, .9, .5);
    return { group: g, kind: 'chime', chime };
  };

  T._makeCrane = function () {
    const g = new THREE.Group();
    const paper = this._std(0xf1eee3, { roughness: .85 });
    this._mesh(g, new THREE.ConeGeometry(.14, .5, 4), paper, 0, .45, 0, 1, 1, .8, .4, 0, 0);
    this._mesh(g, new THREE.ConeGeometry(.08, .3, 4), paper, .28, .58, 0, 1, 1, .7, 0, 0, -1.2);
    this._mesh(g, new THREE.ConeGeometry(.18, .4, 4), paper, -.1, .45, .06, 1, 1, .1, 0, 0, 1.2);
    this._mesh(g, new THREE.ConeGeometry(.18, .4, 4), paper, -.1, .45, -.06, 1, 1, .1, 0, 0, -1.2);
    this._mesh(g, new THREE.SphereGeometry(.024, 6, 5), this._basic(0x2e2a26), .4, .66, .04);
    addShadow(this, g, .55, .25);
    return { group: g, kind: 'crane' };
  };

  T._makeIncense = function () {
    const g = new THREE.Group();
    const bronze = this._std(0x6e5338, { roughness: .55, metalness: .35 });
    this._mesh(g, new THREE.CylinderGeometry(.3, .2, .3, 10), bronze, 0, .16, 0);
    this._mesh(g, new THREE.CylinderGeometry(.34, .34, .06, 10), bronze, 0, .32, 0);
    for (let i = 0; i < 3; i++) this._mesh(g, new THREE.CylinderGeometry(.012, .012, .45, 5), this._std(0x513b29), -.08 + i * .08, .55, 0);
    const smoke = this._sprite(g, this.tex.snow, 0xd7d2c2, 0, 1.1, .05, .9, 1.7, .1, false);
    addShadow(this, g, .8, .4);
    return { group: g, kind: 'incense', smoke };
  };

  T._makeBell = function () {
    const g = new THREE.Group();
    const wood = this._std(0x443124, { roughness: 1 });
    const bronze = this._std(0x7c6139, { roughness: .45, metalness: .55, flat: true });
    this._mesh(g, new THREE.CylinderGeometry(.09, .12, 2.5, 6), wood, -.62, 1.25, 0);
    this._mesh(g, new THREE.CylinderGeometry(.09, .12, 2.5, 6), wood, .62, 1.25, 0);
    this._mesh(g, new THREE.BoxGeometry(1.5, .12, .16), wood, 0, 2.5, 0);
    const bell = new THREE.Group(); bell.position.y = 2.46; g.add(bell);
    this._mesh(bell, new THREE.CylinderGeometry(.22, .45, .7, 10), bronze, 0, -.4, 0);
    this._mesh(bell, new THREE.CylinderGeometry(.04, .04, .32, 6), this._std(0x57452e), 0, -.02, 0);
    addShadow(this, g, 1.2, .5);
    return { group: g, kind: 'bell', bell };
  };

  T._makeSwordsman = function () {
    const g = new THREE.Group();
    const robe = this._std(0x20272e, { roughness: .9, flat: true });
    const robe2 = this._std(0x39434b, { roughness: .9, flat: true });
    const skin = this._std(0xd6b7a6, { roughness: .62 });
    const hair = this._std(0x0d1117, { roughness: .55 });
    const hat = this._std(0x3e3428, { roughness: 1, flat: true });
    const steel = this._std(0x9b9c96, { roughness: .35, metalness: .4, flat: true });
    this._mesh(g, new THREE.CylinderGeometry(.3, .52, 1.55, 8), robe, 0, .85, 0);
    this._mesh(g, new THREE.CylinderGeometry(.32, .47, .32, 8), robe2, 0, 1.68, 0);
    this._mesh(g, new THREE.SphereGeometry(.22, 16, 12), skin, 0, 1.95, .02, .9, 1.04, .9);
    this._mesh(g, new THREE.SphereGeometry(.24, 14, 10), hair, 0, 2.04, -.09, .95, .86, .95);
    this._mesh(g, new THREE.ConeGeometry(.24, 1.0, 5), hair, 0, 1.45, -.24, 1, 1, .7);
    // 斗笠
    this._mesh(g, new THREE.ConeGeometry(.72, .3, 14), hat, 0, 2.34, 0);
    this._mesh(g, new THREE.CylinderGeometry(.6, .7, .055, 14), hat, 0, 2.18, 0);
    // 眉眼（帽檐下的阴影）
    this._mesh(g, new THREE.BoxGeometry(.24, .018, .012), this._basic(0x271c1b), 0, 1.99, .21);
    this._mesh(g, new THREE.BoxGeometry(.08, .008, .012), this._basic(0x8d5b51), 0, 1.78, .21);
    // 臂
    this._mesh(g, new THREE.CapsuleGeometry(.095, .5, 5, 8), robe2, -.34, 1.38, .02);
    this._mesh(g, new THREE.CapsuleGeometry(.095, .5, 5, 8), robe2, .34, 1.38, .02);
    this._mesh(g, new THREE.SphereGeometry(.08, 8, 6), skin, -.34, 1.07, .03);
    // 背后长剑
    this._mesh(g, new THREE.BoxGeometry(.055, 1.8, .05), steel, -.12, 1.18, -.36, 1, 1, 1, 0, 0, .2);
    this._mesh(g, new THREE.CylinderGeometry(.04, .045, .35, 6), robe2, -.3, .55, -.38, 1, 1, 1, 0, 0, .2);
    this._mesh(g, new THREE.TorusGeometry(.23, .018, 5, 14), this._basic(0xc8e9e7, { transparent: true, opacity: .45 }), -.12, 1.18, -.37, 1, 1.75, 1, 0, 0, .2);
    addShadow(this, g, 1.35, .62);
    return { group: g, kind: 'swordsman' };
  };

  T._makeSchoolBell = function () {
    const g = new THREE.Group();
    const wood = this._std(0x4b3626, { roughness: 1, flat: true });
    const brass = this._std(0x9c7b42, { roughness: .35, metalness: .55, flat: true });
    this._mesh(g, new THREE.CylinderGeometry(.06, .08, 1.7, 6), wood, 0, .85, 0);
    this._mesh(g, new THREE.BoxGeometry(.8, .07, .08), wood, .3, 1.68, 0);
    const bell = new THREE.Group(); bell.position.set(.56, 1.62, 0); g.add(bell);
    this._mesh(bell, new THREE.ConeGeometry(.18, .35, 12, 1, true), brass, 0, -.16, 0);
    this._mesh(bell, new THREE.SphereGeometry(.04, 6, 5), brass, 0, -.36, 0);
    this._mesh(bell, new THREE.CylinderGeometry(.015, .015, .3, 4), this._std(0x3a2b1e), 0, -.02, 0);
    this._sprite(g, this.tex.glowGold, 0xffd68c, .56, 1.4, .1, .9, .9, .08, true);
    addShadow(this, g, .8, .35);
    return { group: g, kind: 'schoolbell', bell };
  };

  T._makeSign = function () {
    const g = new THREE.Group();
    const wood = this._std(0x4b3626, { roughness: 1, flat: true });
    const paper = this._std(0xd6c8a7, { roughness: .9 });
    this._mesh(g, new THREE.CylinderGeometry(.055, .07, 1.3, 5), wood, -.36, .65, 0);
    this._mesh(g, new THREE.CylinderGeometry(.055, .07, 1.3, 5), wood, .36, .65, 0);
    this._mesh(g, new THREE.BoxGeometry(1.05, .62, .08), paper, 0, 1.12, 0);
    this._mesh(g, new THREE.BoxGeometry(1.12, .07, .11), wood, 0, 1.46, 0);
    this._mesh(g, new THREE.BoxGeometry(1.12, .07, .11), wood, 0, .78, 0);
    // 红色告示笔迹
    for (let i = 0; i < 4; i++) this._mesh(g, new THREE.BoxGeometry(.5, .022, .012), this._basic(0x7e2a26, { transparent: true, opacity: .7 }), -.05, 1.3 - i * .12, .05);
    this._mesh(g, new THREE.CylinderGeometry(.09, .09, .02, 12), this._basic(0x9c2e29), .38, 1.1, .05, 1, 1, 1, Math.PI / 2, 0, 0);
    addShadow(this, g, 1.2, .5);
    return { group: g, kind: 'sign' };
  };

  T._makeInteractable = function (it) {
    const f = { rabbit: '_makeRabbit', cat: '_makeCat', lantern: '_makeLantern', koi: '_makeKoi', chime: '_makeChime', crane: '_makeCrane', incense: '_makeIncense', bell: '_makeBell', swordsman: '_makeSwordsman', sign: '_makeSign', schoolbell: '_makeSchoolBell' }[it.kind];
    if (!f || !this[f]) return null;
    const m = this[f]();
    m.model = it;
    m.baseX = it.x;
    this.actorGroup.add(m.group);
    return m;
  };

  T.updateInteractables3D = function (game) {
    if (!this.interactModels) this.interactModels = new Map();
    if (this.interStage !== game.level.id) {
      for (const m of this.interactModels.values()) this.actorGroup.remove(m.group);
      this.interactModels.clear();
      this.interStage = game.level.id;
    }
    for (const it of game.interactables || []) {
      let m = this.interactModels.get(it.id);
      if (!m) {
        m = this._makeInteractable(it);
        if (!m) continue;
        this.interactModels.set(it.id, m);
      }
      const x = it.x / 100, z = it.z || 0, y = (850 - it.y) / 100;
      const t = this.lastTime + (it.x * .01);
      let bob = 0;
      if (m.kind === 'rabbit') bob = Math.abs(Math.sin(t * 2.2)) * .06;
      if (m.kind === 'crane') bob = Math.sin(t * 2.6) * .08;
      if (m.kind === 'koi') m.fish.position.x = Math.sin(t * 1.3) * .25;
      if (m.kind === 'cat' && m.tail) m.tail.rotation.z = Math.sin(t * 1.7) * .12;
      if (m.kind === 'chime' && m.chime) m.chime.rotation.z = Math.sin(t * 1.4) * .06;
      if (m.kind === 'bell' && m.bell) m.bell.rotation.z = Math.sin(t * .8) * .03;
      if (m.kind === 'incense' && m.smoke) m.smoke.material.opacity = .08 + Math.sin(t) * .02;
      if (it.used) {
        const age = game.time - (it.interactAt || 0);
        if (m.kind === 'rabbit' && age < 2) bob += Math.abs(Math.sin(age * 15)) * .35;
        if (m.kind === 'cat' && m.tail) m.tail.rotation.z += Math.sin(age * 9) * .25 * Math.max(0, 1 - age / 2);
        if (m.kind === 'lantern' && m.glow) m.glow.material.opacity = Math.min(.42, .2 + Math.sin(age * 2) * .06);
        if (m.kind === 'chime' && m.chime && age < 2) m.chime.rotation.z += Math.sin(age * 14) * .3 * (1 - age / 2);
        if (m.kind === 'bell' && m.bell && age < 3) m.bell.rotation.z += Math.sin(age * 7) * .18 * (1 - age / 3);
        if (m.kind === 'crane' && age < 4) { bob += Math.min(3, age * 1.2); m.group.rotation.y += .08; }
        if (m.kind === 'koi' && age < 2) bob += Math.sin(age * 6) * .08;
        if (m.kind === 'schoolbell' && m.bell && age < 3) m.bell.rotation.z += Math.sin(age * 12) * .3 * (1 - age / 3);
        if (m.kind === 'swordsman' && age < 4) m.group.rotation.z = Math.sin(age * 2.2) * .035 * (1 - age / 4);
      }
      m.group.position.set(x, y + bob, z);
    }
  };
})();
