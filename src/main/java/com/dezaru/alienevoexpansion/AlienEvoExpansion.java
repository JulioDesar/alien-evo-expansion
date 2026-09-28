package com.dezaru.alienevoexpansion;

import com.mojang.logging.LogUtils;
import net.minecraftforge.fml.common.Mod;
import org.slf4j.Logger;

@Mod(AlienEvoExpansion.MOD_ID)
public final class AlienEvoExpansion
{
    public static final String MOD_ID = "alienevoexpansion";
    private static final Logger LOGGER = LogUtils.getLogger();

    public AlienEvoExpansion()
    {
        LOGGER.info("Alien Evo Expansion initialized");
    }
}
