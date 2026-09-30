package com.dezaru.alienevoexpansion.registry;

import com.dezaru.alienevoexpansion.AlienEvoExpansion;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public final class ModItems
{
    private static final DeferredRegister<Item> ITEMS = DeferredRegister.create(
            ForgeRegistries.ITEMS,
            AlienEvoExpansion.MOD_ID
    );

    public static final RegistryObject<Item> ALBEDO_STABILIZER = ITEMS.register(
            "albedo_stabilizer",
            () -> new Item(new Item.Properties().stacksTo(1).rarity(Rarity.EPIC).fireResistant())
    );

    private ModItems()
    {
    }

    public static void register(IEventBus modEventBus)
    {
        ITEMS.register(modEventBus);
    }
}
