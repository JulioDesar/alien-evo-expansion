// Alien Evolution's power screen reads `<watch>_glow_color_N`; DNA instability uses its own watch type.
// Keep this list identical to the client-side registration in assets/alienevoexpansion/kubejs_scripts.
PalladiumEvents.registerProperties((event) => {
    if (event.getEntityType() !== 'minecraft:player') return;

    const colors = ['e3003e', 'bd0034', '8e0028', '710021', '61001c'];
    for (let index = 0; index < colors.length; index++) {
        event.registerProperty(`dna_instability_glow_color_${index + 1}`, 'string', colors[index]);
    }
});
