
export class Arrow{
    private element: HTMLElement
    private animContainer: HTMLElement
    private size: number
    private top: number
    private left: number    
    private duration: number

    constructor(type: string, top: number, left: number, size: number, duration: number){
        this.buildArrow(type, top, left, size, duration)
    }

    buildArrow(type: string, top: number, left: number, size: number, duration: number){
        this.element = $("<div class='"+type+"-arrow'>")[0]
        this.animContainer = $("#animation-container")[0]
        this.size = size
        this.top = top
        this.left = left
        this.duration = duration
    }

    moveToRight(callback){
        // Adicionando seta em seu elemento pai        
        let $arrow = $(this.element).css({
            "left": this.left + "px",
            "top": this.top + "px"
        });
        $(this.animContainer).append($arrow);
        
        // Divide o tempo total da animação para cada parte
        var eachTimePart = this.duration / 2;
        console.log('moveToRight: ', this.duration)
        // Iniciando animação da seta
        $arrow.animate({
            width: this.size + 'px'
        }, {
            duration: eachTimePart,
            // Iniciando segunda parte da animação da seta
            complete: function () {
                //console.log('moveToRight: ', 'segunda parte')
                $arrow.addClass("end")
                // Removendo seta do DOM
                $arrow.animate({
                    opacity: 0
                }, {
                    duration: eachTimePart
                });
                setTimeout(function () { 
                    $arrow.remove()
                    callback()                     
                }, eachTimePart);
            }
        });
    }
}