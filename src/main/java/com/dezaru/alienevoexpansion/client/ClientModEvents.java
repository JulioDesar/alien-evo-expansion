package com.dezaru.alienevoexpansion.client;

import com.dezaru.alienevoexpansion.AlienEvoExpansion;
import com.dezaru.alienevoexpansion.registry.ModItems;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.RegisterColorHandlersEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AlienEvoExpansion.MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public final class ClientModEvents
{
    private static final int STABILIZER_RED_LIGHT = 0xFF4668;
    private static final int STABILIZER_RED = 0xE3003E;
    private static final int STABILIZER_RED_DARK = 0xBD0034;
    private static final int STABILIZER_RED_SHADOW = 0x8E0028;

    private ClientModEvents()
    {
    }

    @SubscribeEvent
    public static void registerItemColors(RegisterColorHandlersEvent.Item event)
    {
        event.register((stack, tintIndex) -> switch (tintIndex)
        {
            case 1 -> STABILIZER_RED_LIGHT;
            case 2 -> STABILIZER_RED;
            case 3 -> STABILIZER_RED_DARK;
            case 4 -> STABILIZER_RED_SHADOW;
            default -> -1;
        }, ModItems.ALBEDO_STABILIZER.get());
    }
}
