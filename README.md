# territory

A plugin for providing territory function.

# Data

All the territory data is stored at `plugins/stdPlugin-territory/data/territory.json`.The file's format is as follows:

```json
{
    "Xuid": {
        "chunks": [
            {
                "x": 114,
                "z": 514,
                "dim": "minecraft:overworld"
            },
            {
                "x": 114,
                "z": 514,
                "dim": "minecraft:nether"
            },
            {
                "x": 114,
                "z": 514,
                "dim": "minecraft:the_end"
            }
        ],
        "properties": {
            "ExplosionProtection": true,
            "playerBlockUse": true,
            "playerBlockBreak": true,
            "forceLoad": true
        }
    }
}
```