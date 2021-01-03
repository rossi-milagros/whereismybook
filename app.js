//INICIALIZACION
const express = require('express');
const jwt = require('jsonwebtoken');
const util = require('util');
const mysql = require('mysql');
const handlebars = require('handlebars');

const app = express();

//SETTINGS

//creo port por ternario
const port = process.env.PORT ? process.env.PORT : 3000;
app.use(express.json());

const conexion = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password:'',
    database:'where_is_my_book'
});

conexion.connect((error)=>{

    if (error) {
        throw error;
    }

    console.log('Conexion establecida con el servidor');
});
//permite el uso de asyn-await en la conexion mysql
const qy= util.promisify(conexion.query).bind(conexion);

//VARIABLES GLOBALES

//MIDDLEWARES

app.post('/libro', async (req, res) =>{

    try {

        if(!req.body.nombre || !req.body.categoria_id) {
            res.status(413).send("El nombre y la categoria son obligatorios")
        }

        //Hacemos comprobaciones en la BD
        let searchLibro = 'SELECT id FROM libros WHERE nombre = ?';
        //let searchPersona = 'SELECT nombre FROM personas WHERE id = ?';
        let searchCategoria = 'SELECT nombre FROM categorias WHERE id = ?';

        let resLibro = await qy(searchLibro, [req.body.nombre.toUpperCase()]);
        //let resPersona = await qy(searchPersona, [req.body.persona_id]);
        let resCategoria = await qy(searchCategoria, [req.body.categoria_id]);

        if(resCategoria.length > 0) {

            if (resLibro.length > 0) {
                res.status(413).send("El libro ya existe en la BD");
            }
            else {
                    
                let query = 'INSERT INTO libros (nombre,descripcion,categoria_id,persona_id) VALUES (?,?,?,?)';
                let respuesta = qy(query, [req.body.nombre.toUpperCase(),req.body.descripcion.toUpperCase(),req.body.categoria_id,req.body.persona_id]);

                res.status(200).send({"respuesta": respuesta});
                    
            }
        }
        else {
            res.status(413).send("La categoria indicada no existe en la BD");
        }
    }
    catch(ex) {
        console.log(ex);
        res.status(413).send({"Error": ex.message});
    }
});

app.get('/libro', async (req, res) => {

    try{
        const query = 'SELECT * FROM libros';
        const respuesta = await qy(query);

        res.status(200).send({"respuesta": respuesta});
    }
    catch(ex){
        console.log(ex);
        res.status(413).send({mensaje: ex.message});
    }
});

app.get('/libro/:id', async (req, res) => {

    try{

        if (!req.params.id) {
           res.status(413).send("Es necesario indicar el número ID"); 
        }
        else {
            const query = 'SELECT * FROM libros WHERE id = ?';
            const respuesta = await qy(query, [req.params.id]);

            if (respuesta.length > 0) {
                res.send({"respuesta": respuesta});
            }
            else {
                res.status(413).send("No hay un libro con el ID indicado");
            }
        }
    }

    catch(ex){
        console.log(ex);
        res.status(413).send({"Error": ex.message});
    }
});


app.put('/libro/:id', async (req,res) => {
    try {
       
        if (!req.body.descripcion) {
            res.status(413).send("No escribiste la descripcion del libro");
        }
        //Validamos que exista un libro con el ID solicitado 
        let query = 'SELECT * FROM libros WHERE id = ?';
        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            
            query = 'UPDATE libros SET descripcion = ? WHERE id = ?';
            respuesta = await qy(query, [req.body.descripcion.toUpperCase(), req.params.id]);
            res.status(200).send(respuesta);
        }
        res.status(413).send("No existe un libro con ese ID");        
        
    }
    catch(ex){
        console.error(ex.message);
        res.status(413).send({"Error": ex.message});
    }
});


app.put('/libro/prestar/:id', async(req, res)=>{

    try {
   
        //pregunto si envio persona 
        if (req.body.persona_id) {
            //valido que exista esa persona
            let query= 'SELECT * FROM `personas` WHERE `id`= ?';
            let respuesta= await qy(query, [req.body.persona_id]);
           
            if (respuesta.length > 0) {
                //valido que el libro no este prestado
                let query = 'SELECT * FROM `libros` WHERE `id`= ?';
                let respuesta = await qy(query, [req.params.id]);
                respuesta = respuesta.map(libros => libros.persona_id);
                
                    if (respuesta[0] == null) {
                        //envio a la DB
                        query = 'UPDATE `libros` SET `persona_id`= ? WHERE `id` = ?';
                        respuesta = await qy(query,  [req.body.persona_id, req.params.id]);
                        res.status(200).send({"respuesta": respuesta.affectedRows});
                        
                    }else{
                        res.status(413).send("Este libro se encuentra prestado, no se puede prestar hasta que no se devuelva") ;
                    }

           } else {
                res.status(413).send("Esa persona no existe");
           }

        }else{
            res.status(413).send("No eligiste nunguna persona");
        }

    } catch (error) {
        console.error(error.message);
        res.status(413).send({"Error": error.message});
     }
});

app.put('/libro/devolver/:id', async(req,res)=>{

    try {
   
        let query = 'SELECT * FROM `libros` WHERE `id`= ?';
        let respuesta = await qy(query, [req.params.id]);
      
        //valido que exista el libro
        if (respuesta.length > 0) {
            //validacion que este prestado
            respuesta = respuesta.map(libros=>libros.persona_id);
            
                if (respuesta[0] != null) {
                    //envio a la DB
                    query = 'UPDATE `libros` SET `persona_id`= ? WHERE `id` = ?';
                    respuesta = await qy(query,  [null, req.params.id]);
                    res.status(200).send({"respuesta": respuesta.affectedRows}) 
                }else{
                    res.status(413).send('Este libro no ha sido prestado');
                }

        } else {
            res.status(413).send('Este libro no existe');
        }
        
       } catch (error) {
           console.error(error.message);
           res.status(413).send({"Error": error.message});
       }


});

app.delete('/libro/:id', async(req,res)=>{

    try {

        //VALIDACIONES
        let query='SELECT * FROM `libros` WHERE `id`= ?';
        let respuesta = await qy(query, [req.params.id]);
        //pregunto si existe el libro
        if (respuesta.length > 0) {
            //valido que no este prestado
            respuesta = respuesta.map(libros => libros.persona_id);
                if (respuesta[0] == null){
                    //envio a DB
                    query ='DELETE FROM `libros` WHERE `id`= ?';
                    respuesta = await qy(query, [req.params.id]);
                    res.status(200).send({"respuesta": respuesta.affectedRows});
                }else{
                    res.status(413).send('Ese libro esta prestado no se puede borrar');
                }

        } else {
            res.status(413).send('Ese libro no existe');
        }
   
       } catch (error) {
           console.error(error.message);
           res.status(413).send({"Error": error.message});
       }
});

//API PERSONAS

//API CATEGORIAS

//CREO SERVIDOR
app.listen(port, () => {
    console.log("Server listening on port:", port);
});
