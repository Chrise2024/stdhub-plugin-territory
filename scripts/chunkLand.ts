import { world } from "@minecraft/server";
import { api } from "./main";

export const propertiesList = [
    'ExplosionProtection',
    'playerBlockUse',
    'playerBlockBreak',
    'forceLoad'
];

export interface chunkPosSchema{
    x:number,
    z:number,
    dim:string
}

export interface propertiesSchema extends Object{
    ExplosionProtection:boolean,
    playerBlockUseProtection:boolean,
    playerBlockBreakProtection:boolean,
    forceLoad:boolean
}

export interface saveEntrySchema extends Object{
    chunks:Array<chunkPosSchema>,
    properties:propertiesSchema
}

export interface claimedChunkSchema extends Object{
    position:chunkPosSchema,
    ownerXuid:string
}

export const defaultProperties:propertiesSchema = {
    ExplosionProtection:true,
    playerBlockUseProtection:true,
    playerBlockBreakProtection:true,
    forceLoad:true
}

export const defaultSave:saveEntrySchema = {
    chunks:[],
    properties:defaultProperties
}

export const defaultClaimedChunk = {
    position:{x:0,z:0,dim:'overworld'},
    ownerXuid:''
}

export class ChunkLand {
    public constructor(chunkPos:chunkPosSchema){
        this.ChunkPositionX = chunkPos.x;
        this.ChunkPositionZ = chunkPos.z;
        this.ChunkDimension = chunkPos.dim;
    }
    private ChunkPositionX:number = 0;
    private ChunkPositionZ:number = 0;
    private ChunkDimension:string = '';
    static transformChunkPosition(rawPos:chunkPosSchema):chunkPosSchema {
        return {x:rawPos.x >> 4,z:rawPos.z >> 4 ,dim:rawPos.dim}
    }
    public getChunkArea():object{
        return {beginPosition:{x:this.ChunkPositionX*16-16,z:this.ChunkPositionZ*16-16},endPosition:{x:this.ChunkPositionX*16,z:this.ChunkPositionZ*16}}
    }
    public getChunkPosition():chunkPosSchema{
        return {x:this.ChunkPositionX,z:this.ChunkPositionZ, dim:this.ChunkDimension}
    }
}
var chunksMap:Map<string,saveEntrySchema> = new Map();
var ClaimedChunks:Array<claimedChunkSchema> = [];

