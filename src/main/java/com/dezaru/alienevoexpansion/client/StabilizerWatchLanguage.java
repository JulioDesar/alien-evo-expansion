package com.dezaru.alienevoexpansion.client;

import com.dezaru.alienevoexpansion.integration.palladium.StabilizerIdentity;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.locale.Language;
import net.minecraft.network.chat.FormattedText;
import net.minecraft.util.FormattedCharSequence;

/**
 * The stabilizer must keep Alien Evolution's "omniverse" watch type for its UI and wheel logic,
 * so only the watch title shown to the local player is renamed.
 */
final class StabilizerWatchLanguage extends Language
{
    private static final String OMNIVERSE_WATCH_KEY = "watch_type.alienevo.omniverse";
    private static final String STABILIZER_NAME_KEY = "item.alienevoexpansion.albedo_stabilizer";

    private final Language delegate;

    private StabilizerWatchLanguage(Language delegate)
    {
        this.delegate = delegate;
    }

    /** Wraps the active language again after every resource reload replaces it. */
    static void install()
    {
        Language current = Language.getInstance();
        if (!(current instanceof StabilizerWatchLanguage))
        {
            Language.inject(new StabilizerWatchLanguage(current));
        }
    }

    @Override
    public String getOrDefault(String key, String defaultValue)
    {
        if (OMNIVERSE_WATCH_KEY.equals(key))
        {
            LocalPlayer player = Minecraft.getInstance().player;
            if (player != null && StabilizerIdentity.isWornBy(player))
            {
                return delegate.getOrDefault(STABILIZER_NAME_KEY, defaultValue);
            }
        }
        return delegate.getOrDefault(key, defaultValue);
    }

    @Override
    public boolean has(String key)
    {
        return delegate.has(key);
    }

    @Override
    public boolean isDefaultRightToLeft()
    {
        return delegate.isDefaultRightToLeft();
    }

    @Override
    public FormattedCharSequence getVisualOrder(FormattedText text)
    {
        return delegate.getVisualOrder(text);
    }
}
