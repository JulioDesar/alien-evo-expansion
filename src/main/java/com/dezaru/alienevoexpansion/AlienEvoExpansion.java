package com.dezaru.alienevoexpansion;

import com.dezaru.alienevoexpansion.registry.ModItems;
import com.mojang.logging.LogUtils;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import net.minecraftforge.fml.common.Mod;
import org.slf4j.Logger;

@Mod(AlienEvoExpansion.MOD_ID)
public final class AlienEvoExpansion
{
    public static final String MOD_ID = "alienevoexpansion";
    private static final Logger LOGGER = LogUtils.getLogger();

    public AlienEvoExpansion()
    {
        IEventBus modEventBus = FMLJavaModLoadingContext.get().getModEventBus();
        ModItems.register(modEventBus);
        LOGGER.info("Alien Evo Expansion initialized");
    }
}
