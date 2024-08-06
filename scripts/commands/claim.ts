import {api} from "../main";
import { Command } from 'stdhub-plugin-api';
import { ChunkLand,ChunkManager,chunkPosSchema } from "../chunkLand";
import { Player,Dimension, world } from "@minecraft/server";

export const cmdClaimTerritory = new Command().addHandler(
    [
        'claim',
        'here',
    ] as const,
    (player)=>{
        if (player instanceof Player){
            CTHandleByRPos(player);
        }
        else{
            throw new Error('player is not instance of Player');
        }
    }
).addHandler(
    [
        'claim',
        { type:'integer',displayName:'territory position x'},
        { type:'integer',displayName:'territory position z'},
        { type:'string',displayName:'dimension id'},
    ] as const,
    (player,[,posX,posZ,dim])=>{
        if (player instanceof Player){
            CTHandleByFPos(player,{x:posX,z:posZ,dim});
        }
        else{
            throw new Error('player is not instance of Player');
        }
    }
)

async function CTHandleByRPos(player:Player){
    api.log('Claiming territory for player: ' + player.name);
    console.log(await api.getXuidByName("ChriseDai114514"));
    const chunkLand:ChunkLand = new ChunkLand(ChunkLand.transformChunkPosition({x:Math.floor(player.location.x),z:Math.floor(player.location.z),dim:player.dimension.id}));
    if (ChunkManager.isClaimed(chunkLand)){
        world.sendMessage('This territory is already claimed');
    }
    else{
        world.sendMessage('Constructed chunkLand');
        await ChunkManager.push(player.name,chunkLand);
        await ChunkManager.save();
    }
}

async function CTHandleByFPos(player:Player,position:chunkPosSchema){
    api.log('Claiming territory for player: ' + player.name);
    const chunkLand:ChunkLand = new ChunkLand(ChunkLand.transformChunkPosition(position));
    if (ChunkManager.isClaimed(chunkLand)){
        world.sendMessage('This territory is already claimed');
    }
    else{
        world.sendMessage('Constructed chunkLand');
        await ChunkManager.push(player.name,chunkLand);
        await ChunkManager.save();
    }
}