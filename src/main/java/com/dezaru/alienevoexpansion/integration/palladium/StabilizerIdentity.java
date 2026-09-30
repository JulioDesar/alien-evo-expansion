package com.dezaru.alienevoexpansion.integration.palladium;

import com.dezaru.alienevoexpansion.AlienEvoExpansion;
import net.minecraft.world.entity.Entity;
import net.threetag.palladium.util.property.EntityPropertyHandler;
import net.threetag.palladium.util.property.PalladiumProperty;

/** Reads the Palladium watch identity that the stabilizer scripts assign. */
public final class StabilizerIdentity
{
    private static final String WATCH_PROPERTY = "watch";
    private static final String WATCH_NAMESPACE_PROPERTY = "watch_namespace";
    // DNA instability shares the namespace, so the watch type tells the two states apart.
    private static final String STABILIZER_WATCH = "omniverse";

    private StabilizerIdentity()
    {
    }

    public static boolean isWornBy(Entity entity)
    {
        return EntityPropertyHandler.getHandler(entity).map(handler ->
                STABILIZER_WATCH.equals(get(handler, WATCH_PROPERTY))
                        && AlienEvoExpansion.MOD_ID.equals(get(handler, WATCH_NAMESPACE_PROPERTY)))
                .orElse(false);
    }

    private static Object get(EntityPropertyHandler handler, String name)
    {
        PalladiumProperty<?> property = handler.getPropertyByName(name);
        return property == null ? null : handler.get(property);
    }
}
