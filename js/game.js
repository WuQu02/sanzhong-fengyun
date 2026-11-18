/* 三中风云 — 游戏主控 */
(function () {
  'use strict';

  const SAVE_KEY = 'sanzhongfengyun_save_v1';
  const SETTINGS_KEY = 'sanzhongfengyun_settings_v1';
  const GROUND = window.GAME_GROUND || 850;
  const DIALOGUE_NAMES = {
    shen: '深寻', liuao: '刘奥', alan: '刘亚岚', narrator: '旁白', echo: '回响', system: '心念'
  };
  const TAU = Math.PI * 2;
  const $ = (id) => document.getElementById(id);

  class Game {
    constructor() {
      this.canvas = $('game');
      this.ctx = this.canvas.getContext('2d');
      this.input = new Input();
      this.audio = new AudioEngine();
      this.el = {
        title: $('titleScreen'), continueBtn: $('continueBtn'),
        hud: $('hud'), hudPortrait: $('hudPortrait'), hudChapter: $('hudChapter'),
        hpFill: $('hpFill'), hpText: $('hpText'), qiFill: $('qiFill'),
        flaskCount: $('flaskCount'), focusText: $('focusText'), focusBadge: $('focusBadge'),
        stageLabel: $('stageLabel'), timerText: $('timerText'), objective: $('objective'),
        combo: $('comboDisplay'), comboNumber: $('comboNumber'), comboRank: $('comboRank'),
        bossBar: $('bossBar'), bossName: $('bossName'), bossTitle: $('bossTitle'),
        bossPhase: $('bossPhase'), bossFill: $('bossFill'),
        toast: $('toast'), chapterCard: $('chapterCard'), chapterCardNum: $('chapterCardNum'),
        chapterCardName: $('chapterCardName'), chapterCardSub: $('chapterCardSub'),
        tutorial: $('tutorial'), bark: $('subtitleBark'),
        dialogue: $('dialogue'), dialoguePortrait: $('dialoguePortrait'),
        dialogueName: $('dialogueName'), dialogueText: $('dialogueText'),
        cinematic: $('cinematic'), cinemaChapter: $('cinemaChapter'), cinemaSkip: $('cinemaSkip'),
        cinemaText: $('cinemaText'), cinemaSpeaker: $('cinemaSpeaker'), cinemaHint: $('cinemaHint'),
        pause: $('pauseScreen'), help: $('helpScreen'), settings: $('settingsScreen'),
        upgrade: $('upgradeScreen'), upgradeCards: $('upgradeCards'),
        death: $('deathScreen'), bigCai: $('bigCai'),
        victoryStamp: $('victoryStamp'), ending: $('endingScreen'), endingStats: $('endingStats'),
        touch: $('touchControls'),
        volMaster: $('volMaster'), volMusic: $('volMusic'), volSfx: $('volSfx'), volVoice: $('volVoice'),
        volMasterVal: $('volMasterVal'), volMusicVal: $('volMusicVal'),
        volSfxVal: $('volSfxVal'), volVoiceVal: $('volVoiceVal'),
        toggleShake: $('toggleShake'), toggleMotion: $('toggleMotion')
      };
      this.state = 'boot';
      this.time = 0;
      this.playTime = 0;
      this.last = 0;
      this.audioReady = false;
      this.level = null;
      this.chapter = 0;
      this.cleared = 0;
      this.upgrades = [];
      this.mods = this.computeMods();
      this.deaths = 0;
      this.stats = { enemies: 0, perfect: 0, maxCombo: 0, damage: 0 };
      this.completed = false;
      this.worldWidth = 1920;
      this.stageIndex = 0;
      this.damageScale = 1;
      this.camera = { x: 960, y: 0 };
      this.shakePower = 0;
      this.hitstop = 0;
      this.slowTimer = 0;
      this.flash = null;
      this.ultFx = null;
      this.combo = 0;
      this.comboTimer = 0;
      this.bossTarget = null;
      this.pendingClear = null;
      this.pendingStartDialogue = false;
      this.chapterIntroTimer = 0;
      this.chapterIntroDone = true;
      this.arenaLock = false;
      this.bounds = { left: 0, right: 1920 };
      this.enemies = [];
      this.projectiles = [];
      this.hazards = [];
      this.particles = [];
      this.texts = [];
      this.encounterActive = false;
      this.encounterIndex = 0;
      this.currentEncounter = null;
      this.encounterWaves = [];
      this.waveIndex = 0;
      this.waveTimer = 0;
      this.boss = null;
      this.dialogueActive = false;
      this.dialogueTyping = false;
      this.dialogueQueue = [];
      this.dialogueIndex = 0;
      this.dialogueChars = 0;
      this.dialogueAdvanceRequested = false;
      this.dialogueReturn = 'playing';
      this.dialogueOnComplete = null;
      this.dialogueFull = '';
      this.cinemaScenes = [];
      this.cinemaIndex = 0;
      this.cinemaSceneT = 0;
      this.cinemaMode = null;
      this.tipTimers = [];
      this.tipsShown = false;
      this.toastTimer = null;
      this.barkTimer = null;
      this.deathTimer = 0;
      this.victoryTimer = 0;
      this.victoryStampShown = false;
      this.modalReturn = null;
      this.settings = this.loadSettings();
      this.bindUI();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'playing') this.togglePause(true);
      });
      this.syncSettingsUI();
      this.showTitle();
      this.last = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    /* ================= 基础 ================= */
    bindUI() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (btn) { e.preventDefault(); this.handleAction(btn.dataset.action, btn); return; }
        const up = e.target.closest('[data-upgrade]');
        if (up) { e.preventDefault(); this.chooseUpgrade(up.dataset.upgrade); }
      });
      this.el.dialogue.addEventListener('click', (e) => {
        e.preventDefault();
        this.dialogueAdvanceRequested = true;
      });
      this.el.cinematic.addEventListener('click', (e) => {
        if (e.target.closest('#cinemaSkip')) return;
        this.advanceCinematic();
      });
      this.el.cinemaSkip.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        this.skipCinematic();
      });
      const unlock = () => { this.ensureAudio(); this.audio.resume(); };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock);

      [['volMaster', 'master'], ['volMusic', 'music'], ['volSfx', 'sfx'], ['volVoice', 'voice']].forEach(([id, key]) => {
        const el = this.el[id];
        el.addEventListener('input', () => {
          this.settings[key] = Number(el.value);
          this.el[id + 'Val'].textContent = el.value;
          this.applyVolumes();
          this.saveSettings();
        });
      });
      this.el.toggleShake.addEventListener('change', () => {
        this.settings.shake = this.el.toggleShake.checked;
        this.saveSettings();
      });
      this.el.toggleMotion.addEventListener('change', () => {
        this.settings.reducedMotion = this.el.toggleMotion.checked;
        this.saveSettings();
      });
      if (U.isTouch()) this.el.touch.classList.remove('hidden');
    }

    handleAction(action, btn) {
      this.ensureAudio();
      this.audio.sfx(action === 'title' || action === 'closeSettings' ? 'uiBack' : 'ui');
      switch (action) {
        case 'new': this.startNewGame(); break;
        case 'continue': this.continueGame(); break;
        case 'help': this.openHelp(); break;
        case 'settings': this.openSettings(); break;
        case 'closeHelp': this.closeHelp(); break;
        case 'closeSettings': this.closeSettings(); break;
        case 'resume': this.resumeGame(); break;
        case 'pause': this.togglePause(true); break;
        case 'title': this.returnToTitle(); break;
        case 'retry': this.retryStage(); break;
      }
    }

    ensureAudio() {
      if (this.audioReady) return;
      this.audio.init();
      this.audioReady = true;
      this.applyVolumes();
      if (this.state === 'title') this.audio.startMusic('title');
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.vw = window.innerWidth; this.vh = window.innerHeight;
      this.canvas.width = Math.max(1, Math.round(this.vw * dpr));
      this.canvas.height = Math.max(1, Math.round(this.vh * dpr));
      this.canvas.style.width = this.vw + 'px';
      this.canvas.style.height = this.vh + 'px';
      this.renderScale = Math.min(this.vw / 1920, this.vh / 1080);
      this.offsetX = (this.vw - 1920 * this.renderScale) / 2;
      this.offsetY = (this.vh - 1080 * this.renderScale) / 2;
      document.documentElement.style.setProperty('--ui-scale', this.renderScale);
    }

    loadSettings() {
      return Object.assign({
        master: 80, music: 55, sfx: 75, voice: 80, shake: true, reducedMotion: false
      }, U.storageGet(SETTINGS_KEY, {}));
    }
    saveSettings() { U.storageSet(SETTINGS_KEY, this.settings); }
    syncSettingsUI() {
      this.el.volMaster.value = this.settings.master; this.el.volMasterVal.textContent = this.settings.master;
      this.el.volMusic.value = this.settings.music; this.el.volMusicVal.textContent = this.settings.music;
      this.el.volSfx.value = this.settings.sfx; this.el.volSfxVal.textContent = this.settings.sfx;
      this.el.volVoice.value = this.settings.voice; this.el.volVoiceVal.textContent = this.settings.voice;
      this.el.toggleShake.checked = !!this.settings.shake;
      this.el.toggleMotion.checked = !!this.settings.reducedMotion;
    }
    applyVolumes() {
      this.audio.setVolumes({
        master: this.settings.master / 100,
        music: this.settings.music / 100,
        sfx: this.settings.sfx / 100,
        voice: this.settings.voice / 100
      });
    }

    /* ================= 循环 ================= */
    loop(now) {
      let dt = (now - this.last) / 1000;
      if (!isFinite(dt) || dt <= 0) dt = .016;
      dt = Math.min(dt, .05);
      this.last = now;
      this.time += dt;
      this.input.update();

      if (['playing', 'dialogue', 'dying', 'victory'].includes(this.state)) this.playTime += dt;

      try {
        if (this.state === 'playing') {
          if (this.input.justPressed('pause')) this.togglePause(true);
          else this.updateWorld(dt);
        } else if (this.state === 'paused') {
          if (this.input.justPressed('pause')) this.resumeGame();
        } else if (this.state === 'dialogue') {
          this.updateDialogue(dt);
        } else if (this.state === 'intro' || this.state === 'ending') {
          this.updateCinematic(dt);
        } else if (this.state === 'dying') {
          this.updateDying(dt);
        } else if (this.state === 'victory') {
          this.updateVictory(dt);
        } else if (this.state === 'title') {
          if (this.input.justPressed('confirm-key') && this.el.help.classList.contains('hidden') && this.el.settings.classList.contains('hidden')) {
            this.startNewGame();
          }
        }

        this.updateEffects(dt);
        this.updateHUD();
        this.audio.update();
        this.render();
      } catch (err) {
        console.error('梦境更新异常', err);
      }
      this.input.endFrame();
      requestAnimationFrame((t) => this.loop(t));
    }

    updateEffects(dt) {
      this.shakePower = Math.max(0, this.shakePower * Math.pow(.035, dt) - dt * .7);
      if (this.flash) { this.flash.life -= dt; if (this.flash.life <= 0) this.flash = null; }
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.hitstop > 0) this.hitstop = Math.max(0, this.hitstop - dt);
      if (this.ultFx) {
        this.ultFx.t += dt;
        if (!this.ultFx.active && this.player) {
          this.ultFx.x = this.player.x; this.ultFx.y = this.player.y - 100;
        }
        if (this.ultFx.t > 2.2) this.ultFx = null;
      }
    }

    addShake(v) {
      if (!this.settings.shake) return;
      this.shakePower = Math.min(30, this.shakePower + v);
    }
    flashScreen(color, dur) {
      this.flash = { color, life: dur, max: dur };
    }

    /* ================= 标题 / 开关 ================= */
    showTitle() {
      this.state = 'title';
      this.level = null;
      this.el.title.classList.remove('hidden');
      this.el.hud.classList.add('hidden');
      this.el.bossBar.classList.add('hidden');
      this.el.dialogue.classList.add('hidden');
      this.el.cinematic.classList.add('hidden');
      this.el.pause.classList.add('hidden');
      this.el.help.classList.add('hidden');
      this.el.settings.classList.add('hidden');
      this.el.upgrade.classList.add('hidden');
      this.el.death.classList.add('hidden');
      this.el.victoryStamp.classList.add('hidden');
      this.el.ending.classList.add('hidden');
      this.el.chapterCard.classList.remove('show');
      this.el.tutorial.innerHTML = '';
      this.el.bark.classList.remove('show');
      this.el.toast.classList.remove('show');
      clearTimeout(this.toastTimer);
      clearTimeout(this.barkTimer);
      this.clearTipTimers();
      this.el.touch.classList.add('hidden');
      this.el.combo.classList.remove('active');
      this.el.bossBar.classList.add('hidden');
      const save = this.readSave();
      this.el.continueBtn.hidden = !save || save.completed;
      this.audio.stopVoice();
      if (this.audioReady) this.audio.startMusic('title');
    }

    startNewGame() {
      this.ensureAudio();
      this.audio.stopVoice();
      this.clearTipTimers();
      this.chapter = 0;
      this.cleared = 0;
      this.upgrades = [];
      this.completed = false;
      this.deaths = 0;
      this.playTime = 0;
      this.stats = { enemies: 0, perfect: 0, maxCombo: 0, damage: 0 };
      this.tipsShown = false;
      this.level = null;
      this.boss = null;
      this.bossTarget = null;
      this.dialogueActive = false;
      U.storageDel(SAVE_KEY);
      this.el.title.classList.add('hidden');
      this.el.ending.classList.add('hidden');
      this.el.death.classList.add('hidden');
      this.el.upgrade.classList.add('hidden');
      this.el.pause.classList.add('hidden');
      this.el.help.classList.add('hidden');
      this.el.settings.classList.add('hidden');
      this.el.dialogue.classList.add('hidden');
      this.el.victoryStamp.classList.add('hidden');
      this.el.bossBar.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.tutorial.innerHTML = '';
      this.startIntro();
    }

    startIntro() {
      this.state = 'intro';
      this.cinemaMode = 'intro';
      this.cinemaScenes = STORY.intro;
      this.cinemaIndex = 0;
      this.cinemaSceneT = 0;
      this.level = null;
      this.el.cinematic.classList.remove('hidden');
      this.el.cinemaSkip.innerHTML = '跳过序幕 <kbd>Esc</kbd>';
      this.el.hud.classList.add('hidden');
      this.el.touch.classList.add('hidden');
      this.audio.startMusic('intro');
      this.showCinemaScene();
    }

    continueGame() {
      this.ensureAudio();
      const save = this.readSave();
      if (!save || save.completed) { this.startNewGame(); return; }
      this.chapter = U.clamp(save.chapter || 0, 0, LEVELS.length - 1);
      this.cleared = save.cleared || 0;
      this.upgrades = Array.isArray(save.upgrades) ? save.upgrades : [];
      this.playTime = save.playTime || 0;
      this.deaths = save.deaths || 0;
      this.stats = Object.assign({ enemies: 0, perfect: 0, maxCombo: 0, damage: 0 }, save.stats || {});
      this.completed = false;
      this.tipsShown = true;
      this.el.title.classList.add('hidden');
      this.startChapter(this.chapter, this.cleared, { resume: true, noIntroDialogue: this.cleared > 0 });
    }

    returnToTitle() {
      this.audio.stopVoice();
      this.el.title.classList.remove('hidden');
      this.showTitle();
      this.input.reset();
    }

    /* ================= 存档 ================= */
    readSave() {
      const s = U.storageGet(SAVE_KEY, null);
      if (!s || typeof s !== 'object') return null;
      return s;
    }
    saveGame(completed) {
      if (!this.level) return;
      const save = {
        v: 1,
        chapter: this.chapter,
        cleared: this.cleared,
        upgrades: this.upgrades.slice(),
        playTime: this.playTime,
        deaths: this.deaths,
        stats: this.stats,
        completed: completed === undefined ? this.completed : completed,
        time: Date.now()
      };
      U.storageSet(SAVE_KEY, save);
      this.el.continueBtn.hidden = save.completed;
    }

    /* ================= 章节 ================= */
    computeMods() {
      const m = {
        damage: 1, skillDamage: 1, dashCd: 1, perfectWindow: 1,
        maxHp: 0, flasks: 0, skillCd: 1, qiRegen: 0,
        lowHp: 1, moveSpeed: 1, dashDist: 1
      };
      for (const id of this.upgrades) {
        switch (id) {
          case 'tide': m.damage *= 1.15; break;
          case 'mirror': m.perfectWindow *= 1.35; m.dashCd *= .9; break;
          case 'whale': m.maxHp += 30; break;
          case 'dew': m.flasks += 1; break;
          case 'stream': m.skillDamage *= 1.3; m.skillCd *= .85; break;
          case 'night': m.qiRegen += 2; break;
          case 'resolve': m.lowHp = 1.3; break;
          case 'gale': m.moveSpeed *= 1.12; m.dashDist *= 1.2; break;
        }
      }
      return m;
    }

    startChapter(chapterIndex, cleared, opts) {
      opts = opts || {};
      this.chapter = U.clamp(chapterIndex, 0, LEVELS.length - 1);
      this.level = LEVELS[this.chapter];
      this.worldWidth = this.level.width;
      this.stageIndex = this.chapter;
      this.damageScale = 1.0;
      this.cleared = U.clamp(cleared || 0, 0, this.level.encounters ? this.level.encounters.length : 0);
      this.encounterIndex = this.cleared;
      this.mods = this.computeMods();
      this.enemies = [];
      this.projectiles = [];
      this.hazards = [];
      this.particles = [];
      this.texts = [];
      this.boss = null;
      this.bossTarget = null;
      this.encounterActive = false;
      this.currentEncounter = null;
      this.encounterWaves = [];
      this.waveIndex = 0;
      this.waveTimer = 0;
      this.pendingClear = null;
      this.pendingStartDialogue = this.cleared === 0 && !opts.noIntroDialogue;
      this.chapterIntroDone = false;
      this.chapterIntroTimer = opts.retry ? 1.4 : 2.6;
      this.arenaLock = false;
      this.bounds = { left: 0, right: this.level.width };
      this.combo = 0; this.comboTimer = 0;
      this.shakePower = 0; this.hitstop = 0; this.slowTimer = 0;
      this.flash = null; this.ultFx = null;
      this.deathTimer = 0; this.victoryTimer = 0; this.victoryStampShown = false;
      this.audio.stopVoice();
      this.clearTipTimers();

      let startX = this.level.startX;
      if (this.cleared > 0 && this.level.encounters && this.level.encounters[this.cleared - 1]) {
        startX = Math.min(this.level.width - 450, this.level.encounters[this.cleared - 1].arena[1] + 250);
      }
      this.player = new Player(this, startX, GROUND);
      this.camera.x = U.clamp(startX, 960, Math.max(960, this.level.width - 960));
      this.camera.y = 0;

      this.el.title.classList.add('hidden');
      this.el.pause.classList.add('hidden');
      this.el.help.classList.add('hidden');
      this.el.settings.classList.add('hidden');
      this.el.upgrade.classList.add('hidden');
      this.el.death.classList.add('hidden');
      this.el.victoryStamp.classList.add('hidden');
      this.el.ending.classList.add('hidden');
      this.el.dialogue.classList.add('hidden');
      this.el.cinematic.classList.add('hidden');
      this.el.hud.classList.remove('hidden');
      if (U.isTouch()) this.el.touch.classList.remove('hidden');
      this.el.bossBar.classList.add('hidden');
      this.el.chapterCardNum.textContent = this.level.num;
      this.el.chapterCardName.textContent = this.level.name;
      this.el.chapterCardSub.textContent = this.level.subtitle;
      this.el.chapterCard.classList.add('show');
      this.el.stageLabel.textContent = `${this.level.num} · ${this.level.name}`;
      this.el.hudChapter.textContent = this.level.num;
      this.objective = this.level.objective;
      this.state = 'playing';
      this.input.reset();
      this.audio.startMusic(this.level.theme === 'boss' ? 'boss' : this.level.theme);
      this.audio.setIntensity(this.level.bossFight ? .38 : .22);
      this.saveGame(false);
      this.updatePortrait();
      if (opts.resume && this.cleared > 0) this.showToast('心灯重燃 · 从上次破障处继续', 'gold');
      else if (opts.retry) this.showToast('风会等，雪也会等', '');
    }

    beginChapterContent() {
      this.el.chapterCard.classList.remove('show');
      if (this.level.encounters && this.cleared >= this.level.encounters.length) {
        this.openUpgrade();
        return;
      }
      this.audio.sfx('checkpoint');
      if (this.pendingStartDialogue) {
        const lines = STORY.chapters[this.chapter].startDialogue || [];
        this.showDialogue(lines, () => {
          if (this.chapter === 0 && this.cleared === 0) this.startTutorial();
          this.showToast(this.level.objective, '');
        });
      } else {
        if (this.chapter === 0 && this.cleared === 0) this.startTutorial();
        this.showToast(this.objective, '');
      }
    }

    /* ================= 更新：世界 ================= */
    updateWorld(dt) {
      if (!this.level || !this.player) return;
      if (!this.chapterIntroDone) {
        this.chapterIntroTimer -= dt;
        this.updateParticles(dt);
        this.updateCamera(dt);
        if (this.chapterIntroTimer <= 0) {
          this.chapterIntroDone = true;
          this.beginChapterContent();
        }
        return;
      }

      this.worldTime = (this.worldTime || 0) + dt;
      const slow = this.slowTimer > 0 ? .34 : 1;
      const stop = this.hitstop > 0 ? .08 : 1;
      const worldDt = dt * slow * stop;
      const playerDt = dt * (this.hitstop > 0 ? .4 : 1);

      this.player.update(playerDt, this);
      if (this.state !== 'playing') return;

      if (this.boss) {
        this.boss.update(worldDt, this);
        if (this.state !== 'playing') return;
      }
      for (const e of this.enemies) e.update(worldDt, this);
      if (this.state !== 'playing') return;
      this.enemies = this.enemies.filter(e => !e.dead || e.deathT < 1.4);
      for (const p of this.projectiles) p.update(worldDt, this);
      this.projectiles = this.projectiles.filter(p => !p.dead);
      for (const h of this.hazards) h.update(worldDt, this);
      this.hazards = this.hazards.filter(h => !h.dead);
      this.updateParticles(dt);
      this.updateCamera(dt);

      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.combo = 0;
      }
      if (this.pendingClear) {
        this.pendingClear.timer -= dt;
        if (this.pendingClear.timer <= 0) {
          const p = this.pendingClear;
          this.pendingClear = null;
          if (p.lines && p.lines.length) {
            this.showDialogue(p.lines, p.onDone);
          } else if (p.onDone) p.onDone();
        }
      }

      if (this.state !== 'playing') return;
      this.checkTriggers();
      this.checkEncounterClear(dt);
    }

    updateParticles(dt) {
      for (const p of this.particles) p.update(dt * (this.slowTimer > 0 ? .6 : 1));
      this.particles = this.particles.filter(p => !p.dead);
      for (const t of this.texts) t.update(dt);
      this.texts = this.texts.filter(t => !t.dead);
    }

    updateCamera(dt) {
      if (!this.player) return;
      let target = this.player.x + this.player.facing * 80;
      if (this.boss && !this.boss.dead) target = this.player.x * .58 + this.boss.x * .42;
      else if (this.bossTarget && !this.bossTarget.dead) target = this.player.x * .8 + this.bossTarget.x * .2;
      let minC = 960, maxC = Math.max(960, (this.level ? this.level.width : 1920) - 960);
      if (this.arenaLock && this.level) {
        let L, R;
        if (this.boss) { L = this.level.bossArena[0]; R = this.level.bossArena[1]; }
        else if (this.currentEncounter) { L = this.currentEncounter.arena[0]; R = this.currentEncounter.arena[1]; }
        if (L !== undefined) {
          if (R - L < 1920) { minC = maxC = (L + R) / 2; }
          else { minC = L + 960; maxC = R - 960; }
        }
      }
      target = U.clamp(target, minC, maxC);
      this.camera.x = U.damp(this.camera.x, target, 4.2, dt);
      this.camera.x = U.clamp(this.camera.x, minC, maxC);
      this.camera.y = 0;
    }

    checkTriggers() {
      if (!this.level || !this.player) return;
      if (this.level.bossFight) {
        if (!this.boss && this.player.x > this.level.bossTriggerX) this.startBossFight();
        return;
      }
      const encs = this.level.encounters;
      if (!encs || this.encounterIndex >= encs.length || this.encounterActive || this.pendingClear) return;
      const enc = encs[this.encounterIndex];
      if (this.player.x > enc.triggerX) this.startEncounter(enc);
    }

    startEncounter(enc) {
      this.currentEncounter = enc;
      this.encounterActive = true;
      this.encounterWaves = [enc.spawns].concat(enc.waves || []);
      this.waveIndex = 0;
      this.waveTimer = 0;
      this.arenaLock = true;
      this.bounds = { left: enc.arena[0], right: enc.arena[1] };
      this.objective = enc.label;
      this.el.objective.textContent = enc.label;
      this.audio.sfx('warn');
      this.showToast(enc.label, enc.elite ? 'red' : '');
      if (enc.barks) {
        for (const b of enc.barks) this.bark(b[0], b[1], b[2]);
      }
      this.spawnWave(enc.spawns, enc);
      const center = (enc.arena[0] + enc.arena[1]) / 2;
      this.camera.x = U.clamp((this.player.x + center) / 2, Math.min(960, enc.arena[0]), Math.max(960, enc.arena[1] - 960));
      this.addShake(5);
    }

    spawnWave(spawns, enc) {
      enc = enc || this.currentEncounter;
      for (let i = 0; i < spawns.length; i++) {
        const sp = spawns[i];
        const x = U.clamp(enc.triggerX + sp.dx, enc.arena[0] + 60, enc.arena[1] - 60);
        const opts = {
          hpScale: (enc.hpScale || 1) * (sp.hpScale || 1),
          dmgScale: enc.dmgScale || 1,
          variant: sp.variant,
          name: sp.name,
          y: GROUND
        };
        const e = new Enemy(this, sp.type, x, opts);
        if (sp.type === 'elite') {
          e.state = 'spawn';
          e.stateT = 0;
          this.bossTarget = e;
          this.showBossBar(e);
          e.maxHp = e.hp;
          this.el.bossName.textContent = e.name;
          this.el.bossTitle.textContent = '心障';
          this.el.bossPhase.textContent = '执念';
        }
        this.enemies.push(e);
        for (let k = 0; k < 14; k++) {
          this.spawnParticle(x + U.rand(-30, 30), GROUND - U.rand(0, 150), U.rand(-80, 80), -U.rand(40, 180), U.rand(.4, .9), U.rand(2, 4), enc.elite ? '#ffb27a' : '#8deaf5', 100, true);
        }
      }
    }

    checkEncounterClear(dt) {
      if (!this.encounterActive || !this.currentEncounter) return;
      const enc = this.currentEncounter;
      if (this.waveTimer > 0) {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
          this.enemies = this.enemies.filter(e => !e.dead);
          this.spawnWave(this.encounterWaves[this.waveIndex], enc);
          this.showToast('余念又起 · 心障未散', 'red');
          this.audio.sfx('warn');
          this.addShake(5);
        }
        return;
      }
      if (!this.enemies.length) return;
      if (!this.enemies.every(e => e.dead)) return;
      if (this.waveIndex < this.encounterWaves.length - 1) {
        this.waveIndex++;
        this.waveTimer = 1.15;
        this.showToast('余念又起 · 心障未散', 'red');
        this.audio.sfx('warn');
        return;
      }
      this.encounterActive = false;
      this.arenaLock = false;
      this.bounds = { left: 0, right: this.level.width };
      this.cleared++;
      this.encounterIndex = this.cleared;
      this.currentEncounter = null;
      this.encounterWaves = [];
      this.waveIndex = 0;
      this.waveTimer = 0;
      this.bossTarget = null;
      this.el.bossBar.classList.add('hidden');
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .16);
      this.player.flasks = Math.min(this.player.maxFlasks, this.player.flasks + 1);
      this.addShake(6);
      this.audio.sfx('checkpoint');
      this.saveGame(false);
      this.showToast('心障已破 · 心灯续了一寸', 'gold');
      this.objective = this.cleared >= this.level.encounters.length ? '向山顶去' : '向山中去';
      this.el.objective.textContent = this.objective;
      const last = this.cleared >= this.level.encounters.length;
      this.pendingClear = {
        timer: last ? 1.6 : 1.0,
        lines: last ? (STORY.chapters[this.chapter].afterDialogue || []) : (enc.clearDialogue || []),
        onDone: last ? () => this.openUpgrade() : null
      };
    }

    startBossFight() {
      if (!this.level || !this.level.bossFight) return;
      this.arenaLock = true;
      this.bounds = { left: this.level.bossArena[0], right: this.level.bossArena[1] };
      this.boss = new Boss(this, this.level.bossX);
      this.boss.maxHp *= this.level.bossHpScale || 1;
      this.boss.hp = this.boss.maxHp;
      this.boss.state = 'intro';
      this.boss.invuln = 999;
      this.bossTarget = this.boss;
      this.showBossBar(this.boss);
      this.audio.setIntensity(.65);
      this.audio.sfx('gong');
      this.addShake(12);
      this.flashScreen('#ff5b4b', .25);
      this.camera.x = U.clamp((this.player.x + this.boss.x) / 2, 960, Math.max(960, this.level.width - 960));
      this.showDialogue(STORY.boss.intro, () => {
        if (!this.boss) return;
        this.boss.state = 'idle'; this.boss.stateT = 0; this.boss.invuln = 0; this.boss.attackCd = 1.2;
        this.audio.setIntensity(.75);
        this.bark('刘奥', '我认罪。但我不后悔。', 'boss');
        this.objective = '在长夜结束前，击败刘奥';
      });
    }

    triggerBossPhase(phase) {
      if (!this.boss || this.boss.dead) return;
      this.boss.phase = phase;
      this.boss.phaseTriggered = phase === 2 ? 2 : 3;
      this.boss.state = 'transition';
      this.boss.stateT = 0;
      this.boss.invuln = 999;
      this.boss.pattern = null;
      this.boss.pFlags = {};
      this.projectiles = [];
      this.hazards = [];
      this.slowTimer = .65;
      this.flashScreen(phase === 2 ? '#ff6d51' : '#ffd7a1', .32);
      this.addShake(18);
      this.audio.sfx('gong');
      this.audio.setIntensity(phase === 2 ? .88 : 1);
      const lines = phase === 2 ? STORY.boss.phase2 : STORY.boss.phase3;
      this.showDialogue(lines, () => {
        if (!this.boss) return;
        this.boss.state = 'idle'; this.boss.stateT = 0;
        this.boss.invuln = .9; this.boss.attackCd = 1.1;
      });
    }

    /* ================= 战斗反馈 ================= */
    spawnParticle(x, y, vx, vy, life, size, color, gravity, additive) {
      if (this.particles.length > 780) return;
      this.particles.push(new Particle(x, y, vx, vy, life, size, color, gravity, additive));
    }
    spawnBurst(x, y, color, count, speed, opts) {
      opts = opts || {};
      const n = this.settings.reducedMotion ? Math.ceil(count * .55) : count;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const sp = U.rand(speed * .18, speed);
        this.spawnParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - (opts.up || 0), U.rand((opts.life || .5) * .5, opts.life || .5), U.rand(1, opts.size || 3), color, opts.gravity === undefined ? 300 : opts.gravity, opts.additive !== false);
      }
    }
    addText(x, y, text, color, size, opts) {
      this.texts.push(new FloatingText(x, y, text, color, size, opts));
    }
    onPlayerDealtDamage(target, damage, source, heavy) {
      this.combo++;
      this.comboTimer = 2.7;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
      this.maxCombo = Math.max(this.maxCombo || 0, this.combo);
      this.stats.damage += damage;
      this.hitstop = Math.max(this.hitstop, heavy ? .055 : .026);
      this.addShake(heavy ? 5.5 : 2.8);
      this.audio.sfx(heavy ? 'slashHeavy' : 'hit');
      const tx = target.x || source.x;
      const ty = (target.y || GROUND) - (target.isElite || target.phase ? 220 : 110);
      this.addText(tx + U.rand(-16, 16), ty, Math.round(damage), heavy ? '#ffe4aa' : '#c5fbff', heavy ? 28 : 21, { bold: true });
      this.player.addFocus(target.phase ? 1.45 : target.isElite ? 2.2 : 3.2);
      this.spawnBurst(tx, ty + 60, heavy ? '#ffe0a4' : '#9df4ff', heavy ? 16 : 8, heavy ? 300 : 210, { size: 2.6, life: .4, gravity: 340 });
    }
    onPlayerHurt(dmg, sourceName) {
      this.combo = 0; this.comboTimer = 0;
      this.addShake(11);
      this.flashScreen('#d94e46', .2);
      this.audio.sfx('hurt');
      this.spawnBurst(this.player.x, this.player.y - 100, '#ff8d83', 13, 240, { size: 3, life: .45, gravity: 300 });
      this.showToast(`受到 ${dmg} 点伤害`, 'red');
    }
    onPerfectDodge(player, sourceX) {
      this.stats.perfect++;
      this.slowTimer = .9;
      this.flashScreen('#8cefff', .16);
      this.addShake(5);
      this.audio.sfx('perfect');
      this.addText(player.x, player.y - 235, '完美闪身', '#9bf7ff', 26, { bold: true, life: 1.1 });
      this.spawnBurst(player.x, player.y - 100, '#aef8ff', 22, 280, { size: 2.8, life: .6, gravity: 0, additive: true });
    }
    onEnemyKilled(enemy) {
      this.stats.enemies++;
      if (enemy.isElite) {
        this.addShake(15);
        this.audio.setIntensity(.45);
        this.flashScreen('#ffd39d', .25);
      }
    }
    onEliteKilled(enemy) {
      this.bossTarget = null;
      this.el.bossBar.classList.add('hidden');
      this.player.flasks = Math.min(this.player.maxFlasks, this.player.flasks + 1);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .12);
      this.showToast('心障消散 · 鲸露 +1', 'gold');
    }
    onPlayerDeath() {
      this.state = 'dying';
      this.deathTimer = 0;
      this.deaths++;
      this.slowTimer = 1.4;
      this.audio.stopMusic();
      this.audio.stopVoice();
      this.el.bossBar.classList.add('hidden');
      this.el.dialogue.classList.add('hidden');
      this.el.bark.classList.remove('show');
      this.el.toast.classList.remove('show');
      this.el.tutorial.innerHTML = '';
      this.dialogueActive = false;
      this.saveGame(false);
    }
    onBossDefeated() {
      this.state = 'victory';
      this.victoryTimer = 0;
      this.victoryStampShown = false;
      this.slowTimer = 1.6;
      this.audio.stopVoice();
      this.audio.stopMusic();
      this.projectiles = [];
      this.hazards = [];
      this.boss.hurtFlash = 0;
      this.player.state = 'victory';
      this.player.stateT = 0;
      this.player.invuln = 999;
      this.player.vx = 0;
      this.bossTarget = null;
      this.el.bossBar.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.bark.classList.remove('show');
      this.el.tutorial.innerHTML = '';
      this.el.toast.classList.remove('show');
      this.flashScreen('#f6f2df', .5);
      this.addShake(24);
      this.stats.enemies++;
      this.completed = true;
      this.saveGame(true);
      this.spawnBurst(this.boss.x, this.boss.y - 180, '#ffd9a4', 70, 420, { size: 4, life: 1.4, gravity: 200, additive: true });
    }

    /* ================= 死亡 / 胜利 ================= */
    updateDying(dt) {
      this.deathTimer += dt;
      this.boss && this.boss.dead && (this.boss.deathT += dt);
      for (const e of this.enemies) if (e.dead) e.deathT += dt;
      this.updateParticles(dt);
      this.updateCamera(dt);
      if (this.deathTimer > 1.05) {
        this.state = 'dead';
        this.el.hud.classList.add('hidden');
        this.el.touch.classList.add('hidden');
        this.el.death.classList.remove('hidden');
        this.audio.speak('菜！', 'player');
        const lines = window.LOSE_LINES || ['菜就多练。'];
        const copy = this.el.death.querySelector('.death-copy > p:not(.panel-eyebrow)');
        if (copy) copy.textContent = U.choice(lines) + ' 菜就多练，风会等，雪也会等。';
      }
    }

    updateVictory(dt) {
      this.victoryTimer += dt;
      if (this.boss) this.boss.deathT += dt;
      this.updateParticles(dt);
      this.updateCamera(dt);
      if (!this.victoryStampShown && this.victoryTimer > 1.0) {
        this.victoryStampShown = true;
        this.el.victoryStamp.classList.remove('hidden');
        this.audio.sfx('victory');
        this.audio.speak('刘奥，OUT！', 'player');
        this.spawnBurst(this.boss ? this.boss.x : this.player.x, 580, '#ffcf91', 60, 360, { size: 4, life: 1.4, gravity: 100, additive: true });
      }
      if (this.victoryTimer > 4.5) this.startEnding();
    }

    retryStage() {
      this.el.death.classList.add('hidden');
      this.state = 'playing';
      this.startChapter(this.chapter, this.cleared, { retry: true, noIntroDialogue: true });
    }

    /* ================= 对话 ================= */
    showDialogue(lines, onComplete) {
      if (!lines || !lines.length) { if (onComplete) onComplete(); return; }
      this.dialogueReturn = this.state === 'dialogue' ? this.dialogueReturn : this.state;
      this.state = 'dialogue';
      this.dialogueActive = true;
      this.dialogueQueue = lines.slice();
      this.dialogueIndex = 0;
      this.dialogueOnComplete = onComplete || null;
      this.dialogueAdvanceRequested = false;
      this.el.dialogue.classList.remove('hidden');
      this.el.bark.classList.remove('show');
      this.displayDialogueLine();
    }

    displayDialogueLine() {
      const line = this.dialogueQueue[this.dialogueIndex];
      if (!line) { this.finishDialogue(); return; }
      const who = line.who || 'narrator';
      this.el.dialogueName.textContent = line.name || DIALOGUE_NAMES[who] || '旁白';
      this.dialogueFull = line.text || '';
      this.el.dialogueText.textContent = '';
      this.dialogueChars = 0;
      this.dialogueTyping = true;
      this.dialogueAdvanceRequested = false;
      Art.drawPortrait(this.el.dialoguePortrait, who === 'narrator' || who === 'echo' ? 'narrator' : who);
      if (line.voice && who !== 'narrator') {
        this.audio.speak(line.text, who);
      }
    }

    updateDialogue(dt) {
      const line = this.dialogueQueue[this.dialogueIndex];
      if (!line) { this.finishDialogue(); return; }
      if (this.dialogueTyping) {
        this.dialogueChars = Math.min(this.dialogueFull.length, this.dialogueChars + dt * 42);
        this.el.dialogueText.textContent = this.dialogueFull.slice(0, Math.floor(this.dialogueChars));
        if (this.dialogueChars >= this.dialogueFull.length) {
          this.dialogueTyping = false;
          this.el.dialogueText.textContent = this.dialogueFull;
        }
      }
      if (this.dialogueAdvanceRequested || this.input.justPressed('confirm') || this.input.justPressed('confirm-key')) {
        this.dialogueAdvanceRequested = false;
        if (this.dialogueTyping) {
          this.dialogueTyping = false;
          this.el.dialogueText.textContent = this.dialogueFull;
        } else {
          this.dialogueIndex++;
          if (this.dialogueIndex >= this.dialogueQueue.length) this.finishDialogue();
          else {
            this.audio.sfx('ui');
            this.displayDialogueLine();
          }
        }
      }
    }

    finishDialogue() {
      this.dialogueActive = false;
      this.el.dialogue.classList.add('hidden');
      const cb = this.dialogueOnComplete;
      this.dialogueOnComplete = null;
      const ret = this.dialogueReturn;
      this.state = ret || 'playing';
      if (ret !== 'dialogue') this.dialogueReturn = 'playing';
      if (cb) cb();
    }

    showToast(text, type) {
      if (!text) return;
      this.el.toast.textContent = text;
      this.el.toast.className = 'toast show' + (type ? ' ' + type : '');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => { this.el.toast.classList.remove('show'); }, 2600);
    }

    bark(speaker, text, who) {
      const el = this.el.bark;
      el.innerHTML = '';
      const b = document.createElement('b'); b.textContent = speaker; el.appendChild(b);
      const span = document.createElement('span'); span.textContent = text; el.appendChild(span);
      el.classList.add('show');
      clearTimeout(this.barkTimer);
      this.barkTimer = setTimeout(() => el.classList.remove('show'), 3600);
      if (who) this.audio.speak(text, who);
    }

    startTutorial() {
      if (this.tipsShown || !this.level || !this.level.tips) return;
      this.tipsShown = true;
      let delay = 800;
      for (const tip of this.level.tips) {
        const t1 = setTimeout(() => {
          if (!this.level) return;
          const chip = document.createElement('div');
          chip.className = 'tip-chip';
          const k = document.createElement('kbd'); k.textContent = tip.key; chip.appendChild(k);
          const em = document.createElement('em'); em.textContent = tip.text; chip.appendChild(em);
          this.el.tutorial.appendChild(chip);
          while (this.el.tutorial.children.length > 4) this.el.tutorial.removeChild(this.el.tutorial.firstChild);
          const t2 = setTimeout(() => {
            chip.style.opacity = '0';
            chip.style.transition = 'opacity .5s ease';
            const t3 = setTimeout(() => chip.remove(), 520);
            this.tipTimers.push(t3);
          }, tip.dur * 1000);
          this.tipTimers.push(t2);
        }, delay);
        this.tipTimers.push(t1);
        delay += 1900;
      }
    }
    clearTipTimers() {
      for (const t of this.tipTimers) clearTimeout(t);
      this.tipTimers = [];
      this.el.tutorial.innerHTML = '';
    }

    /* ================= 心诀 ================= */
    openUpgrade() {
      if (this.chapter >= LEVELS.length - 1) return;
      this.state = 'upgrade';
      this.audio.stopVoice();
      this.audio.sfx('checkpoint');
      this.el.hud.classList.add('hidden');
      this.el.bossBar.classList.add('hidden');
      this.el.dialogue.classList.add('hidden');
      const available = STORY.upgrades.filter(u => !this.upgrades.includes(u.id));
      const picks = U.shuffle(available).slice(0, Math.min(3, available.length));
      this.el.upgradeCards.innerHTML = '';
      picks.forEach(u => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-card';
        btn.dataset.upgrade = u.id;
        btn.innerHTML = `<div class="seal">${u.seal}</div><span class="kind">${u.kind}</span><h3>${u.name}</h3><p>${u.desc}</p><span class="pick">参悟此诀 →</span>`;
        this.el.upgradeCards.appendChild(btn);
      });
      this.el.upgrade.classList.remove('hidden');
      if (this.audioReady) this.audio.startMusic('title');
    }

    chooseUpgrade(id) {
      if (this.state !== 'upgrade') return;
      if (!this.upgrades.includes(id)) this.upgrades.push(id);
      this.audio.sfx('checkpoint');
      this.el.upgrade.classList.add('hidden');
      const next = this.chapter + 1;
      this.cleared = 0;
      this.startChapter(next, 0, {});
    }

    /* ================= 过场 ================= */
    spawnEnemy(type, x, opts) {
      const e = new Enemy(this, type, x, opts || {});
      this.enemies.push(e);
      return e;
    }

    onUltimateStart() {
      this.ultFx = { t: 0, active: false, x: this.player.x, y: this.player.y - 100 };
      this.slowTimer = Math.max(this.slowTimer, .35);
      this.flashScreen('#bff8ff', .12);
      this.addShake(7);
      this.spawnBurst(this.player.x, this.player.y - 90, '#9ff5ff', 28, 240, { size: 3.2, life: .8, gravity: 0, additive: true });
      this.addText(this.player.x, this.player.y - 250, '鲸落', '#bffaff', 36, { bold: true, life: 1.2 });
      this.audio.speak('鲸落。', 'player');
    }

    ultimateBurst(player) {
      if (!this.ultFx) this.ultFx = { t: 0, active: false, x: player.x, y: player.y - 100 };
      this.ultFx.active = true;
      this.ultFx.t = Math.max(.82, this.ultFx.t);
      const dmg = 320 * this.mods.damage;
      for (const e of this.enemies.slice()) {
        if (e.dead) continue;
        e.takeDamage(dmg, { x: player.x, y: player.y }, this);
        this.addText(e.x, e.y - 130, Math.round(dmg), '#d9fdff', 27, { bold: true });
      }
      if (this.boss && !this.boss.dead) {
        this.boss.takeDamage(dmg, player, this);
        this.addText(this.boss.x, this.boss.y - 310, Math.round(dmg), '#ffe6b8', 34, { bold: true });
      }
      this.projectiles = this.projectiles.filter(p => p.owner === 'player');
      this.hazards = [];
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .24);
      this.flashScreen('#d8feff', .3);
      this.addShake(22);
      this.audio.sfx('bossDown');
      this.audio.sfx('wave');
      for (let i = 0; i < 60; i++) {
        const a = Math.random() * TAU;
        this.spawnParticle(player.x + Math.cos(a) * U.rand(30, 220), player.y - U.rand(20, 260), Math.cos(a) * U.rand(60, 340), Math.sin(a) * U.rand(60, 220) - 80, U.rand(.5, 1.3), U.rand(2, 5), '#a5f5ff', 40, true);
      }
      if (this.state === 'playing') this.bark('深寻', '这一剑，为所有被夺走的明天。', 'player');
    }

    startEnding() {
      this.state = 'ending';
      this.cinemaMode = 'ending';
      this.cinemaScenes = STORY.ending;
      this.cinemaIndex = 0;
      this.cinemaSceneT = 0;
      this.el.victoryStamp.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.touch.classList.add('hidden');
      this.el.cinematic.classList.remove('hidden');
      this.el.cinemaSkip.innerHTML = '跳至尾声 <kbd>Esc</kbd>';
      this.audio.stopVoice();
      this.audio.startMusic('ending');
      this.showCinemaScene();
    }

    showCinemaScene() {
      const scene = this.cinemaScenes[this.cinemaIndex];
      if (!scene) return;
      this.cinemaSceneT = 0;
      this.el.cinemaChapter.textContent = scene.chapter || (this.cinemaMode === 'ending' ? '尾声 · 雪停' : '');
      this.el.cinemaSpeaker.textContent = scene.speaker || '';
      this.el.cinemaText.textContent = scene.text || '';
      this.el.cinemaHint.textContent = '点击 / 空格 继续';
      if (scene.voice) this.audio.speak(scene.text, scene.voice);
    }

    updateCinematic(dt) {
      const scene = this.cinemaScenes[this.cinemaIndex];
      if (!scene) { this.finishCinematic(); return; }
      this.cinemaSceneT += dt;
      if (this.input.justPressed('pause')) { this.skipCinematic(); return; }
      if (this.input.justPressed('confirm') || this.input.justPressed('confirm-key')) { this.advanceCinematic(); return; }
      if (this.cinemaSceneT >= scene.duration) this.advanceCinematic();
    }

    advanceCinematic() {
      if (this.cinemaIndex >= this.cinemaScenes.length - 1) { this.finishCinematic(); return; }
      this.cinemaIndex++;
      this.audio.sfx('ui');
      this.showCinemaScene();
    }

    skipCinematic() {
      this.audio.sfx('uiBack');
      this.finishCinematic();
    }

    finishCinematic() {
      this.el.cinematic.classList.add('hidden');
      this.audio.stopVoice();
      if (this.cinemaMode === 'intro') {
        this.cinemaMode = null;
        this.startChapter(0, 0, {});
      } else {
        this.cinemaMode = null;
        this.showEndingScreen();
      }
    }

    showEndingScreen() {
      this.state = 'endingScreen';
      this.el.cinematic.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.victoryStamp.classList.add('hidden');
      this.el.ending.classList.remove('hidden');
      const time = U.formatTime(this.playTime);
      this.el.endingStats.innerHTML = `
        <div class="ending-stat"><b>${time}</b><span>梦境时刻</span></div>
        <div class="ending-stat"><b>${this.stats.enemies}</b><span>心障破除</span></div>
        <div class="ending-stat"><b>${this.stats.perfect}</b><span>完美闪身</span></div>
        <div class="ending-stat"><b>${this.stats.maxCombo}</b><span>最高连斩</span></div>
        <div class="ending-stat"><b>${this.deaths}</b><span>心灯重燃</span></div>`;
      this.completed = true;
      this.saveGame(true);
    }

    /* ================= 模态 ================= */
    openHelp() {
      this.modalReturn = this.state === 'paused' ? 'pause' : 'title';
      this.el.pause.classList.add('hidden');
      this.el.settings.classList.add('hidden');
      this.el.help.classList.remove('hidden');
      this.audio.sfx('ui');
    }
    closeHelp() {
      this.el.help.classList.add('hidden');
      if (this.modalReturn === 'pause') this.el.pause.classList.remove('hidden');
      this.modalReturn = null;
    }
    openSettings() {
      this.modalReturn = this.state === 'paused' ? 'pause' : 'title';
      this.el.pause.classList.add('hidden');
      this.el.help.classList.add('hidden');
      this.el.settings.classList.remove('hidden');
      this.syncSettingsUI();
    }
    closeSettings() {
      this.el.settings.classList.add('hidden');
      if (this.modalReturn === 'pause') this.el.pause.classList.remove('hidden');
      this.modalReturn = null;
      this.saveSettings();
    }
    togglePause(force) {
      if (this.state === 'playing' || (force && this.state === 'playing')) {
        this.state = 'paused';
        this.el.pause.classList.remove('hidden');
        this.audio.stopVoice();
        this.input.reset();
      } else if (this.state === 'paused' && !force) {
        this.resumeGame();
      }
    }
    resumeGame() {
      this.el.pause.classList.add('hidden');
      this.el.help.classList.add('hidden');
      this.el.settings.classList.add('hidden');
      this.state = 'playing';
      this.input.reset();
      this.audio.resume();
    }

    /* ================= HUD ================= */
    updatePortrait() {
      Art.drawPortrait(this.el.hudPortrait, 'shen');
    }

    showBossBar(target) {
      this.el.bossBar.classList.remove('hidden');
      if (target === this.boss) {
        this.el.bossName.textContent = '刘奥';
        this.el.bossTitle.textContent = '守心人';
        this.el.bossPhase.textContent = '一阶段';
      } else {
        this.el.bossName.textContent = target.name;
        this.el.bossTitle.textContent = '心障';
        this.el.bossPhase.textContent = '执念';
      }
    }

    updateHUD() {
      const inGame = this.level && ['playing', 'dialogue', 'paused'].includes(this.state);
      this.el.hud.classList.toggle('hidden', !inGame);
      if (!inGame) {
        if (U.isTouch()) this.el.touch.classList.add('hidden');
        return;
      }
      if (U.isTouch() && ['playing', 'dialogue'].includes(this.state)) this.el.touch.classList.remove('hidden');
      else this.el.touch.classList.add('hidden');

      const p = this.player;
      if (p) {
        const hpP = U.clamp(p.hp / p.maxHp, 0, 1);
        this.el.hpFill.style.width = (hpP * 100) + '%';
        this.el.hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
        this.el.qiFill.style.width = (U.clamp(p.qi / p.maxQi, 0, 1) * 100) + '%';
        this.el.flaskCount.textContent = p.flasks;
        this.el.focusText.textContent = Math.floor(p.focus) + '%';
        this.el.focusBadge.classList.toggle('ready', p.focus >= 100);
        this.el.hudChapter.textContent = this.level.num;
      }
      this.el.stageLabel.textContent = `${this.level.num} · ${this.level.name}`;
      this.el.timerText.textContent = U.formatTime(this.playTime);
      this.el.objective.textContent = this.objective || this.level.objective;

      const showCombo = this.combo >= 2 && this.comboTimer > 0;
      this.el.combo.classList.toggle('active', showCombo);
      if (showCombo) {
        this.el.comboNumber.textContent = this.combo;
        this.el.comboRank.textContent = this.combo >= 40 ? '天问' : this.combo >= 25 ? '断岳' : this.combo >= 14 ? '流风' : this.combo >= 7 ? '惊鸿' : '无痕';
      }

      const bt = this.bossTarget;
      if (bt && !bt.dead) {
        this.el.bossBar.classList.remove('hidden');
        this.el.bossFill.style.width = (U.clamp(bt.hp / bt.maxHp, 0, 1) * 100) + '%';
        if (bt === this.boss) {
          const ph = bt.phase || 1;
          this.el.bossPhase.textContent = ph === 1 ? '一阶段 · 守心' : ph === 2 ? '二阶段 · 焚心' : '三阶段 · 归心';
          this.el.bossName.textContent = '刘奥';
          this.el.bossTitle.textContent = '守心人';
        } else {
          this.el.bossName.textContent = bt.name;
          this.el.bossPhase.textContent = bt.hp < bt.maxHp * .4 ? '执念将散' : '心障';
          this.el.bossFill.style.width = (U.clamp(bt.hp / bt.maxHp, 0, 1) * 100) + '%';
        }
      } else if (!bt) {
        this.el.bossBar.classList.add('hidden');
      }
    }

    /* ================= 渲染 ================= */
    render() {
      const ctx = this.ctx;
      const s = this.renderScale * this.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#050a0e';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(s, 0, 0, s, this.offsetX * this.dpr, this.offsetY * this.dpr);
      ctx.imageSmoothingEnabled = true;

      if (this.state === 'title') {
        Art.drawTitleScene(ctx, this.time, this.settings.reducedMotion);
      } else if (this.state === 'intro' || this.state === 'ending') {
        this.renderCinematic(ctx);
      } else if (this.state === 'endingScreen') {
        Art.drawCinematic(ctx, 'sunrise', 8.4, 12, {});
        this.drawScreenVignette(ctx);
      } else if (this.level && this.player) {
        this.renderWorld(ctx);
      } else {
        Art.drawTitleScene(ctx, this.time, this.settings.reducedMotion);
      }
      if (this.flash) {
        const a = U.clamp(this.flash.life / this.flash.max, 0, 1) * .38;
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = this.flash.color; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
      }
    }

    renderCinematic(ctx) {
      const scene = this.cinemaScenes[this.cinemaIndex];
      if (!scene) { Art.drawCinematic(ctx, 'sunrise', this.time, 12, {}); this.drawScreenVignette(ctx); return; }
      Art.drawCinematic(ctx, scene.art, this.cinemaSceneT, scene.duration, {});
      // 场景切入淡黑
      const fadeOut = U.clamp((scene.duration - this.cinemaSceneT) / .75, 0, 1);
      const fadeIn = U.clamp(this.cinemaSceneT / .65, 0, 1);
      const a = Math.max(0, Math.min(1 - fadeIn, 1 - fadeOut)) * .9;
      if (a > 0) { ctx.fillStyle = `rgba(2,5,8,${a})`; ctx.fillRect(0, 0, 1920, 1080); }
      this.drawScreenVignette(ctx);
    }

    renderWorld(ctx) {
      const shakeX = Math.sin(this.time * 137) * this.shakePower;
      const shakeY = Math.cos(this.time * 113) * this.shakePower * .6;
      const camX = this.camera.x;
      Art.drawBackground(ctx, this.level.theme, this.time, camX + shakeX * .25, true);

      ctx.save();
      ctx.translate(960 - camX + shakeX, shakeY);
      Art.drawGround(ctx, this.level.theme, this.level.width, GROUND, this.time, camX);
      Art.drawScenery(ctx, this.level.theme, this.level.width, GROUND, this.time, camX);

      if (this.arenaLock) {
        Art.drawBarrier(ctx, this.bounds.left + 16, GROUND, 550, this.time, -1);
        Art.drawBarrier(ctx, this.bounds.right - 16, GROUND, 550, this.time, 1);
      }

      // 预警
      for (const h of this.hazards) h.draw(ctx, this.time);
      for (const e of this.enemies) e.drawTelegraph(ctx, this.time);
      if (this.boss) this.boss.drawTelegraph(ctx, this.time);

      // 角色
      const drawables = this.enemies.slice();
      if (this.boss) drawables.push(this.boss);
      drawables.sort((a, b) => (a.y || 0) - (b.y || 0));
      for (const d of drawables) d.draw(ctx, this.time);
      this.player.draw(ctx, this.time);

      for (const p of this.projectiles) p.draw(ctx, this.time);
      for (const p of this.particles) p.draw(ctx);
      for (const t of this.texts) t.draw(ctx);
      ctx.restore();

      this.renderWeather(ctx, camX, shakeX);
      this.drawScreenVignette(ctx);
      this.drawDirectionHint(ctx, camX);
      this.renderUltimateFx(ctx);
      if (this.player.hp / this.player.maxHp < .3 && !this.player.dead) {
        const a = .12 + Math.sin(this.time * 4) * .05;
        const g = ctx.createRadialGradient(960, 540, 320, 960, 540, 1080);
        g.addColorStop(0, 'rgba(120,10,12,0)'); g.addColorStop(1, `rgba(120,10,12,${a})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
      }
      if (this.slowTimer > 0) {
        ctx.fillStyle = 'rgba(98,226,246,.035)'; ctx.fillRect(0, 0, 1920, 1080);
      }
      this.drawChapterMarker(ctx);
    }

    drawScreenVignette(ctx) {
      const v = ctx.createRadialGradient(960, 520, 420, 960, 540, 1220);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.65, 'rgba(0,0,0,.10)'); v.addColorStop(1, 'rgba(0,0,0,.62)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, 1920, 1080);
    }

    renderWeather(ctx, camX, shakeX) {
      const reduced = this.settings.reducedMotion;
      const theme = this.level.theme;
      const t = this.time;
      if (theme === 'snow' || theme === 'title') {
        const n = reduced ? 55 : 135;
        ctx.save();
        for (let i = 0; i < n; i++) {
          const h1 = U.hash(i * 3.7), h2 = U.hash(i * 8.9), h3 = U.hash(i * 2.3);
          const x = ((h1 * 2200 + t * (14 + h2 * 26) - camX * .08 + shakeX) % 2200 + 2200) % 2200 - 140;
          const y = (h2 * 1140 + t * (20 + h3 * 42)) % 1140;
          const r = .7 + h3 * 2.2;
          ctx.fillStyle = `rgba(227,244,246,${.05 + h1 * .22})`;
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          ctx.strokeStyle = `rgba(227,244,246,${.02 + h1 * .08})`;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 9, y - 4); ctx.stroke();
        }
        ctx.restore();
      } else if (theme === 'bamboo') {
        const n = reduced ? 65 : 155;
        ctx.save();
        for (let i = 0; i < n; i++) {
          const h1 = U.hash(i * 4.3), h2 = U.hash(i * 7.2), h3 = U.hash(i * 2.8);
          const x = ((h1 * 2200 + t * (60 + h2 * 80) - camX * .16 + shakeX) % 2200 + 2200) % 2200 - 140;
          const y = (h2 * 1160 + t * (520 + h3 * 220)) % 1160;
          ctx.strokeStyle = `rgba(168,220,220,${.035 + h1 * .10})`;
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 13, y + 30); ctx.stroke();
        }
        ctx.restore();
      } else {
        const n = reduced ? 55 : 120;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const h1 = U.hash(i * 5.7), h2 = U.hash(i * 3.1), h3 = U.hash(i * 9.2);
          const x = ((h1 * 2100 + Math.sin(t * .5 + i) * 45 - camX * .1) % 2100 + 2100) % 2100;
          const y = 1050 - ((h2 * 930 + t * (28 + h3 * 55)) % 960);
          ctx.fillStyle = theme === 'boss' ? `rgba(255,${90 + h3 * 70},60,${.05 + h1 * .26})` : `rgba(255,${140 + h3 * 60},75,${.04 + h1 * .24})`;
          ctx.beginPath(); ctx.arc(x, y, .7 + h3 * 2, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      // 上方暖霾
      if (theme === 'temple' || theme === 'boss') {
        const g = ctx.createLinearGradient(0, 0, 0, 520);
        g.addColorStop(0, theme === 'boss' ? 'rgba(90,10,12,.14)' : 'rgba(100,33,15,.10)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 520);
      }
    }

    drawDirectionHint(ctx, camX) {
      if (this.state !== 'playing' || this.encounterActive || this.boss || !this.level) return;
      if (this.level.bossFight && !this.boss) {
        if (this.player.x > this.level.width - 900) return;
      }
      const pulse = .5 + Math.sin(this.time * 2.2) * .18;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = 'rgba(139,238,250,.55)'; ctx.lineWidth = 1.5;
      const x = 1760, y = 620;
      ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x + 16, y); ctx.lineTo(x, y - 16); ctx.stroke();
      ctx.font = '15px "STKaiti","KaiTi",serif'; ctx.fillStyle = 'rgba(216,234,232,.6)';
      ctx.textAlign = 'right';
      ctx.fillText('向山中去', x - 18, y + 5);
      ctx.restore();
    }

    drawChapterMarker(ctx) {
      if (this.state === 'dialogue' || this.state === 'upgrade') return;
    }

    renderUltimateFx(ctx) {
      if (!this.ultFx) return;
      const t = this.ultFx.t;
      if (this.ultFx.active) {
        const k = U.clamp((t - .82) / 1.4, 0, 1);
        const a = Math.sin(k * Math.PI);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * .7;
        const wx = -400 + k * 2800;
        const wy = 500 - k * 170;
        const g = ctx.createLinearGradient(wx - 500, wy, wx + 500, wy);
        g.addColorStop(0, 'rgba(62,190,220,0)'); g.addColorStop(.35, 'rgba(83,220,242,.20)'); g.addColorStop(.7, 'rgba(193,251,255,.36)'); g.addColorStop(1, 'rgba(50,160,190,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(wx, wy, 520, 125, -.04, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(wx + 420, wy - 8); ctx.quadraticCurveTo(wx + 590, wy - 140, wx + 650, wy - 20);
        ctx.quadraticCurveTo(wx + 600, wy + 15, wx + 650, wy + 100);
        ctx.quadraticCurveTo(wx + 540, wy + 40, wx + 400, wy + 60); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(235,255,255,.55)';
        ctx.beginPath(); ctx.arc(wx - 300, wy - 5, 6, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(137,242,255,.25)'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.ellipse(wx - 120, wy + 30 + i * 20, 610 - i * 40, 30 + i * 12, -.03, 0, Math.PI); ctx.stroke();
        }
        ctx.font = '700 96px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(210,251,255,${a * .18})`;
        ctx.fillText('鲸 落', 960, 340);
        ctx.restore();
      } else {
        const px = this.player ? this.player.x - this.camera.x + 960 : 960;
        const py = this.player ? this.player.y - 100 : 500;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const k = U.clamp(t / .82, 0, 1);
        ctx.strokeStyle = `rgba(126,238,255,${.35 * (1 - k) + .1})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.ellipse(px, py, 60 + k * 190 + i * 34, 26 + k * 120 + i * 16, this.time + i, 0, TAU); ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* ================= 入口 ================= */
  }

  window.addEventListener('load', () => {
    window.__sanzhongGame = new Game();
  });
})();
