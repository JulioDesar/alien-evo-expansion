// Run with: node src/test/scripts/stabilizer.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const resources = path.resolve(__dirname, '../../main/resources');
const alienCodex = {
    alienevo_alien_4: ['alienevo_aliens:kineceleran'],
    alienevo_4_default_glowcolor_1: ['b3ff40', '8ed721'],
    alienevo_4_default_glowcolor_2: ['b3ff40', 'a7f72e', '8ed721'],
    alienevo_alien_9: ['alienevo_aliens:galvanic_mechamorph'],
    alienevo_9_default_glowcolor_1: ['b3ff40', 'a7f72e', '8ed721', '64a306', '365b00'],
    alienevo_alien_240: ['omni_evo_aliens:goop'],
    alienevo_240_default_glowcolor_1: ['a9f756', '96ed32']
};
const controller = vm.createContext({
    global: alienCodex,
    StartupEvents: { registry() {} },
    palladium: {
        setProperty: (entity, key, value) => { entity.properties[key] = value; },
        getProperty: (entity, key) => entity.properties[key],
        // Match Palladium: this cannot initialize a score for a fresh player.
        scoreboard: {
            getScore: (entity, key, fallback) => entity.scores[key] ?? fallback,
            setScore: (entity, key, value) => {
                if (Object.hasOwn(entity.scores, key)) entity.scores[key] = value;
            }
        }
    }
});
vm.runInContext(fs.readFileSync(path.join(resources,
    'addon/alienevoexpansion/kubejs_scripts/stabilizer.js'), 'utf8'), controller);

function player(initial = {}) {
    const data = { ...initial };
    const tags = new Set();
    const objectives = new Set();
    const scores = {};
    return {
        data, properties: {}, scores,
        runCommandSilent(command) {
            const parts = command.split(' ');
            if (parts[1] === 'objectives' && parts[2] === 'add') {
                objectives.add(parts[3]);
            } else {
                assert.equal(parts.slice(0, 4).join(' '), 'scoreboard players set @s');
                assert.ok(objectives.has(parts[4]), 'Create objective before setting player color');
                scores[parts[4]] = Number(parts[5]);
            }
        },
        tags: { contains: (tag) => tags.has(tag), add: (tag) => tags.add(tag) },
        persistentData: {
            getInt: (key) => data[key] || 0,
            putInt: (key, value) => { data[key] = value; },
            getString: (key) => data[key] || '',
            putString: (key, value) => { data[key] = value; },
            remove: (key) => { delete data[key]; }
        }
    };
}

const fresh = player();
const otherPlayer = player();
controller.configureStabilizer(fresh);
assert.equal(fresh.properties.badge, 'albedo_stabilizer', 'Use the red stabilizer chest badge');
assert.deepEqual(fresh.scores, {
    'AlienEvo.CoreSide': 2, 'AlienEvo.CoreTop': 2,
    'AlienEvo.DialInner': 4, 'AlienEvo.DialOuter': 4
});
assert.equal(fresh.properties.uniform_glow_color_1, 'e3003e');
assert.equal(fresh.properties.uniform_glow_color_2, 'e3003e');
assert.equal(fresh.properties.uniform_glow_color_3, 'e3003e');
assert.equal(fresh.properties.omniverse_glow_color_3, 'e3003e', 'Match the wrist red');
fresh.scores['AlienEvo.CoreTop'] = -1;
controller.configureStabilizerIdentity(fresh);
assert.equal(fresh.scores['AlienEvo.CoreTop'], 2, 'Repair later instability initialization on login');
assert.equal(fresh.properties.uniform_glow_color_1, 'e3003e', 'Identity updates must preserve badge color');
assert.deepEqual(otherPlayer.properties, {}, 'Do not change other players or global palettes');
assert.deepEqual(otherPlayer.scores, {});
const originalEyeColors = {
    kineceleran_default_glowcolor_1_color_1: '112233',
    kineceleran_default_glowcolor_1_color_2: '8ed721',
    kineceleran_default_glowcolor_2_color_1: 'b3ff40',
    kineceleran_default_glowcolor_2_color_2: 'a7f72e',
    kineceleran_default_glowcolor_2_color_3: '8ed721',
    galvanic_mechamorph_default_glowcolor_1_color_1: 'b3ff40',
    galvanic_mechamorph_default_glowcolor_1_color_2: 'a7f72e',
    galvanic_mechamorph_default_glowcolor_1_color_3: '8ed721',
    galvanic_mechamorph_default_glowcolor_1_color_4: '64a306',
    galvanic_mechamorph_default_glowcolor_1_color_5: '365b00'
};
Object.assign(fresh.properties, originalEyeColors, {
    goop_default_glowcolor_1_color_1: 'a9f756',
    pyronite_default_skincolor_palette_2_color_1: 'fffef7'
});
const originalCodex = JSON.stringify(alienCodex);
controller.configureStabilizerEyes(fresh);
controller.configureStabilizerEyes(fresh); // Rejoin must not overwrite saved custom colors.
assert.equal(fresh.properties.kineceleran_default_glowcolor_1_color_1, 'e3003e');
assert.equal(fresh.properties.kineceleran_default_glowcolor_2_color_1, 'e3003e');
assert.equal(fresh.properties.galvanic_mechamorph_default_glowcolor_1_color_1, 'e3003e');
assert.equal(fresh.properties.goop_default_glowcolor_1_color_1, 'a9f756', 'Do not recolor Goop skin');
assert.equal(fresh.properties.pyronite_default_skincolor_palette_2_color_1, 'fffef7', 'Keep flames unchanged');
assert.equal(JSON.stringify(alienCodex), originalCodex, 'Never mutate global alien defaults');
controller.restoreStabilizerEyes(fresh);
for (const [property, value] of Object.entries(originalEyeColors)) {
    assert.equal(fresh.properties[property], value, 'Unequipping must restore prior colors');
}
assert.equal(fresh.data['alienevoexpansion.stabilizer_eye_colors'], undefined);
controller.restoreStabilizerEyes(fresh); // Safe without a backup.
controller.synchronizeStabilizerPlaylist(fresh);
assert.equal(fresh.data.current_playlist, 1);
assert.equal(fresh.data.current_alien_slot, 1);
for (let slot = 1; slot <= 10; slot++) {
    assert.equal(fresh.data[`alienevo.alien_1_${slot}`], slot);
    assert.equal(fresh.properties[`alien_evo_slot_${slot}`], slot);
}
const initialized = JSON.stringify(fresh.data);
controller.synchronizeStabilizerPlaylist(fresh);
assert.equal(JSON.stringify(fresh.data), initialized, 'Re-equipping must preserve DNA');

