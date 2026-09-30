var instabilityId = 'alienevoexpansion:dna_instability';
var stabilizerId = 'alienevoexpansion:stabilizer_quick_wheel';
var instability = controllers[instabilityId];
var stabilizer = controllers['alienevoexpansion:stabilizer_controller'];
var backupKey = 'alienevoexpansion.stabilizer_eye_colors';
var eyeProperty = 'petrosapien_default_glowcolor_1_color_2';

instability.first(player, null, null, false);
assertEqual(data[backupKey], undefined, 'Disabled instability must not recolor');
activePowers[instabilityId] = true;
instability.first(player, null, null, true);
assertEqual(properties[eyeProperty], 'bd0034', 'Instability colors all eye tones');
assertEqual(properties.badge, 'dna_instability', 'Instability badge remains invisible');
var instabilityBackup = data[backupKey];
instability.first(player, null, null, true);
assertEqual(data[backupKey], instabilityBackup, 'Instability rejoin preserves original colors');

activePowers[stabilizerId] = true;
stabilizer.first(player, null, null, true);
assertEqual(properties.badge, 'albedo_stabilizer', 'Equipping selects the chest badge');
assertEqual(data[backupKey], instabilityBackup, 'Equipping does not back up already-red eyes');
delete activePowers[stabilizerId];
stabilizer.last(player);
assertEqual(properties[eyeProperty], 'bd0034', 'Unequipping keeps instability eyes red');
assertEqual(data[backupKey], instabilityBackup, 'Keep backup until both states end');
delete activePowers[instabilityId];
instability.last(player);
assertEqual(properties[eyeProperty], '123456', 'Removing the final state restores original eyes');
assertEqual(data[backupKey], undefined, 'Remove completed backup');

// Also cover the opposite removal order.
activePowers[stabilizerId] = true;
stabilizer.first(player, null, null, true);
activePowers[instabilityId] = true;
instability.first(player, null, null, true);
delete activePowers[instabilityId];
instability.last(player);
assertEqual(properties[eyeProperty], 'bd0034', 'Removing instability keeps stabilizer eyes red');
delete activePowers[stabilizerId];
stabilizer.last(player);
assertEqual(properties[eyeProperty], '123456', 'Unequipping the final state restores original eyes');
assertEqual(data[backupKey], undefined, 'Both removal orders clean the backup');