export class ChunkManager{
    static async init(){
        console.log(1111);
        const datRaw = await api.readData('territory.json');
        chunksMap = new Map(Object.entries(JSON.parse(datRaw)));
        let claimed:Array<claimedChunkSchema> = [];
        for (let i of chunksMap.keys()){
            let chunkPosList = chunksMap.get(i)?.chunks || [];
            let newList:Array<claimedChunkSchema> = [];
            for (let j in chunkPosList){
                newList.push({position:chunkPosList[j],ownerXuid:i});
            }
            claimed = claimed.concat(newList);
        }
        ClaimedChunks = claimed;
        return new ChunkManager();
    }
    static isClaimed(chunk:ChunkLand){
        const curPos:chunkPosSchema = chunk.getChunkPosition();
        ClaimedChunks.forEach((cChunk:claimedChunkSchema)=>{
            if (cChunk.position.x === curPos.x && cChunk.position.z === curPos.z && cChunk.position.dim === curPos.dim){
                return true;
            }
        });
        return false;
    }
    static async push(ownerName:string,chunk:ChunkLand){
        const cPos = chunk.getChunkPosition();
        const Xuid:string = await api.getXuidByName(ownerName) || '';
        if (Xuid === ''){
            world.sendMessage(`§c玩家 ${ownerName} 不存在`);
            return false;
        }
        if (chunksMap.has(Xuid)){
            let index:number = -1;
            let curEntry = chunksMap.get(Xuid)?.chunks || []
            for (let i = 0;i < curEntry.length;i++){
                if (curEntry[i].x === cPos.x && curEntry[i].z === cPos.z && curEntry[i].dim === cPos.dim){
                    index = i;
                    break;
                }
            }
            if (index === -1){
                chunksMap.get(Xuid)?.chunks.push(cPos);
                ClaimedChunks.push({position:cPos,ownerXuid:Xuid});
                world.sendMessage(`§a玩家 ${ownerName} 获取了区块 ${cPos.x},${cPos.z},${cPos.dim}`);
                return true;
            }
            else{
                world.sendMessage(`§c玩家 ${ownerName} 已经拥有这个区块`);
                return false;
            }
        }
        else{
            chunksMap.set(Xuid,defaultSave);
            chunksMap.get(Xuid)?.chunks.push(chunk.getChunkPosition());
            world.sendMessage(`§a玩家 ${ownerName} 获取了区块 ${cPos.x},${cPos.z},${cPos.dim}`);
            return true;
        }
    }
    static async delete(ownerName:string,chunk:ChunkLand){
        let cPos = chunk.getChunkPosition();
        const Xuid:string = await api.getXuidByName(ownerName) || '';
        if (Xuid === ''){
            world.sendMessage(`§c玩家 ${ownerName} 不存在`);
            return false;
        }
        if (chunksMap.has(Xuid)){
            let index:number = -1;
            let curEntry = chunksMap.get(Xuid)?.chunks || [];
            for (let i = 0;i < curEntry.length;i++){
                if (curEntry[i].x === cPos.x && curEntry[i].z === cPos.z && curEntry[i].dim === cPos.dim){
                    index = i;
                    break;
                }
            }
            if (index === -1){
                chunksMap.get(Xuid)?.chunks.splice(index,1);
                world.sendMessage(`§a玩家 ${ownerName} 删除了区块 ${cPos.x},${cPos.z},${cPos.dim}`);
                let index1:number = -1;
                for (let i = 0;i < ClaimedChunks.length;i++){
                    if (ClaimedChunks[i].position.x === cPos.x && ClaimedChunks[i].position.z === cPos.z && ClaimedChunks[i].position.dim === cPos.dim){
                        index1 = i;
                        break;
                    }
                }
                ClaimedChunks.splice(index1,1);
                return true;
            }
            else{
                world.sendMessage(`§c玩家 ${ownerName} 没有这个区块`);
                return false;
            }
        }
        else{
            chunksMap.set(Xuid,defaultSave);
            world.sendMessage(`§c玩家 ${ownerName} 没有这个区块`);
            return false;
        }
    }