const saved = player({ current_playlist: 2, current_alien_slot: 3,
    'alienevo.alien_1_1': 32, 'alienevo.alien_2_3': 35 });
const original = JSON.stringify(saved.data);
controller.synchronizeStabilizerPlaylist(saved);
assert.equal(JSON.stringify(saved.data), original, 'Existing playlists must not be replaced');
assert.equal(saved.properties.alien_evo_slot_3, 35);
assert.equal(saved.properties.alien_evo_slot_1, 0, 'Empty slots must remain empty');

const emptySelection = player({ current_playlist: 101, 'alienevo.alien_100_1': 32 });
controller.synchronizeStabilizerPlaylist(emptySelection);
assert.equal(emptySelection.data.current_playlist, 100);
assert.equal(emptySelection.properties.alien_evo_slot_1, 32);
assert.equal(emptySelection.data['alienevo.alien_1_1'], undefined, 'Do not grant DNA over saved data');

let animateSettings;
let settings = 0.5;
let wrist = 0;
vm.runInNewContext(fs.readFileSync(path.join(resources,
    'assets/alienevoexpansion/kubejs_scripts/stabilizer_animations.js'), 'utf8'), {
    PalladiumEvents: { registerAnimations(callback) {
        callback({ register(id, priority, callback) { animateSettings = callback; } });
    } },
    animationUtil: { getAnimationTimerAbilityValue(entity, power, ability) {
        assert.equal(power, 'alienevoexpansion:omniverse_omnitrix');
        assert.equal(ability, 'settings_menu');
        return settings;
    } },
    palladium: { scoreboard: { getScore: () => wrist } }
});

function pose(firstPerson) {
    const arms = {};
    animateSettings({
        getPlayer: () => ({}), getPartialTicks: () => 0, isFirstPerson: () => firstPerson,
        get(name) {
            const values = {};
            arms[name] = values;
            const part = {};
            for (const axis of ['XRotDegrees', 'YRotDegrees', 'ZRotDegrees', 'X', 'Y', 'Z']) {
                part[`set${axis}`] = (value) => { values[axis] = value; return part; };
            }
            part.animate = (curve, value) => {
                assert.equal(curve, 'easeOutBack');
                assert.equal(value, settings);
            };
            return part;
        }
    });
    return arms;
}
for (const firstPerson of [true, false]) {
    wrist = 0;
    const left = pose(firstPerson);
    assert.equal(left.left_arm.XRotDegrees, firstPerson ? -109 : -124);
    assert.equal(left.left_arm.X, firstPerson ? 12 : 6);
    wrist = 1;
    assert.deepEqual(pose(firstPerson), left, 'Unset wrist must match the default left wrist');
    wrist = 2;
    const right = pose(firstPerson);
    for (const axis of ['XRotDegrees', 'YRotDegrees', 'ZRotDegrees', 'X', 'Y', 'Z']) {
        const mirror = ['YRotDegrees', 'ZRotDegrees', 'X'].includes(axis) ? -1 : 1;
        assert.equal(right.right_arm[axis], left.left_arm[axis] * mirror);
        assert.equal(right.left_arm[axis], left.right_arm[axis] * mirror);
    }
}
settings = 0;
assert.deepEqual(pose(true), {}, 'Closed settings and absent human power must not pose arms');
console.log('Stabilizer badge, playlist and settings animation checks passed.');
