StartupEvents.registry('palladium:abilities', (event) => {
    const STATE_POWER_ID = 'alienevoexpansion:dna_instability';
    const STABILIZER_MAIN_POWER_ID = 'alienevoexpansion:omniverse_omnitrix';
    const LEGACY_STABILIZER_MAIN_POWER_ID = 'alienevoexpansion:stabilizer_omnitrix';
    const STABILIZER_WHEEL_POWER_ID = 'alienevoexpansion:stabilizer_quick_wheel';
    const NEXT_TRANSFORMATION_TICK = 'alienevoexpansion.dna_instability.next_transformation_tick';
    const CURRENT_ALIEN_POWER = 'alienevoexpansion.dna_instability.current_alien_power';
    const CURRENT_PHASE = 'alienevoexpansion.dna_instability.current_phase';
    const PHASE_END_TICK = 'alienevoexpansion.dna_instability.phase_end_tick';
    const ADDED_UNWORTHY_TAG = 'alienevoexpansion.dna_instability.added_unworthy_tag';
    const INSTABILITY_PHASE = 'instability';
    const HUMAN_PHASE = 'human';
    const MIN_TRANSFORMATION_DELAY = 20;
    const MAX_TRANSFORMATION_DELAY = 1200;
    const MIN_INSTABILITY_DURATION = 3600;
    const MAX_INSTABILITY_DURATION = 8400;
    const HUMAN_PHASE_DURATION = 6000;
    const RETRY_DELAY = 20;

    event.create('alienevoexpansion:dna_instability')
        .icon(palladium.createItemIcon('minecraft:echo_shard'))
        .firstTick((entity, abilityEntry, abilityHolder, isEnabled) => {
            if (!isEnabled || !entity) return;

            global.configureAlbedoEyes(entity);
            configureInstabilityProperties(entity);
            blockOmnitrixAccess(entity);

            const savedPhase = entity.persistentData.getString(CURRENT_PHASE);
            if (savedPhase !== INSTABILITY_PHASE && savedPhase !== HUMAN_PHASE) {
                startInstabilityPhase(entity, entity.server.getTickCount());
            }
        })
        .tick((entity, abilityEntry, abilityHolder, isEnabled) => {
            if (!isEnabled || !entity) return;

            if (abilityUtil.hasPower(entity, STABILIZER_WHEEL_POWER_ID)) {
                return;
            }

            configureInstabilityProperties(entity);
            blockOmnitrixAccess(entity);

            if (!entity.isAlive() || entity.health <= 0) return;

            const compatibleAliens = getCompatibleAliens();
            const activeAliens = getActiveAlienPowers(entity, compatibleAliens);
            const currentTick = entity.server.getTickCount();
            let currentPhase = entity.persistentData.getString(CURRENT_PHASE);

            if (currentPhase !== INSTABILITY_PHASE && currentPhase !== HUMAN_PHASE) {
                startInstabilityPhase(entity, currentTick);
                currentPhase = INSTABILITY_PHASE;
            }

            let phaseEndTick = entity.persistentData.getInt(PHASE_END_TICK);
            const maximumPhaseDuration = currentPhase === HUMAN_PHASE
                ? HUMAN_PHASE_DURATION
                : MAX_INSTABILITY_DURATION;

            if (phaseEndTick <= 0 || phaseEndTick > currentTick + maximumPhaseDuration) {
                phaseEndTick = currentTick + (currentPhase === HUMAN_PHASE
                    ? HUMAN_PHASE_DURATION
                    : randomBetween(MIN_INSTABILITY_DURATION, MAX_INSTABILITY_DURATION));
                entity.persistentData.putInt(PHASE_END_TICK, phaseEndTick);
            }

            if (currentPhase === HUMAN_PHASE) {
                if (activeAliens.length > 0) {
                    returnToHumanForm(entity, compatibleAliens);
                }

                if (phaseEndTick <= currentTick) {
                    startInstabilityPhase(entity, currentTick);
                } else {
                    return;
                }
            } else if (phaseEndTick <= currentTick) {
                startHumanPhase(entity, compatibleAliens, currentTick);
                return;
            }

            if (activeAliens.length > 0) {
                palladium.scoreboard.setScore(entity, 'AlienEvo.Timer', 10);
            }

            let nextTransformationTick = entity.persistentData.getInt(NEXT_TRANSFORMATION_TICK);

            if (nextTransformationTick > currentTick + MAX_TRANSFORMATION_DELAY) {
                nextTransformationTick = currentTick;
            }

            if (activeAliens.length === 0 && nextTransformationTick > currentTick + RETRY_DELAY) {
                nextTransformationTick = currentTick;
            }

            if (nextTransformationTick <= currentTick) {
                transformRandomly(entity, compatibleAliens, activeAliens, currentTick);
            }
        })
        .lastTick((entity, abilityEntry, abilityHolder, isEnabled) => {
            if (!entity) return;

            global.restoreAlbedoEyes(entity, STABILIZER_WHEEL_POWER_ID);
            returnToHumanForm(entity, getCompatibleAliens());
            blockOmnitrixAccess(entity);

            entity.persistentData.remove(NEXT_TRANSFORMATION_TICK);
            entity.persistentData.remove(CURRENT_ALIEN_POWER);
            entity.persistentData.remove(CURRENT_PHASE);
            entity.persistentData.remove(PHASE_END_TICK);

            if (entity.persistentData.getBoolean(ADDED_UNWORTHY_TAG)) {
                entity.tags.remove('AlienEvo.Unworthy');
            }
            entity.persistentData.remove(ADDED_UNWORTHY_TAG);

            palladium.setProperty(entity, 'watch', 'default');
            palladium.setProperty(entity, 'watch_namespace', 'alienevo');
            palladium.setProperty(entity, 'badge', 'prototype');
            palladium.setProperty(entity, 'quick_change_wheel', 'disabled');

            palladium.scoreboard.setScore(entity, 'AlienEvo.CoreSide', 0);
            palladium.scoreboard.setScore(entity, 'AlienEvo.CoreTop', 0);
            palladium.scoreboard.setScore(entity, 'AlienEvo.DialInner', 0);
            palladium.scoreboard.setScore(entity, 'AlienEvo.DialOuter', 0);
        });

    function startInstabilityPhase(entity, currentTick) {
        entity.persistentData.putString(CURRENT_PHASE, INSTABILITY_PHASE);
        entity.persistentData.putInt(
            PHASE_END_TICK,
            currentTick + randomBetween(MIN_INSTABILITY_DURATION, MAX_INSTABILITY_DURATION)
        );
        entity.persistentData.putInt(NEXT_TRANSFORMATION_TICK, currentTick);
    }

    function startHumanPhase(entity, compatibleAliens, currentTick) {
        entity.persistentData.putString(CURRENT_PHASE, HUMAN_PHASE);
        entity.persistentData.putInt(PHASE_END_TICK, currentTick + HUMAN_PHASE_DURATION);
        entity.persistentData.remove(NEXT_TRANSFORMATION_TICK);
        returnToHumanForm(entity, compatibleAliens);
    }

    function returnToHumanForm(entity, compatibleAliens) {
        removeActiveAlienPowers(entity, compatibleAliens);
        entity.tags.remove('AlienEvo.Transformation');
        entity.persistentData.remove(CURRENT_ALIEN_POWER);
        entity.persistentData.remove('alienevo.current_namespace');
        entity.persistentData.remove('alienevo.current_path');

        palladium.scoreboard.setScore(entity, 'AlienEvo.Timer', 0);
        palladium.setProperty(entity, 'omnitrix_cycle', 0);
        palladium.superpowers.addSuperpower(entity, new ResourceLocation('alienevo:transform_bubble'));
    }

    function randomBetween(minimum, maximum) {
        return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    }

    function configureInstabilityProperties(entity) {
        palladium.setProperty(entity, 'watch', 'dna_instability');
        palladium.setProperty(entity, 'watch_namespace', 'alienevoexpansion');
        palladium.setProperty(entity, 'use_timeout_bubble', false);
        palladium.setProperty(entity, 'uniform', 'default');
        palladium.setProperty(entity, 'badge', 'dna_instability');
        palladium.setProperty(entity, 'watch_state', 'default');
        palladium.setProperty(entity, 'quick_change_wheel', 'disabled');

        palladium.scoreboard.setScore(entity, 'AlienEvo.CoreSide', -1);
        palladium.scoreboard.setScore(entity, 'AlienEvo.CoreTop', -1);
        palladium.scoreboard.setScore(entity, 'AlienEvo.DialInner', -1);
        palladium.scoreboard.setScore(entity, 'AlienEvo.DialOuter', -1);
    }

    function blockOmnitrixAccess(entity) {
        if (!entity.tags.contains('AlienEvo.Unworthy')) {
            entity.tags.add('AlienEvo.Unworthy');
            entity.persistentData.putBoolean(ADDED_UNWORTHY_TAG, true);
        }

        var blockedPowers = [];
        var powers = palladium.powers.getPowerIds(entity);

        if (powers) {
            for (var index = 0; index < powers.length; index++) {
                var powerId = String(powers[index]);
                var lowerPowerId = powerId.toLowerCase();
                var separatorIndex = lowerPowerId.indexOf(':');
                var powerPath = separatorIndex >= 0 ? lowerPowerId.substring(separatorIndex + 1) : lowerPowerId;

                if (lowerPowerId === STATE_POWER_ID ||
                    lowerPowerId === STABILIZER_MAIN_POWER_ID ||
                    lowerPowerId === LEGACY_STABILIZER_MAIN_POWER_ID ||
                    lowerPowerId === STABILIZER_WHEEL_POWER_ID) continue;

                if (powerPath.includes('omnitrix') ||
                    powerPath === 'normal_watch' ||
                    powerPath === 'normal_watch_item' ||
                    lowerPowerId === 'alienevo:qc' ||
                    lowerPowerId === 'alienevo:quick_change' ||
                    lowerPowerId === 'aeo:battery' ||
                    lowerPowerId === 'aeo:randomizer' ||
                    lowerPowerId === 'omni_evo:ult_ability' ||
                    lowerPowerId.startsWith('omni_evo_ultimates:')) {
                    blockedPowers.push(powerId);
                }
            }
        }

        for (var blockedIndex = 0; blockedIndex < blockedPowers.length; blockedIndex++) {
            palladium.superpowers.removeSuperpower(entity, new ResourceLocation(blockedPowers[blockedIndex]));
        }

        entity.tags.remove('AlienEvo.BaseForm');
        entity.tags.remove('AlienEvo.MasterControl');
        entity.tags.remove('AlienEvo.MasterControlAnim');
        entity.tags.remove('Omniverse.Randomizer');
        entity.tags.remove('alienevo.ultimate');
    }

    function getCompatibleAliens() {
        var compatibleAliens = [];
        var seenPowers = {};

        function addAlien(alienId, enabled) {
            var numericAlienId = parseInt(alienId);
            if (!enabled || isNaN(numericAlienId) || numericAlienId <= 0 || numericAlienId === 141) return;

            var alienInfo = global['alienevo_alien_' + numericAlienId];
            if (!alienInfo || !alienInfo[0]) return;

            var rawPowerId = String(alienInfo[0]);
            var powerId = rawPowerId.includes(':') ? rawPowerId : 'alienevo_aliens:' + rawPowerId;
            var lowerPowerId = powerId.toLowerCase();

            if (lowerPowerId.endsWith(':celestialsapien') || seenPowers[lowerPowerId]) return;

            seenPowers[lowerPowerId] = true;
            compatibleAliens.push({ id: numericAlienId, powerId: powerId });
        }

        if (global.alienevo_randomization &&
            typeof global.alienevo_randomization === 'object' &&
            !Array.isArray(global.alienevo_randomization)) {
            for (var alienId in global.alienevo_randomization) {
                var configuredValue = global.alienevo_randomization[alienId];
                addAlien(alienId, configuredValue instanceof Array ? !!configuredValue[0] : !!configuredValue);
            }
        } else {
            for (var key in global) {
                if (!key || typeof key !== 'string' || !key.startsWith('alienevo_randomization_')) continue;

                var registeredValue = global[key];
                addAlien(key.substring('alienevo_randomization_'.length), registeredValue instanceof Array ? !!registeredValue[0] : !!registeredValue);
            }
        }

        return compatibleAliens;
    }

    function getActiveAlienPowers(entity, compatibleAliens) {
        var compatiblePowerIds = {};
        var activeAlienPowers = [];

        for (var index = 0; index < compatibleAliens.length; index++) {
            compatiblePowerIds[compatibleAliens[index].powerId.toLowerCase()] = true;
        }

        var powers = palladium.powers.getPowerIds(entity);
        if (!powers) return activeAlienPowers;

        for (var powerIndex = 0; powerIndex < powers.length; powerIndex++) {
            var powerId = String(powers[powerIndex]);
            if (compatiblePowerIds[powerId.toLowerCase()]) {
                activeAlienPowers.push(powerId);
            }
        }

        return activeAlienPowers;
    }

    function removeActiveAlienPowers(entity, compatibleAliens) {
        var activeAlienPowers = getActiveAlienPowers(entity, compatibleAliens);
        var storedAlienPower = entity.persistentData.getString(CURRENT_ALIEN_POWER);

        for (var index = 0; index < activeAlienPowers.length; index++) {
            palladium.superpowers.removeSuperpower(entity, new ResourceLocation(activeAlienPowers[index]));
        }

        if (storedAlienPower && !activeAlienPowers.includes(storedAlienPower)) {
            palladium.superpowers.removeSuperpower(entity, new ResourceLocation(storedAlienPower));
        }
    }

    function transformRandomly(entity, compatibleAliens, activeAlienPowers, currentTick) {
        if (compatibleAliens.length === 0) {
            entity.persistentData.putInt(NEXT_TRANSFORMATION_TICK, currentTick + RETRY_DELAY);
            return;
        }

        var currentPowerId = activeAlienPowers.length > 0
            ? activeAlienPowers[0].toLowerCase()
            : entity.persistentData.getString(CURRENT_ALIEN_POWER).toLowerCase();
        var candidates = compatibleAliens;

        if (compatibleAliens.length > 1 && currentPowerId) {
            candidates = compatibleAliens.filter((alien) => alien.powerId.toLowerCase() !== currentPowerId);
        }

        var selectedAlien = candidates[Math.floor(Math.random() * candidates.length)];
        removeActiveAlienPowers(entity, compatibleAliens);

        var separatorIndex = selectedAlien.powerId.indexOf(':');
        var alienNamespace = selectedAlien.powerId.substring(0, separatorIndex);
        var alienPath = selectedAlien.powerId.substring(separatorIndex + 1);

        palladium.setProperty(entity, 'omnitrix_cycle', selectedAlien.id);
        palladium.scoreboard.setScore(entity, 'AlienEvo.Timer', 10);
        entity.persistentData.putString('alienevo.current_namespace', alienNamespace);
        entity.persistentData.putString('alienevo.current_path', alienPath);
        entity.persistentData.putString(CURRENT_ALIEN_POWER, selectedAlien.powerId);

        palladium.superpowers.addSuperpower(entity, new ResourceLocation(selectedAlien.powerId));
        palladium.superpowers.addSuperpower(entity, new ResourceLocation('alienevo:transform_bubble'));

        var username = entity.getGameProfile().getName();
        entity.server.runCommandSilent(
            'playsound alienevo:randomized master ' + username + ' ' + entity.x + ' ' + entity.y + ' ' + entity.z
        );

        var delay = randomBetween(MIN_TRANSFORMATION_DELAY, MAX_TRANSFORMATION_DELAY);
        entity.persistentData.putInt(NEXT_TRANSFORMATION_TICK, currentTick + delay);
    }
});
