// Do not change this part - critical in plugin bundling
import { StdhubPluginApi } from 'stdhub-plugin-api';
import { Command } from 'stdhub-plugin-api';
import { ChatSendAfterEvent,world,system, Player, Block, PlayerBreakBlockBeforeEvent } from '@minecraft/server';
import { cmdClaimTerritory } from './commands/claim';
import { cmdConfigTerritory } from './commands/set';
import { ChunkManager } from './chunkLand';
export const pluginName = process.env.PLUGIN_NAME!;
export const api = new StdhubPluginApi(pluginName);

// Code below freely!
async function main() {
    const chunkManager:ChunkManager = await ChunkManager.init();
    api.registerCommand('test', cmdClaimTerritory,'');
    api.registerCommand('set', cmdConfigTerritory,'');
}

main();