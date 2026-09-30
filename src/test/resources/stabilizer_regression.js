// Real Rhino coverage: Node does not reproduce this engine's const-in-loop behavior.
function assertEqual(actual, expected, description) {
    if (actual !== expected) throw new Error(description + ': expected ' + expected + ', got ' + actual);
}

var alienCodex = {
    alienevo_alien_3: ['alienevo_aliens:petrosapien'],
    alienevo_3_default_glowcolor_1: ['b3ff40', '8ed721'],
    alienevo_alien_4: ['alienevo_aliens:kineceleran'],
    alienevo_4_default_glowcolor_1: ['b3ff40', '8ed721'],
    alienevo_4_default_glowcolor_2: ['b3ff40', 'a7f72e', '8ed721'],
    alienevo_alien_9: ['alienevo_aliens:galvanic_mechamorph'],
    alienevo_9_default_glowcolor_1: ['b3ff40', 'a7f72e', '8ed721', '64a306', '365b00']
};
for (let key of Object.keys(alienCodex)) global[key] = alienCodex[key];
var properties = {};
var data = {};
var objectives = {};
var scores = {};
var commands = 0;
var palladium = {
    setProperty: function (entity, key, value) { properties[key] = value; },
    getProperty: function (entity, key) { return properties[key] || '123456'; },
    scoreboard: {
        getScore: function (entity, key, fallback) { return scores[key] === undefined ? fallback : scores[key]; }
    }
};
var player = {
    tags: { contains: function () { return true; } },
    persistentData: {
        getInt: function (key) { return data[key] || 0; },
        putInt: function (key, value) { data[key] = value; },
        getString: function (key) { return data[key] || ''; },
        putString: function (key, value) { data[key] = value; },
        remove: function (key) { delete data[key]; }
    },
    runCommandSilent: function (command) {
        commands++;
        var parts = command.split(' ');
        if (parts[1] === 'objectives') objectives[parts[3]] = true;
        else {
            assertEqual(objectives[parts[4]], true, 'Objective must exist');
            scores[parts[4]] = Number(parts[5]);
        }
    }
};

configureStabilizer(player);
assertEqual(properties.badge, 'albedo_stabilizer', 'Red stabilizer chest badge');
assertEqual(scores['AlienEvo.CoreSide'], 2, 'Gray side');
assertEqual(scores['AlienEvo.CoreTop'], 2, 'Gray rim');
assertEqual(scores['AlienEvo.DialInner'], 4, 'Black inner triangles');
assertEqual(scores['AlienEvo.DialOuter'], 4, 'Black outer triangles');
var initializedCommands = commands;
configureStabilizerIdentity(player);
assertEqual(commands, initializedCommands, 'Do not repeat commands once initialized');

// Simulate a save from the broken version: only the first eye property was backed up.
data['alienevoexpansion.stabilizer_eye_colors'] = '{"petrosapien_default_glowcolor_1_color_1":"abcdef"}';
configureStabilizerEyes(player);
var backup = data['alienevoexpansion.stabilizer_eye_colors'];
configureStabilizerEyes(player);
assertEqual(data['alienevoexpansion.stabilizer_eye_colors'], backup, 'Preserve backups on rejoin');
assertEqual(properties.petrosapien_default_glowcolor_1_color_1, 'e3003e', 'First eye pixel');
assertEqual(properties.petrosapien_default_glowcolor_1_color_2, 'bd0034', 'Second eye pixel');
assertEqual(properties.kineceleran_default_glowcolor_2_color_3, '8e0028', 'Other aliens and visor palettes');
assertEqual(properties.galvanic_mechamorph_default_glowcolor_1_color_5, '61001c', 'Shared luminous details');
restoreStabilizerEyes(player);
assertEqual(properties.petrosapien_default_glowcolor_1_color_1, 'abcdef', 'Restore existing backup');
assertEqual(properties.petrosapien_default_glowcolor_1_color_2, '123456', 'Restore newly backed-up tone');
assertEqual(properties.galvanic_mechamorph_default_glowcolor_1_color_5, '123456', 'Restore every alien');

synchronizeStabilizerPlaylist(player);
for (let slot = 1; slot <= 10; slot++) {
    assertEqual(properties['alien_evo_slot_' + slot], slot, 'Distinct alien slots');
}

// Capture real controller callbacks for the subsequent lifecycle regression checks.
var controllers = {};
StartupEvents.registry = function (id, callback) {
    callback({ create: function (name) {
        var callbacks = {};
        controllers[name] = callbacks;
        return {
            icon: function () { return this; },
            firstTick: function (fn) { callbacks.first = fn; return this; },
            tick: function (fn) { callbacks.tick = fn; return this; },
            lastTick: function (fn) { callbacks.last = fn; return this; }
        };
    } });
};
var activePowers = {};
var abilityUtil = { hasPower: function (entity, id) { return !!activePowers[id]; } };
function ResourceLocation(id) { this.toString = function () { return id; }; }
palladium.createItemIcon = function () {};
palladium.powers = { getPowerIds: function () { return Object.keys(activePowers); } };
palladium.superpowers = {
    addSuperpower: function (entity, id) { activePowers[String(id)] = true; },
    removeSuperpower: function (entity, id) { delete activePowers[String(id)]; }
};
palladium.scoreboard.setScore = function (entity, key, value) { scores[key] = value; };
player.tags.remove = function () {};
player.persistentData.getBoolean = function (key) { return !!data[key]; };
player.server = { getTickCount: function () { return 0; } };
