import { Animation } from './animation'
import { DbBufferCache } from '../oracle-instance/db.buffer.cache'
import { DataFiles } from '../oracle-database/data.files'
import { SharedPool } from '../oracle-instance/shared.pool'
import { SqlConsole } from '../sql-console/sql.console'
import { SqlConsoleMessage } from '../sql-console/sql.console.message'
import { SqlConsoleMsgError } from '../sql-console/sql.console.msg.error'
import { SqlConsoleMsgInfo } from '../sql-console/sql.console.msg.info'
import { ServerProcess } from '../process/server.process'
import { UserProcess } from '../process/user.process'

/**
 * Classe responsavel por implementar animações 
 * relacionadas ao select
 * @attribute isHashFound Caso o hash seja encontrado na shared-pool este atributo é marcado como true, caso contrário, false
 * @attribute animHashNotFoundDelay Delay da animacao do hash nao encontrado na shared-pool
 * @attribute animHashFoundDelay Delay da anima
 * cao do hash encontrado na shared-pool
 */
export class AnimationSelect extends Animation{
    private isHashFound: boolean
    private animHashNotFoundDelay: number
    private animHashFoundDelay: number
    private animUserProcessDelay: number

    constructor(isHashFound: boolean){
        super()
        this.buildAnimSelect(isHashFound)       
    }

    buildAnimSelect(isHashFound: boolean): void{
        this.isHashFound =  isHashFound
        this.animUserProcessDelay = super.getDelay() * 15
        this.animHashNotFoundDelay = super.getDelay() * 12
        this.animHashFoundDelay = super.getDelay() * 8
    }

    start(): void{        
        // setando estado de inicio da animacao
        let userProcess: UserProcess = Orasim.getUserProcess()
        Orasim.getAnimation().setAnimating(true)
        
        // executando animacoes dentro de promises permitindo execucao sincrona entre animacoes        
        // setando estado de termino da animacao
        //new Promise<number>((resolve, reject) => {            
        
        //     setTimeout(() => { resolve(0) }, this.animUserProcessDelay)
        // })
        userProcess.animateSendDataToServerProcess(this.animUserProcessDelay)
        .then((res) => {
            console.log('animateSelect')
            //breakpoint
            return this.animateSelect()
        })
        .then((res) => {
            console.log('setAnimating(false)')
            return Orasim.getAnimation().setAnimating(false)            
        })
    }

    private animateSelect(): Promise<number> {
        return new Promise<number>((resolve, reject) => {            
                        
            let animationTime = 0

            // rodar animacao especifica se o hash foi encontrado 
            // na shared-pool ou não             
            if (this.isHashFound) {
                this.animateHashFound()
                animationTime = this.animHashFoundDelay
            } else {
                this.animateHashNotFound()
                animationTime =  this.animHashNotFoundDelay
            }

            setTimeout(() => { resolve(0) }, animationTime);
        })
    }

    animateHashNotFound(): Promise<number>{
        return new Promise<number>((resolve, reject) => {
            let sharedPool: SharedPool = Orasim.getOracleInstance().getSga().getSharedPool()
            let dataFiles: DataFiles = Orasim.getOracleDatabase().getDataFiles()            
            let dbBufferCache: DbBufferCache = Orasim.getOracleInstance().getSga().getDbBufferCache()
            let sqlConsole: SqlConsole = Orasim.getSqlConsole()
            let serverProcess: ServerProcess = Orasim.getServerProcess()
            let userProcess: UserProcess = Orasim.getUserProcess()

            // hash nao encontrado
            sqlConsole.addMsg(new SqlConsoleMsgInfo("ServerProcess nao encontrou o hash na SharedPool"))
            sqlConsole.addMsg(new SqlConsoleMsgInfo("ServerProcess criando hash da user query"))

            // animacao adicionando hash na shared pool
            // pegando a area de memoria do ultimo dado adicionado no db-buffer-cache            
            sharedPool.animateAddHash()               
            let memLocation = sharedPool.getLastMemoryLocation()
            
            // animacao requisitando dados do dataFiles
            // animacao gravando dados no dbBufferCache
            // animacao pegando dados do dbBufferCache
            // animacao enviando dados para userProcess
            let blockHtml = serverProcess.animateGetBlockFromDataFiles(dataFiles, this.animHashNotFoundDelay*0.25)
            serverProcess.animateStoreBlockInDbBufferCache(blockHtml, dbBufferCache, memLocation, this.animHashNotFoundDelay*0.25)
            //super.sleep(5000)
            serverProcess.animateGetBlockFromDbBufferCache(blockHtml, dbBufferCache, this.animHashNotFoundDelay*0.25)
            serverProcess.animateSendBlockToUserProcess(blockHtml, userProcess, this.animHashNotFoundDelay*0.25)
            
            setTimeout(() => {                     
                $(blockHtml).remove()
                resolve(0) 
            }, this.animHashNotFoundDelay)
        })//end promise
    }    

    animateHashFound(): Promise<number>{
        return new Promise<number>((resolve, reject) => {
            let sharedPool: SharedPool = Orasim.getOracleInstance().getSga().getSharedPool()
            let dataFiles: DataFiles = Orasim.getOracleDatabase().getDataFiles()            
            let dbBufferCache: DbBufferCache = Orasim.getOracleInstance().getSga().getDbBufferCache()
            let sqlConsole: SqlConsole = Orasim.getSqlConsole()
            let serverProcess: ServerProcess = Orasim.getServerProcess()
            let userProcess: UserProcess = Orasim.getUserProcess()

            //hash found, server process getting data directly from dbBufferCache
            //let memoryLocation = dbBufferCache.getMemoryLocation(hashIndex)
            //console.log("hash encontrado")
            
            // console.log('hashIndex: '+memLocation)
            // $('#server-process').repeat().fadeTo(super.getDelay(), 0.1).fadeTo(super.getDelay(), 1).until(2)
            // $('#db-buffer-cache').repeat().fadeTo(super.getDelay(), 0.1).fadeTo(super.getDelay(), 1).until(2)
            
            // pegando localizacao do bloco 
            let memLocation = sharedPool.getLastMemoryLocation()

            // animacao pegando dados do dbBufferCache
            // animacao enviando dados para userProcess
            let blockHtml = serverProcess.animateGetNewBlockFromDbBufferCache( dbBufferCache, memLocation, this.animHashFoundDelay*0.5)
            serverProcess.animateSendBlockToUserProcess(blockHtml, userProcess, this.animHashFoundDelay*0.5)
            //serverProcess.animateGetBlockFromDbBufferCache(blockHtml, dbBufferCache, super.getDelay())
            
            setTimeout(() => {
                blockHtml.remove()
                resolve(0) 
            }, this.animHashFoundDelay);
        })//end promise
    }
}