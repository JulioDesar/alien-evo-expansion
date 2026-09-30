StartupEvents.registry('palladium:abilities', (event) => {
    const QUICK_CHANGE_POWER_ID = 'alienevo:quick_change';
    const OMNIVERSE_QUICK_CHANGE_POWER_ID = 'alienevo:qc';

    event.create('alienevoexpansion:stabilizer_controller')
        .icon(palladium.createItemIcon('alienevoexpansion:albedo_stabilizer'))
        .firstTick((entity, abilityEntry, abilityHolder, isEnabled) => {
            if (!isEnabled || !entity) return;

            synchronizeStabilizerPlaylist(entity);
            configureStabilizer(entity);
            configureStabilizerEyes(entity);
            grantStabilizerFunctions(entity);
        })
        .tick((entity, abilityEntry, abilityHolder, isEnabled) => {
            if (!isEnabled || !entity) return;

            configureStabilizerIdentity(entity);
            grantStabilizerFunctions(entity);
        })
        .lastTick((entity) => {
            if (!entity) return;

            removePower(entity, QUICK_CHANGE_POWER_ID);
            removePower(entity, OMNIVERSE_QUICK_CHANGE_POWER_ID);
            entity.tags.remove('AlienEvo.BaseForm');
            global.restoreAlbedoEyes(entity, 'alienevoexpansion:dna_instability');
        });

    function grantStabilizerFunctions(entity) {
        addPowerIfMissing(entity, QUICK_CHANGE_POWER_ID);
        addPowerIfMissing(entity, OMNIVERSE_QUICK_CHANGE_POWER_ID);

        if (!entity.tags.contains('AlienEvo.BaseForm')) {
            entity.tags.add('AlienEvo.BaseForm');
        }
    }

    function addPowerIfMissing(entity, powerId) {
        if (!abilityUtil.hasPower(entity, powerId)) {
            palladium.superpowers.addSuperpower(entity, new ResourceLocation(powerId));
        }
    }

    function removePower(entity, powerId) {
        if (abilityUtil.hasPower(entity, powerId)) {
            palladium.superpowers.removeSuperpower(entity, new ResourceLocation(powerId));
        }
    }
});

function configureStabilizer(entity) {
    configureStabilizerIdentity(entity);
    palladium.setProperty(entity, 'quick_change_wheel', 'disabled');

    // The chest badge glow is baked red; this palette tints the detransform flash.
    setStabilizerPalette(entity, 'uniform_glow_color', [
        'e3003e',
        'e3003e',
        'e3003e',
        '710021',
        '61001c'
    ]);

    setStabilizerPalette(entity, 'uniform_primary_color', [
        '3a3333',
        '2c2828',
        '232020',
        '171515',
        '000000'
    ]);
    setStabilizerPalette(entity, 'uniform_secondary_color', [
        'ffffff',
        'edf4f4',
        'd6dfe1',
        'bdc7cf',
        '97a2b0'
    ]);
    setStabilizerPalette(entity, 'omniverse_tertiary_color', [
        'ff4668',
        'e3003e',
        'bd0034',
        '8e0028',
        '61001c'
    ]);
    setStabilizerPalette(entity, 'omniverse_glow_color', [
        'ff8ba0',
        'ff315a',
        'e3003e',
        'a80030',
        '710021'
    ]);
}

function configureStabilizerIdentity(entity) {
    palladium.setProperty(entity, 'watch', 'omniverse');
    palladium.setProperty(entity, 'watch_namespace', 'alienevoexpansion');
    palladium.setProperty(entity, 'watch_state', 'default');
    palladium.setProperty(entity, 'use_timeout_bubble', false);
    palladium.setProperty(entity, 'uniform', 'default');
    palladium.setProperty(entity, 'badge', 'albedo_stabilizer');

    // Native badge overlays: gray housing and black hourglass tips.
    const lightGrayColor = 2;
    const blackColor = 4;
    // Rhino retains const bindings across iterations; use let for per-iteration values.
    for (let part of ['CoreSide', 'CoreTop', 'DialInner', 'DialOuter']) {
        let objective = `AlienEvo.${part}`;
        let color = part === 'CoreSide' || part === 'CoreTop' ? lightGrayColor : blackColor;
        if (palladium.scoreboard.getScore(entity, objective, -2) === color) continue;
        // ScoreboardUtil.setScore cannot create missing objectives/player scores.
        // Also repair colors if instability initialization runs after us on login.
        entity.runCommandSilent(`scoreboard objectives add ${objective} dummy`);
        entity.runCommandSilent(`scoreboard players set @s ${objective} ${color}`);
    }

    if (!entity.tags.contains('AlienEvo.Unworthy')) {
        entity.tags.add('AlienEvo.Unworthy');
    }
}

