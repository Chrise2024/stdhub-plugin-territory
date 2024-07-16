import { Command } from 'stdhub-plugin-api';
import { ChunkManager } from "../chunkLand";
import { Player } from "@minecraft/server";


export const cmdConfigTerritory = new Command().addHandler(
    [
        'set',
        ['ExplosionProtection','playerBlockUse','playerBlockBreak'],
        { type:'boolean',displayName:'status'}
    ] as const,
    (player,[,entry,stauts])=>{
        if (player instanceof Player){
            configTerritory(player,entry,stauts);
        }
        else{
            throw new Error('player is not instance of Player');
        }
    }
);

async function configTerritory(player:Player,entry:string,status:boolean){
    await ChunkManager.config(player.name,entry,status);
}