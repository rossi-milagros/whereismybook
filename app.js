//INICIALIZACION
const express=require('express');
const jwt= require('jsonwebtoken');
const util =require('util');
const mysql=require('mysql');
const handlebars=require('handlebars');

const app= express();

//SETTINGS

//creo port por ternario
const port = process.env.PORT ? process.env.PORT : 3000;
app.use(express.json());

const conexion= mysql.createConnection({
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

//MIDDLEWARES

app.put('/libro/:id', async(req,res,next)=>{
    try {
        
        if (!req.body.nombre) {
            throw new Error("No escribiste el titulo del libro");
        }

        let query='SELECT * FROM `libros` WHERE `nombre`= ? AND `id` <> ?';
        let respuesta = await qy(query, [req.body.nombre, req.params.id]);

        if (respuesta.length>0) {
            throw new Error('Ese libro ya esta en tu biblioteca, agrega otro titulo');
        }

        let descripcion= '';
        if (req.body.descripcion) {
            descripcion= req.body.descripcion;
        }

        let persona= null;
        if (req.body.persona_id) {
            persona= req.body.persona_id;
        }

        query = 'UPDATE `libros` SET `nombre` = ?, `descripcion`= ?,`categoria_id`= ?,`persona_id`= ? WHERE `id` = ?';
        respuesta = await qy(query, [req.body.nombre, descripcion, req.body.categoria_id, persona, req.params.id]);

        res.send({"respuesta": respuesta.affectedRows});
        console.log(respuesta, 'hola');
        res.status(200);

    } catch (error) {
        console.error(error.message);
        res.status(413).send({"Error": error.message});
    }

    next();
});


app.put('/libro/prestar/:id', async(req, res, next)=>{

    try {
   
        //pregunto si envio persona si no le mando error
        let persona;
        if (!req.body.persona_id) {
           persona= null;
           res.status(200).send("No eligiste nunguna persona");
        }
        //valido por si no envio algo
        if (req.body.persona_id) {
            persona= req.body.persona_id;
        }
        //envio a la DB
        query = 'UPDATE `libros` SET `persona_id`= ? WHERE `id` = ?';
        respuesta = await qy(query,  [persona, req.params.id]);
        res.send({"respuesta": respuesta.affectedRows});

        res.status(200);
   
       } catch (error) {
           console.error(error.message);
           res.status(413).send({"Error": error.message});
       }

    next();
});

app.put('/libro/devolver/:id', async(req,res,next)=>{

    try {
   
        let query='SELECT `persona_id` FROM `libros` WHERE `id`= ?';
        let respuesta = await qy(query, [req.params.id]);
        respuesta = null;
        
        //envio a la DB
        query = 'UPDATE `libros` SET `persona_id`= ? WHERE `id` = ?';
        respuesta = await qy(query,  [respuesta, req.params.id]);
        res.send({"respuesta": respuesta.affectedRows});
        res.status(200);
   
       } catch (error) {
           console.error(error.message);
           res.status(413).send({"Error": error.message});
       }

    next();

});

app.delete('/libro/:id', async(req,res,next)=>{

    try {

        let query='DELETE FROM `libros` WHERE `id`= ?';
        let respuesta = await qy(query, [req.params.id]);
        res.send({"respuesta": respuesta.affectedRows});
        res.status(200);
   
       } catch (error) {
           console.error(error.message);
           res.status(413).send({"Error": error.message});
       }

    next();

});


//CREO SERVIDOR
app.listen(port, () => {
    console.log("Server listening on port:", port);
});
