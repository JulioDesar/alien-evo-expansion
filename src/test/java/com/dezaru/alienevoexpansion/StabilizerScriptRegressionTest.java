package com.dezaru.alienevoexpansion;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import dev.latvian.mods.rhino.Context;
import dev.latvian.mods.rhino.Scriptable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/** Runs script regression checks in KubeJS's actual JavaScript engine. */
public final class StabilizerScriptRegressionTest
{
    public static void main(String[] args) throws IOException
    {
        verifyExplicitCommandLists();
        Context context = Context.enter();
        Scriptable scope = context.initStandardObjects();
        context.evaluateString(scope, "var global = {}; var StartupEvents = { registry: function () {} };",
                "startup-stub", 1, null);
        Path script = Path.of("src/main/resources/addon/alienevoexpansion/kubejs_scripts/stabilizer.js");
        context.evaluateString(scope, Files.readString(script), script.toString(), 1, null);
        Path tests = Path.of("src/test/resources/stabilizer_regression.js");
        context.evaluateString(scope, Files.readString(tests), tests.toString(), 1, null);
        // Separate script scopes must communicate only through KubeJS's global object.
        for (String name : new String[]{"stabilizer", "dna_instability"})
        {
            Path controller = script.resolveSibling(name + ".js");
            context.evaluateString(scope, "(function () {" + Files.readString(controller) + "})();",
                    controller.toString(), 1, null);
        }
        Path lifecycle = tests.resolveSibling("albedo_colors_lifecycle.js");
        context.evaluateString(scope, Files.readString(lifecycle), lifecycle.toString(), 1, null);
        System.out.println("Stabilizer Rhino regression checks passed.");
    }

    private static void verifyExplicitCommandLists() throws IOException
    {
        Path powers = Path.of("src/main/resources/data/alienevoexpansion/palladium/powers");
        try (var paths = Files.list(powers))
        {
            for (Path path : paths.filter(file -> file.toString().endsWith(".json")).toList())
            {
                JsonObject power = JsonParser.parseString(Files.readString(path)).getAsJsonObject();
                JsonObject abilities = power.getAsJsonObject("abilities");
                if (abilities == null) continue;
                for (Map.Entry<String, JsonElement> entry : abilities.entrySet())
                {
                    JsonObject ability = entry.getValue().getAsJsonObject();
                    if (ability.has("type") && "palladium:command".equals(ability.get("type").getAsString())
                            && !ability.has("commands"))
                    {
                        throw new AssertionError(path + " / " + entry.getKey()
                                + " must explicitly set commands to avoid Palladium's repeating demo command");
                    }
                }
            }
        }
        String equipConditions = JsonParser.parseString(Files.readString(powers.resolve("albedo_stabilizer_item.json")))
                .getAsJsonObject().getAsJsonObject("abilities").getAsJsonObject("equip_stabilizer")
                .getAsJsonObject("conditions").getAsJsonArray("enabling").toString();
        if (!equipConditions.contains("{\"type\":\"palladium:has_power\",\"power\":\"alienevoexpansion:dna_instability\"}"))
        {
            throw new AssertionError("The stabilizer can only be equipped while DNA instability is active");
        }
        JsonObject autoRemoval = JsonParser.parseString(Files.readString(powers.resolve("stabilizer_quick_wheel.json")))
                .getAsJsonObject().getAsJsonObject("abilities").getAsJsonObject("remove_without_instability");
        if (autoRemoval == null || !autoRemoval.toString().contains("\"type\":\"palladium:not\"")
                || !autoRemoval.toString().contains("give @s alienevoexpansion:albedo_stabilizer"))
        {
            throw new AssertionError("Losing DNA instability must return the stabilizer to the player");
        }
    }
}
