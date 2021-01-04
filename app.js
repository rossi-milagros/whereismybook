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

//INICIO - LOGICA DE NEGOCIO

//API LIBRO
app.post('/libro', async (req, res) =>{

    try {

        if(!req.body.nombre || !req.body.categoria_id) {
            res.status(413).send("El nombre y la categoria son obligatorios")
        }

        let searchLibro = 'SELECT id FROM libros WHERE nombre = ?';
        let searchCategoria = 'SELECT nombre FROM categorias WHERE id = ?';

        let resLibro = await qy(searchLibro, [req.body.nombre.toUpperCase()]);
        let resCategoria = await qy(searchCategoria, [req.body.categoria_id]);

        if (resCategoria.length > 0) {

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
                res.status(200).send({"respuesta": respuesta});
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

//API PERSONA

app.post('/persona', async (req, res) =>{
    try {
        
        if (!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.alias) {
            throw new Error("Faltan datos");
        }

        // Con estas lineas se deberia poder chequear si ya esta registrado el email:
        query = 'INSERT INTO personas (nombre, apellido, email, alias) VALUES (?, ?, ?, ?)';
        let chequearEmail = 'SELECT * FROM personas WHERE email = ?';
        let respuesta = await qy(chequearEmail, [req.body.email.toUpperCase()]);

        if (respuesta.length > 0) {
            throw new Error("El email ya se encuentra registrado");
        }
    
        respuesta = await qy(query, [req.body.nombre.toUpperCase(), req.body.apellido.toUpperCase(), req.body.email.toUpperCase(), req.body.alias.toUpperCase()]);

        res.status(200).send({'respuesta': "Hay " + respuesta.insertId + " persona(s) registrada(s)"});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message}); //Revisar dónde se coloca el mensaje "personalizado"
    }
});

app.get ('/persona', async (req, res) => {
    
    try {
        var query = 'SELECT * FROM personas';
        var respuesta = await qy(query);
        res.status(200).send({'respuesta': respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
});

app.get ('/persona/:id', async (req, res) => {
    try {
        //Validamos que exista una persona con el ID indicado
        const query = 'SELECT * FROM personas WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);

        if(respuesta.lenght > 0) {
            
            console.log(respuesta);
            res.status(200).send({"respuesta": respuesta});
        }
        else {
            throw new Error("No hay una persona con ese ID");
        }
        
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }

});

app.put('/persona/:id', async (req, res) => {
    
    try {
        //1.    Cambie el && por || (osea cambie los AND por OR)

        if (!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.alias) {
            throw new Error("No hay datos que actualizar");
        }

        //2.    Vamos a validar que la persona efectivamente exista con ese ID
        let query = 'SELECT * FROM personas WHERE id = ?';
        let existe = await qy(query, [req.params.id]);
        
        if (existe.length > 0) {
            // Comprobamos que el email esté registrado y que corresponda al id ingresado.
            //De no cumplirse ambas condiciones, arrojamos error con msj: 'El email no se puede modificar'.

            let chequearEmail = 'SELECT * FROM personas WHERE email = ? && id <> ?';
            let respuestaEmail = await qy(chequearEmail, [req.body.email.toUpperCase(), req.params.id]);

            if (respuestaEmail.length > 0) {
                throw new Error("El email no se puede modificar");
            }

            // Cambiamos los datos
            query = 'UPDATE personas SET nombre = ?, apellido = ?, email = ?, alias = ? WHERE id = ?';
            respuesta = await qy(query, [req.body.nombre.toUpperCase(), req.body.apellido.toUpperCase(), req.body.email.toUpperCase(), req.body.alias.toUpperCase(), req.params.id]);

            res.status(200).send({"respuesta": respuesta.affectedRows});
        }
        else {
            throw new Error("Esa Persona no existe");
        }
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});  
    }
    
});  

app.delete('/persona/:id', async (req, res) => {
    try {
        
        let query = 'SELECT * FROM personas WHERE id = ?';
        let existe = await qy(query, [req.params.id]);

        if (!([existe.length] > 0)) {
            res.status(413).send("no existe esa persona");
        };

        query = 'SELECT * FROM libros WHERE persona_id = ?';
        let respuestaLibro = await qy(query, [req.params.id]);
        respuestaLibro = respuestaLibro.map(libros=>libros.persona_id);
        
        if (respuestaLibro[0]!=null) {
            res.status(413).send("Esa persona tiene libros asociados, no se puede eliminar");
        };
        
        query = 'DELETE FROM personas WHERE id = ?';
        let respuesta = await qy( query, [req.params.id]);

        res.status(200).send({"mensaje" : "se borro correctamente"});
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message}); 
    }
});

//API CATEGORIAS

app.post('/categoria', async (req, res) =>{

    try {

        if(!req.body.nombre) {
            res.status(413).send("El nombre de la categoria es obligatoria")
        }

        else {
            let searchCategoria = 'SELECT id FROM categorias WHERE nombre = ?';
            let resCategoria = await qy(searchCategoria, [req.body.nombre.toUpperCase()]);

            if (resCategoria.length > 0) {
                res.status(413).send("La Categoria ya existe");
            }
            else {
                let sqlquery = 'INSERT INTO categorias (nombre) VALUES (?)';
                let respuesta = await qy(sqlquery, [req.body.nombre.toUpperCase()]);
                res.status(200).send({"Registro": respuesta});
            }
        
        }
    }
    catch(ex) {
        console.log(ex);
        res.status(413).send({"Error": ex.message});
    }
});

// RUTA GET - MUESTRA TODAS LAS CATEGORIAS
app.get('/categoria', async (req,res) =>{

   try{
        const sqlquery = 'SELECT * FROM categorias';
        const respuesta = await qy(sqlquery);
        res.status(200).send({"respuesta": respuesta});
    }
    catch(ex){
        console.log(ex);
        res.status(413).send({mensaje: ex.message});
    }
});

// RUTA GET CON ID - MUESTRA UNA CATEGORIA DADO UN ID
app.get('/categoria/:id', async (req, res) => {

    try{

        if (!req.params.id) {
           res.status(413).send("Es necesario indicar el número ID"); 
        }
        else {
            const sqlquery = 'SELECT * FROM categorias WHERE id = ?';
            const respuesta = await qy(sqlquery, [req.params.id]);

            if (respuesta.length > 0) {
                res.status(200).send({"respuesta": respuesta});
            }
            else {
                res.status(413).send("No hay categoria con el ID indicado");
            }
        }
    }
    catch(ex){
        console.log(ex);
        res.status(413).send({"Error": ex.message});
    }
});

// RUTA DELETE, ELIMINA UNA CATEGORIA
app.delete('/categoria/:id', async(req,res)=>{

    try {
        // SE BUSCAR CATEGORIA PARA VER SI EXISTE
        let sqlquery = 'SELECT * FROM `categorias` WHERE `id`= ?';
        let respuesta = await qy(sqlquery, [req.params.id]);
       
        if (respuesta.length > 0) {
            //SE VALIDA QUE LA CATEGORIA A ELIMINAR NO ESTE ASOCIADA A UN LIBRO
            let sqlquery_libro = 'SELECT * FROM `libros` WHERE `categoria_id`= ?';
            let respuesta_libro = await qy(sqlquery_libro, [req.params.id]);
            
                if (!respuesta_libro[0]) {
                   //SE ENVIA LA CONSULTA A LA BASE DE DATOS
                   sqlquery = 'DELETE FROM `categorias` WHERE `id`= ?';
                   respuesta = await qy(sqlquery, [req.params.id]);
                   res.status(200).send({"respuesta:": respuesta.affectedRows});
               
                }else {
                    res.status(413).send('La Categoria esta asociada a un libro y no se puede borrar');
                }

        } else {
            res.status(413).send('Esta categoria no existe');
        }
   
    } catch (error) {
        console.error(error.message);
        res.status(413).send({"Error": error.message});
    }
});

//FIN - LOGICA DE NEGOCIO

//SERVER
app.listen(port, () => {
    console.log("Server listening on port:", port);
});
