if (!String.format) {
    String.format = function(format) {
      var args = Array.prototype.slice.call(arguments, 1);
      return format.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number] 
          : match
        ;
      });
    };
}
new Vue({
    el: '#app',
    data: {
        //salud
        saludJugador: 100,
        saludMonstruo: 100,
        //
        hayUnaPartidaEnJuego: false,
        turnos: [], //es para registrar los eventos de la partida
        esJugador: false,

        //rango ataques
        rangoAtaque: [3, 10],
        rangoAtaqueDelMonstruo: [5, 12],

        //rango ataques especiales
        rangoAtaqueEspecial: [10, 20],
        rangoAtaqueEspecialDelMonstruo: [10, 20],

        //rango curacion
        rangoCurar: [3, 10],
        rangoCurarDelMonstruo: [5, 12],
        CIEN: 100,
        CERO: 0,
        UNO: 1,
        NULL: null,
        ganador: null,
        JUGADOR: 'JUGADOR',
        MONSTRUO: 'MONSTRUO',
        TEXT_LOG_ATAQUE: 'EL {0} GOLPEA AL {1} POR {2}',
        TEXT_LOG_ATAQUE_ESPECIAL: 'EL {0} GOLPEA DURAMENTE AL {1} POR {2}',
        TEXT_LOG_CURAR: 'EL {0} SE CURA POR {1}',
        TEXT_LOG_RENDIRSE: 'EL {0} SE RINDIÓ',
        TEXT_LOG_GANA: 'GANA EL {0}',
        COLOR_LOG: {
            ATAQUE: '#ff7367',
            ATAQUE_ESPECIAL: '#ffaf4f',
            CURAR: '#76ff7e',
            RENDIRSE: '#ffffff',
            GANA: '#76ff7e',
        }
    },
    methods: {
        getTextLogAtaque(danio){
            return String.format(
                this.TEXT_LOG_ATAQUE, 
                (this.esJugador  ? this.JUGADOR : this.MONSTRUO),  
                (!this.esJugador ? this.JUGADOR : this.MONSTRUO),
                danio
            );
        },
        getTextLogAtaqueEspecial(danio){
            return String.format(
                this.TEXT_LOG_ATAQUE_ESPECIAL, 
                (this.esJugador ? this.JUGADOR : this.MONSTRUO),  
                (!this.esJugador ? this.JUGADOR : this.MONSTRUO),
                danio
            );
        },
        getTextLogCurar(danio){
            return String.format(
                this.TEXT_LOG_CURAR, 
                (this.esJugador ? this.JUGADOR : this.MONSTRUO),  
                danio
            );
        },
        getTextLogRendirse(jugador){
            return String.format(
                this.TEXT_LOG_RENDIRSE, 
                jugador
            );
        },
        getTextLogGana(jugador){
            return String.format(
                this.TEXT_LOG_GANA, 
                jugador
            );
        },
        getSalud(salud) {
            return `${salud}%`;
        },
        empezarPartida: function () {

            this.hayUnaPartidaEnJuego = true;
            this.turnos = [];
            this.saludJugador = this.CIEN;
            this.saludMonstruo = this.CIEN;
            this.ganador = this.NULL;
            this.esJugador = true;

        },
        atacar: function() {
        
            var danio;
            var salud;

            if(this.esJugador){
                danio = this.calcularHeridas(this.rangoAtaque);
                salud = this.calcularSalud(-danio, this.saludJugador);
                this.saludMonstruo = salud;
            }else{
                danio = this.calcularHeridas(this.rangoAtaqueDelMonstruo);
                salud = this.calcularSalud(-danio, this.saludMonstruo);
                this.saludJugador = salud;
            }

            var log = this.getTextLogAtaque(danio);
            this.registrarEvento({text: log, color: this.COLOR_LOG.ATAQUE});
            this.verificarGanador();
            this.cambiarTurno();

            
        },
        calcularSalud(danio, salud){
            
            if((salud + danio) <= this.CERO){
                salud = this.CERO;
            }else if((salud + danio) >= this.CIEN){
                salud = this.CIEN;
            }else{
                salud += danio;
            }

            return salud;

        },
        ataqueEspecial: function () {

            var danio;

            if(this.esJugador){
                danio = this.calcularHeridas(this.rangoAtaqueEspecial);
                salud = this.calcularSalud(-danio, this.saludJugador);
                this.saludMonstruo = salud;
            }else{
                danio = this.calcularHeridas(this.rangoAtaqueEspecialDelMonstruo);
                salud = this.calcularSalud(-danio, this.saludMonstruo);
                this.saludJugador = salud;
            }

            var log = this.getTextLogAtaqueEspecial(danio);
            this.registrarEvento({text: log, color: this.COLOR_LOG.ATAQUE_ESPECIAL });
            this.verificarGanador();
            this.cambiarTurno();

        },
        curar: function () {

            var danio;
            var salud;

            if(this.esJugador){
                danio = this.calcularHeridas(this.rangoCurar);
                salud = this.calcularSalud(danio, this.saludJugador);
                this.saludJugador = salud;
            }else{
                danio = this.calcularHeridas(this.rangoCurarDelMonstruo);
                salud = this.calcularSalud(danio, this.saludMonstruo);
                this.saludMonstruo = salud;
            }

            var log = this.getTextLogCurar(danio);
            this.registrarEvento({text: log, color: this.COLOR_LOG.CURAR });
            this.cambiarTurno();

        },
        registrarEvento(evento) {
            this.turnos.unshift(evento);
        },
        terminarPartida: function () {
            
            var log;

            if(this.esJugador){
                this.saludJugador = this.CERO;
                log = this.getTextLogRendirse(this.JUGADOR);
            }else{
                this.saludMonstruo = this.CERO;
                log = this.getTextLogRendirse(this.MONSTRUO);
            } 

            this.registrarEvento({text:log, color: this.COLOR_LOG.RENDIRSE });
            
            this.verificarGanador();

        },
        ataqueDelMonstruo: function () {

        },
        calcularHeridas: function (rango) {
            
            if(Array.isArray(rango) ){
                
                if(rango.length === 2){

                    var min = rango[0];
                    var max = rango[1];

                    var danio = Math.max( Math.floor( (Math.random() * max) + this.UNO ), min );

                    return danio;

                }else{

                    throw("Tamaño parametro rango invalido");

                }

            }else{

                throw("Parametro rango no es un array");

            }
            
        },
        verificarGanador: function () {

            if(this.saludMonstruo <= this.CERO){
                this.ganador = this.JUGADOR;
            }else if(this.saludJugador <= this.CERO){
                this.ganador = this.MONSTRUO;
            }

            if(this.ganador !== null){
                var log = this.getTextLogGana(this.ganador);
                this.registrarEvento({text: log, color: this.COLOR_LOG.GANA });
                this.finalizar();
            }

        },
        cssEvento(turno) {
            //Este return de un objeto es prque vue asi lo requiere, pero ponerlo acá queda mucho mas entendible en el codigo HTML.
            return {
                'player-turno': turno.esJugador,
                'monster-turno': !turno.esJugador
            }
        },
        cambiarTurno(){
            this.esJugador = !this.esJugador;
        },
        finalizar(){
            this.hayUnaPartidaEnJuego = false;
        },
    }
});