function setStabilizerPalette(entity, propertyPrefix, colors) {
    for (let index = 0; index < colors.length; index++) {
        palladium.setProperty(entity, `${propertyPrefix}_${index + 1}`, colors[index]);
    }
}

function configureStabilizerEyes(entity) {
    const backupKey = 'alienevoexpansion.stabilizer_eye_colors';
    const savedColors = entity.persistentData.getString(backupKey);
    const originalColors = savedColors ? JSON.parse(savedColors) : {};
    // Eye palettes and their shared luminous details (including Mechamorph circuits).
    // Do not recolor unrelated skin/armor palettes or flame textures.
    // Kineceleran palette 2 controls the closed visor rather than the bare eyes.
    const eyePalettes = {
        3: [1], 4: [1, 2], 5: [1], 6: [1], 7: [1], 8: [1], 9: [1],
        10: [1], 11: [1], 105: [1], 106: [1], 176: [1], 241: [1]
    };
    const colors = ['e3003e', 'bd0034', '8e0028', '710021', '61001c'];
    for (let alienId of Object.keys(eyePalettes)) {
        let alienInfo = global[`alienevo_alien_${alienId}`];
        if (!alienInfo || !alienInfo[0]) continue;
        let alienName = String(alienInfo[0]).split(':').pop();
        for (let paletteId of eyePalettes[alienId]) {
            let palette = global[`alienevo_${alienId}_default_glowcolor_${paletteId}`];
            if (!Array.isArray(palette)) continue;
            for (let index = 0; index < palette.length; index++) {
                let property = `${alienName}_default_glowcolor_${paletteId}_color_${index + 1}`;
                if (originalColors[property] === undefined) {
                    originalColors[property] = String(palladium.getProperty(entity, property));
                }
                palladium.setProperty(entity, property, colors[Math.min(index, colors.length - 1)]);
            }
        }
    }
    entity.persistentData.putString(backupKey, JSON.stringify(originalColors));
}

function restoreStabilizerEyes(entity) {
    const backupKey = 'alienevoexpansion.stabilizer_eye_colors';
    const savedColors = entity.persistentData.getString(backupKey);
    if (!savedColors) return;
    const originalColors = JSON.parse(savedColors);
    for (let property of Object.keys(originalColors)) {
        palladium.setProperty(entity, property, originalColors[property]);
    }
    entity.persistentData.remove(backupKey);
}

// KubeJS isolates script scopes; share the palette through its explicit global object.
// Keep the existing backup key so older stabilizer saves still restore their colors.
global.configureAlbedoEyes = configureStabilizerEyes;
global.restoreAlbedoEyes = (entity, remainingPowerId) => {
    if (!abilityUtil.hasPower(entity, remainingPowerId)) restoreStabilizerEyes(entity);
};

function synchronizeStabilizerPlaylist(entity) {
    const maxPlaylists = 100;
    const slotsPerPlaylist = 10;
    let currentPlaylist = entity.persistentData.getInt('current_playlist');
    let firstAvailablePlaylist = 0;
    let currentPlaylistHasAliens = false;

    // Instability does not create Omnitrix playlists. Preserve any existing DNA.
    for (let playlist = 1; playlist <= maxPlaylists; playlist++) {
        for (let slot = 1; slot <= slotsPerPlaylist; slot++) {
            if (entity.persistentData.getInt(`alienevo.alien_${playlist}_${slot}`) <= 0) continue;
            if (firstAvailablePlaylist === 0) firstAvailablePlaylist = playlist;
            if (playlist === currentPlaylist) currentPlaylistHasAliens = true;
        }
    }

    if (firstAvailablePlaylist === 0) {
        // Alien Evolution's original ten DNA IDs, stored in its native format.
        const starterAlienIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        for (let index = 0; index < starterAlienIds.length; index++) {
            entity.persistentData.putInt(`alienevo.alien_1_${index + 1}`, starterAlienIds[index]);
        }
        firstAvailablePlaylist = 1;
    }

    if (!currentPlaylistHasAliens) {
        currentPlaylist = firstAvailablePlaylist;
        entity.persistentData.putInt('current_alien_slot', 1);
    }
    entity.persistentData.putInt('current_playlist', currentPlaylist);

    for (let slot = 1; slot <= slotsPerPlaylist; slot++) {
        let alienId = entity.persistentData.getInt(`alienevo.alien_${currentPlaylist}_${slot}`);
        palladium.setProperty(entity, `alien_evo_slot_${slot}`, alienId);
    }
}
