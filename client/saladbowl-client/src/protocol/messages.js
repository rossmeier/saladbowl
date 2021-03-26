import {mapEnum,mapUnion,BareUInt,BareInt,BareU8,BareU16,BareU32,BareU64,BareI8,BareI16,BareI32,BareI64,BareF32,BareF64,BareBool,BareEnum,BareString,BareDataFixed,BareData,BareVoid,BareOptional,BareArrayFixed,BareArray,BareMap,BareUnion,BareStruct}
	from './bare.js';
class PlayerStatus extends BareEnum {static keys = mapEnum(this, {0:'Active',1:'Passive',2:'Disconnected'});}
class Team extends BareEnum {static keys = mapEnum(this, {0:'Red',1:'Blue'});}
class Player extends BareStruct {static entries = [['name',BareString],['team',Team],['id',BareInt],['status',PlayerStatus],['score',BareInt],['isOwner',BareBool]];}
class GameConfig extends BareStruct {static entries = [['maxWords',BareInt],['suggestionTime',BareInt],['rounds',BareInt]];}
class ClientHello extends BareStruct {static entries = [['name',BareString],['token',class extends BareOptional {static type = BareString;}]];}
class StartGame extends BareVoid {}
class UpdatePlayerInfo extends BareStruct {static entries = [['name',class extends BareOptional {static type = BareString;}],['team',class extends BareOptional {static type = Team;}]];}
class WordSuccess extends BareStruct {static entries = [['token',BareString]];}
class WordSuggestions extends BareArray {static type = class extends BareStruct {static entries = [['word',BareString]];};}
class ClientToServer extends BareUnion {static indices = mapUnion(this, {0:ClientHello,1:StartGame,2:UpdatePlayerInfo,3:WordSuggestions,4:WordSuccess});}
class BowlUpdate extends BareStruct {static entries = [['total',BareInt],['current',BareInt]];}
class Error extends BareStruct {static entries = [['message',BareString]];}
class GameStatus extends BareEnum {static keys = mapEnum(this, {0:'Lobby',1:'Suggestions',2:'Playing'});}
class PlayerList extends BareArray {static type = Player;}
class ServerHello extends BareStruct {static entries = [['token',BareString],['playerID',BareInt]];}
class WordNew extends BareStruct {static entries = [['word',BareString],['timeLeft',BareF64],['token',BareString]];}
class ServerToClient extends BareUnion {static indices = mapUnion(this, {0:BowlUpdate,1:Error,2:GameStatus,3:PlayerList,4:ServerHello,5:WordNew});}
export {PlayerStatus,Team,Player,GameConfig,ClientHello,StartGame,UpdatePlayerInfo,WordSuccess,WordSuggestions,ClientToServer,BowlUpdate,Error,GameStatus,PlayerList,ServerHello,WordNew,ServerToClient};
export default {PlayerStatus:PlayerStatus,Team:Team,Player:Player,GameConfig:GameConfig,ClientHello:ClientHello,StartGame:StartGame,UpdatePlayerInfo:UpdatePlayerInfo,WordSuccess:WordSuccess,WordSuggestions:WordSuggestions,ClientToServer:ClientToServer,BowlUpdate:BowlUpdate,Error:Error,GameStatus:GameStatus,PlayerList:PlayerList,ServerHello:ServerHello,WordNew:WordNew,ServerToClient:ServerToClient};
