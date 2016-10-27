import { SqlConsoleMessage } from './sql.console.message'
/**
 * SqlConsoleMsgError
 * Classe responsavel por especializar mensagens de erro
 * do console da aplicacao
 */
export class SqlConsoleMsgError extends SqlConsoleMessage{
    constructor(msg: string){
        super('error', msg)
    }
}