    static async getChunks(ownerName:string){
        const Xuid = await api.getXuidByName(ownerName) || '';
        if (Xuid === ''){
            world.sendMessage(`§c玩家 ${ownerName} 不存在`);
            return [];
        }
        else{
            return chunksMap.get(Xuid)?.chunks || [];
        }
    }
    static async hasChunk(ownerName:string,chunk:ChunkLand){
        const Xuid = await api.getXuidByName(ownerName) || '';
        if (Xuid === ''){
            world.sendMessage(`§c玩家 ${ownerName} 不存在`);
            return false;
        }
        else{
            const curPos = chunk.getChunkPosition();
            chunksMap.get(ownerName)?.chunks.forEach((value)=>{
                if (value.x === curPos.x && value.z === curPos.z && value.dim === curPos.dim){
                    return true;
                }
            });
        }
        return false;
    }
    static async getClaimedChunk(chunk:ChunkLand){
        const curPos:chunkPosSchema = chunk.getChunkPosition();
        for (let i in ClaimedChunks){
            if (ClaimedChunks[i].position.x === curPos.x && ClaimedChunks[i].position.z === curPos.z && ClaimedChunks[i].position.dim === curPos.dim){
                return ClaimedChunks[i];
            }
        }
        return defaultClaimedChunk;
    }
    static async getPropertiesByXuid(ownerXuid:string){
        const curEntry = chunksMap.get(ownerXuid) || defaultSave;
        return curEntry.properties;
    }
    static async save(){
        world.sendMessage('Saving');
        await api.writeData('territory.json',Object.fromEntries(chunksMap));
    }
    static async config(ownerName:string,entry:string,status:boolean) {
        const Xuid = await api.getXuidByName(ownerName) || '';
        if (Xuid === ''){
            world.sendMessage(`§c玩家 ${ownerName} 不存在`);
            return false;
        }
        else{
            const curEntry:saveEntrySchema = chunksMap.get(Xuid) || defaultSave;
            if (entry === 'ExplosionProtection'){
                curEntry.properties.ExplosionProtection = status;
                world.sendMessage(`§a玩家 ${ownerName} ${status?'开启':'关闭'}了爆炸保护`);
                return true;
            }
            else if (entry === 'playerBlockBreak'){
                curEntry.properties.playerBlockBreakProtection = status;
                world.sendMessage(`§a玩家 ${ownerName} ${status?'开启':'关闭'}了玩家破坏保护`);
                return true;
            }
            else if (entry === 'playerBlockUse'){
                curEntry.properties.playerBlockUseProtection = status;
                world.sendMessage(`§a玩家 ${ownerName} ${status?'开启':'关闭'}了玩家使用保护`);
                return true;
            }
            else if (entry === 'forceLoad'){
                curEntry.properties.forceLoad = status;
                world.sendMessage(`§a玩家 ${ownerName} ${status?'开启':'关闭'}了强制加载`);
                return true;
            }
            else {
                world.sendMessage(`§c配置项 ${entry} 不存在`);
                return false;
            }
        }
    }
}
/*
async function ExplosionCallback(event:ExplosionBeforeEvent){
    const curEntity = event.source;
    if (curEntity){
        const sourcePos = {x:curEntity.location.x,z:curEntity.location.z,dim:curEntity.dimension.id};
        const sourceChunk = new ChunkLand(ChunkLand.transformChunkPosition(sourcePos));
        const curOwnerXuid = (await ChunkManager.getClaimedChunk(sourceChunk)).ownerXuid;
        const curChunkProperties = await ChunkManager.getPropertiesByXuid(curOwnerXuid);
        event.cancel = curChunkProperties.ExplosionProtection;
    }
    else{
        event.cancel = false;
    }
}
async function playerBreakCallback(event:PlayerBreakBlockBeforeEvent){
    const curPlayer = event.player;
    const curPlayerXuid = await api.getXuidByName(curPlayer.name) || '';
    const isOP = event.player.isOp();
    if (curPlayerXuid !== ''){
        const curBlockPos = {x:event.block.location.x,z:event.block.location.z,dim:event.block.dimension.id};
        const curChunk = new ChunkLand(ChunkLand.transformChunkPosition(curBlockPos));
        const curOwnerXuid = (await ChunkManager.getClaimedChunk(curChunk)).ownerXuid;
        const curChunkProperties = await ChunkManager.getPropertiesByXuid(curOwnerXuid);
        const isOwner = curOwnerXuid === curPlayerXuid;
        event.cancel = !isOwner && !isOP && curChunkProperties.playerBlockBreakProtection;
        return;
    }
    else{
        event.cancel = false;
    }
}
async function playerUseCallback(event:PlayerInteractWithBlockBeforeEvent){
    const curPlayer = event.player;
    const curPlayerXuid = await api.getXuidByName(curPlayer.name) || '';
    const isOP = event.player.isOp();
    if (curPlayerXuid !== ''){
        const curBlockPos = {x:event.block.location.x,z:event.block.location.z,dim:event.block.dimension.id};
        const curChunk = new ChunkLand(ChunkLand.transformChunkPosition(curBlockPos));
        const curOwnerXuid = (await ChunkManager.getClaimedChunk(curChunk)).ownerXuid;
        const curChunkProperties = await ChunkManager.getPropertiesByXuid(curOwnerXuid);
        const isOwner = curOwnerXuid === curPlayerXuid;
        event.cancel = !isOwner && !isOP && curChunkProperties.playerBlockUseProtection;
        return;
    }
    else{
        event.cancel = false;
    }
}
*/