PalladiumEvents.registerAnimations((event) => {
    event.register('alienevoexpansion/stabilizer_settings', 200, (builder) => {
        const settings = animationUtil.getAnimationTimerAbilityValue(
            builder.getPlayer(), 'alienevoexpansion:omniverse_omnitrix',
            'settings_menu', builder.getPartialTicks());
        if (settings <= 0) return;

        // Match Into the Omniverse's settings pose, including its mirrored wrist.
        const rightWrist = palladium.scoreboard.getScore(
            builder.getPlayer(), 'AEO.ArmPreference', 0) === 2;
        const direction = rightWrist ? -1 : 1;
        const watchArm = builder.get(rightWrist ? 'right_arm' : 'left_arm');
        const freeArm = builder.get(rightWrist ? 'left_arm' : 'right_arm');

        if (builder.isFirstPerson()) {
            watchArm.setXRotDegrees(-109)
                .setYRotDegrees(40 * direction).setZRotDegrees(-39 * direction)
                .setX(12 * direction).setY(9).setZ(5)
                .animate('easeOutBack', settings);
            freeArm.setXRotDegrees(-79)
                .setYRotDegrees(-16 * direction).setZRotDegrees(-8 * direction)
                .setX(-2.8 * direction).setY(-1.6).setZ(-1.7)
                .animate('easeOutBack', settings);
        } else {
            watchArm.setXRotDegrees(-124)
                .setYRotDegrees(22 * direction).setZRotDegrees(-115 * direction)
                .setX(6 * direction).setY(4).setZ(-1.5)
                .animate('easeOutBack', settings);
            freeArm.setXRotDegrees(-116)
                .setYRotDegrees(-38 * direction).setZRotDegrees(57 * direction)
                .setX(-5.45 * direction).setY(3.6).setZ(0.675)
                .animate('easeOutBack', settings);
        }
    });
});
