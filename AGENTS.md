# Alien Evo Expansion Development Guidelines

These rules apply to every source file, resource, and generated asset in this repository.

## Language and naming

- Write code, identifiers, file names, comments, Javadocs, log messages, and developer documentation in English.
- Use `PascalCase` for types, `camelCase` for methods and variables, and `UPPER_SNAKE_CASE` for constants.
- Keep Java package names lowercase without separators. Use `lower_snake_case` for registry names, resource paths, and translation-key suffixes.
- Prefer clear domain names over abbreviations. Keep established proper names such as Nemetrix, Antitrix, Omnitrix, and Albedo unchanged.
- Keep `com.dezaru.alienevoexpansion` as the base Java package and `alienevoexpansion` as the namespace and mod ID.

## Localization

- Never hardcode player-facing text in Java. Use `Component.translatable(...)` and store the text in language JSON files.
- Treat `assets/alienevoexpansion/lang/en_us.json` as the canonical language file. Put Brazilian Portuguese translations in `pt_br.json` using the same keys.
- Use stable, descriptive keys in these forms:
  - `item.alienevoexpansion.<name>`
  - `block.alienevoexpansion.<name>`
  - `entity.alienevoexpansion.<name>`
  - `menu.alienevoexpansion.<screen>.<label>`
  - `tooltip.alienevoexpansion.<name>`
  - `message.alienevoexpansion.<name>`
  - `key.alienevoexpansion.<name>`
- Use translation arguments and placeholders instead of concatenating translated fragments.
- Keep server logs, exceptions, registry names, NBT keys, and network identifiers in English; they are technical values, not localized UI text.
- Forge metadata in `mods.toml` may remain in English when the field does not support normal Minecraft translation components.

## Project structure

Keep the entry point small. Add a package only when it has real code; do not create empty placeholder classes or packages.

```text
src/main/java/com/dezaru/alienevoexpansion/
|-- AlienEvoExpansion.java       Mod entry point and top-level registration
|-- registry/                    Forge deferred registers and registry holders
|-- content/                     Gameplay code grouped by feature
|   |-- nemetrix/
|   |-- antitrix/
|   `-- albedostabilizer/
|-- client/                      Screens, renderers, models, key mappings, client events
|-- config/                      Forge configuration definitions
|-- network/                     Payload registration and handlers
|-- integration/                 Adapters for dependency mods, one package per integration
|-- datagen/                     Data-generation providers
`-- util/                        Small, shared, stateless helpers only

src/main/resources/
|-- assets/alienevoexpansion/    Languages, models, textures, sounds, and shaders
|-- data/alienevoexpansion/      Recipes, loot tables, advancements, and tags
|-- META-INF/mods.toml           Forge metadata and dependency declarations
`-- pack.mcmeta                  Resource-pack metadata
```

Feature-specific behavior stays in its `content` feature package. Only shared registration, networking, configuration, client setup, or integrations belong in their top-level packages. Do not use `util` as a miscellaneous dumping ground.

## Programming practices

- Target Java 17, Minecraft 1.20.1, and the Forge version declared by Gradle.
- Give each class one clear responsibility and prefer the smallest implementation that solves the current feature.
- Use Forge lifecycle events and `DeferredRegister` for registries. Keep registration deterministic and centralized by registry type.
- Keep client-only classes under `client` and register them only on the client distribution. Common code must load safely on a dedicated server.
- Keep dependency-specific calls behind `integration` packages so Alien Evolution, Omnitrix Evolution, and Into the Omniverse compatibility remains easy to locate.
- Prefer data-driven recipes, loot tables, tags, advancements, and model definitions over equivalent hardcoded Java logic.
- Keep gameplay authority on the server. Validate packet input, permissions, entity state, ranges, and identifiers before changing game state.
- Avoid mutable global state, magic values, wildcard imports, duplicated registry strings, and catch-all exception handling.
- Extract a constant only when the value has domain meaning or is reused. Do not add speculative abstractions for possible future features.
- Preserve backward-compatible registry names and serialized data once released. If either must change, add an explicit migration plan.
- Add focused tests for isolated rules and calculations when practical. Do not require Minecraft to start for logic that can be tested independently.

## Change workflow

1. Inspect the existing implementation and dependency APIs before adding a new abstraction.
2. Implement one complete feature slice at a time with the smallest responsible change.
3. Add every new player-facing translation key to `en_us.json`; mirror it in `pt_br.json` when the Portuguese wording is available.
4. Run `gradlew.bat build` after source or resource changes.
5. Run `gradlew.bat runClient` for changes involving registration, mixins, rendering, screens, networking, or dependency integration.
6. Use data generators for generated resources and review their output before keeping it.

