const STABILIZER_MAIN_POWER_ID = 'alienevoexpansion:omniverse_omnitrix';
const STABILIZER_STATE_POWER_ID = 'alienevoexpansion:stabilizer_quick_wheel';
const STABILIZER_DATA_VERSION_KEY = 'alienevoexpansion.stabilizer_data_version';
const STABILIZER_DATA_VERSION = 1;

PlayerEvents.tick((event) => {
    const player = event.player;
    if (!player || player.persistentData.getInt(STABILIZER_DATA_VERSION_KEY) >= STABILIZER_DATA_VERSION) return;

    const hasMainPower = abilityUtil.hasPower(player, STABILIZER_MAIN_POWER_ID);
    const hasStatePower = abilityUtil.hasPower(player, STABILIZER_STATE_POWER_ID);
    const watch = palladium.getProperty(player, 'watch');
    const watchNamespace = palladium.getProperty(player, 'watch_namespace');
    const hasStabilizerIdentity = watch === 'omniverse' && watchNamespace === 'alienevoexpansion';
    player.persistentData.putInt(STABILIZER_DATA_VERSION_KEY, STABILIZER_DATA_VERSION);

    if (!hasMainPower && !hasStatePower && !hasStabilizerIdentity) return;

    palladium.setProperty(player, 'watch', 'omniverse');
    palladium.setProperty(player, 'watch_namespace', 'alienevoexpansion');
    palladium.setProperty(player, 'watch_state', 'default');
    palladium.setProperty(player, 'badge', 'albedo_stabilizer');

    removePower(player, STABILIZER_MAIN_POWER_ID);
    removePower(player, STABILIZER_STATE_POWER_ID);

    if (hasMainPower) {
        addPower(player, STABILIZER_MAIN_POWER_ID);
    }
    addPower(player, STABILIZER_STATE_POWER_ID);
});

function addPower(entity, powerId) {
    palladium.superpowers.addSuperpower(entity, new ResourceLocation(powerId));
}

function removePower(entity, powerId) {
    if (abilityUtil.hasPower(entity, powerId)) {
        palladium.superpowers.removeSuperpower(entity, new ResourceLocation(powerId));
    }
}
