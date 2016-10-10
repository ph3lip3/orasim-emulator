import { SqlParser } from '../sql-parser/sql.parser'
import { Crc32 } from '../crypt/crc32'
import { Hash } from '../crypt/hash'
import { DbBufferCache } from '../oracle-instance/db.buffer.cache'
import { DataFiles } from '../oracle-database/data.files'
import { SharedPool } from '../oracle-instance/shared.pool'
import { SqlConsole } from '../sql-console/sql.console'
import { SqlConsoleMessage } from '../sql-console/sql.console.message'
import { SqlConsoleMsgError } from '../sql-console/sql.console.msg.error'
import { SqlConsoleMsgInfo } from '../sql-console/sql.console.msg.info'
import { ServerProcess } from '../process/server.process'
import { UserProcess } from '../process/user.process'

export class Animation {
    private delay: number

    constructor() {
        //miliseconds
        this.delay = 1000
    }

    start(sqlParser: SqlParser) {
        //if here query was parsed successfully       
        if (sqlParser.getQueryTokenId() == "SELECT") {
            this.selectAnimation(sqlParser)
        }
    }

    // animate source to dest within delay
    moveTo(sourceElem: HTMLElement, destElem: HTMLElement, delay: number): void{
        let x: number
        let y: number

        x = $(destElem).offset().top - $(sourceElem).offset().top +  $(sourceElem).position().top
        y = ($(destElem).offset().left - $(sourceElem).offset().left) +  $(sourceElem).position().left
        
        $(sourceElem).animate( { top: x, left: y },        
                               { duration: delay*2,
                                 complete: () => null })        
    }

    private selectAnimation(sqlParser: SqlParser): void {
        let query: string = sqlParser.getQuery()
        let hash: Hash = new Crc32(query)

        this.sendDataFromUserProcessToServerProcess()
        .then((res) => {
            return this.serverProcessDoSelect(hash)
        })
    }

    private sendDataFromUserProcessToServerProcess(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            //animate user process sending 2 server process            
            $('.arrow.from-userp-2-serverp').show()
            $('.arrow.from-userp-2-serverp').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2).wait().hide()
            $('#server-process').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)
            $('#user-process').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)
            $('#user img').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)
            setTimeout(() => {
                resolve(0)
            }, this.delay * 2 * 2);
        })
    }

    private serverProcessDoSelect(hash: Hash): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            let animationTime = 0;
            let dataFiles: DataFiles = Orasim.getOracleDatabase().getDataFiles()
            let sharedPool: SharedPool = Orasim.getOracleInstance().getSga().getSharedPool()
            let dbBufferCache: DbBufferCache = Orasim.getOracleInstance().getSga().getDbBufferCache()
            let sqlConsole: SqlConsole = Orasim.getSqlConsole()
            let serverProcess: ServerProcess = Orasim.getServerProcess()
            let userProcess: UserProcess = Orasim.getUserProcess()

            //finding hash into sharedPool
            if (sharedPool.findHash(hash)) {

                //hash found, server process getting data directly from dbBufferCache
                //let memoryLocation = dbBufferCache.getMemoryLocation(hashIndex)
                console.log("hash encontrado")
                let memLocation = sharedPool.getMemoryLocation(hash)
                console.log('hashIndex: '+memLocation)

                $('#server-process').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)
                $('#db-buffer-cache').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)
                
                // animacao pegando dados do dbBufferCache
                let blockHtml = serverProcess.getNewBlockFromDbBufferCache( dbBufferCache, this.delay)
                serverProcess.getBlockFromDbBufferCache(blockHtml, dbBufferCache, this.delay)

                // animacao enviando dados para userProcess
                serverProcess.sendDataToUserProcess(blockHtml, userProcess, this.delay)

                setTimeout(() => {
                    blockHtml.remove()
                    resolve(0) 
                }, this.delay * 6);
                //animationTime = this.delay * 2;

            } else {

                //hash not found, we need 2 get data from database first, and save it into dbBufferCache
                sqlConsole.addMsg(new SqlConsoleMsgInfo("ServerProcess nao encontrou o hash na SharedPool"))
                sqlConsole.addMsg(new SqlConsoleMsgInfo("ServerProcess criando hash da user query"))

                // animacao fade server process e shared pool
                $('#server-process').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)
                $('#shared-pool').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)                
                $('#data-files').repeat().fadeTo(this.delay, 0.1).fadeTo(this.delay, 1).until(2)

                //adicionando hash na shared pool, adicionando dados no dbBufferCache
                sharedPool.addHash(hash)                
                let memLocation = sharedPool.getMemoryLocation(hash)
                dbBufferCache.setMemoryLocationUsed(memLocation)

                // animacao requisitando dados do dataFiles
                // animacao gravando dados no dbBufferCache
                // animacao pegando dados do dbBufferCache
                // animacao enviando dados para userProcess
                let blockHtml = serverProcess.getBlockFromDatFiles(dataFiles, this.delay)
                serverProcess.storeBlockInDbBufferCache(blockHtml, dbBufferCache, memLocation, this.delay)
                serverProcess.getBlockFromDbBufferCache(blockHtml, dbBufferCache, this.delay)
                serverProcess.sendDataToUserProcess(blockHtml, userProcess, this.delay)
                
                setTimeout(() => {                     
                    $(blockHtml).remove()
                    resolve(0) 
                }, this.delay * 8);
                //animationTime = this.delay * 8;
            }          
            //setTimeout(() => { resolve(0); }, animationTime);  
        })
    }
}