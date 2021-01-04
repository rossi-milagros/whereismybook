//API de Personas

/* Agregar una persona:
POST '/persona' recibe: {nombre: string, apellido: string, alias: string, email: string} retorna: status: 200, {id: numerico, nombre: string, apellido: string, alias: string, email: string} - status: 413, {mensaje: <descripcion del error>} que puede ser: "faltan datos", "el email ya se encuentra registrado", "error inesperado"
*/

app.post('/persona', async (req, res) =>{
    try {
        if (!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.alias) {
            throw new Error("Faltan datos");
        }

        // Con estas lineas se deberia poder chequear si ya esta registrado el email:

        query = 'INSERT INTO persona (nombre, apellido, email, alias) VALUES (?, ?, ?, ?)';

        let chequearEmail = 'SELECT * FROM persona WHERE email = ?';
        let respuesta = await qy(chequearEmail, [req.body.email.toUpperCase()]);

        if (respuesta.length > 0) {
            throw new Error("El email ya se encuentra registrado");
        }
    
        console.log({"respuesta" : respuesta});

        respuesta = await qy(query, [req.body.nombre.toUpperCase(), req.body.apellido.toUpperCase(), req.body.email.toUpperCase(), req.body.alias.toUpperCase()]);

        res.send({'respuesta': "Hay "+respuesta.insertId+" persona(s) registrada(s)"}); //No se si esta línea se escribe así. Lo copie del TP. No sé tampoco si hace falta poner un identificador, creo que no.
        
    }

    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message}); //Revisar dónde se coloca el mensaje "personalizado"
    }
});

/*
Pedir lista de personas:
GET '/persona' retorna status 200 y [{id: numerico, nombre: string, apellido: string, alias: string, email; string}] o bien status 413 y []
*/

app.get ('/persona', async (req, res) => {
    try {
        var query = 'SELECT * FROM persona';

        var respuesta = await qy(query);
        res.send({'respuesta': respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
});

/* GET '/persona/:id' retorna status 200 y {id: numerico, nombre: string, apellido: string, alias: string, email; string} - status 413 , {mensaje: <descripcion del error>} "error inesperado", "no se encuentra esa persona" */

app.get ('/persona/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM persona WHERE id = ?';

        const respuesta = await qy(query, [req.params.id]);

        console.log(respuesta);

        res.send({"respuesta": respuesta});
    }
    catch(e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }

});

/*PUT '/persona/:id' recibe: {nombre: string, apellido: string, alias: string, email: string} el email no se puede modificar. retorna status 200 y el objeto modificado o bien status 413, {mensaje: <descripcion del error>} "error inesperado", "no se encuentra esa persona"*/ 

app.put('/persona/:id', async (req, res) => {
    try {
        
        if (!req.body.nombre & !req.body.apellido & !req.body.email & !req.body.alias) {
            throw new Error("No hay datos que actualizar");
        }

        let query = 'SELECT * FROM persona WHERE id = ?';

        let existe = await qy(query, [req.params.id]);

        if (existe.lenght = 0) {
            throw new Error("Esa Persona no existe");
        }

        // Comprobamos que el email esté registrado y que corresponda al id ingresado. De no cumplirse ambas condiciones, arrojamos error con msj: 'El email no se puede modificar'.

        let chequearEmail = 'SELECT * FROM persona WHERE email = ? && id = ?';
        let respuestaEmail = await qy(chequearEmail, [req.body.email.toUpperCase(), req.params.id]);

        if (respuestaEmail.length == 0) {
            throw new Error("El email no se puede modificar");
        }

        // Cambiamos los datos

        query = 'UPDATE persona SET nombre = ?, apellido = ?, email = ?, alias = ? WHERE id = ?';

        respuesta = await qy(query, [req.body.nombre.toUpperCase(), req.body.apellido.toUpperCase(), req.body.email.toUpperCase(), req.body.alias.toUpperCase(), req.params.id]);

        res.send({"respuesta": respuesta.affectedRows});

    } 
    catch (e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message});  
    }
    
});  

/*DELETE '/persona/:id' retorna: 200 y {mensaje: "se borro correctamente"} o bien 413, {mensaje: <descripcion del error>} "error inesperado", "no existe esa persona", "esa persona tiene libros asociados, no se puede eliminar" */

app.delete('/persona/:id', async (req, res) => {
    try {
        
        let query = 'SELECT * FROM persona WHERE id = ?';

        let existe = await qy(query, [req.params.id]);

        if (!([existe.length] > 0)) {
            throw new Error("no existe esa persona");
        };

        query = 'SELECT * FROM libro WHERE persona_id = ?';

        let respuestaLibro = await query(query, [req.params.id]);

        if ([respuestaLibro.length > 0]) {
            throw new Error("esa persona tiene libros asociados, no se puede eliminar");
        };
        
        query = 'DELETE FROM persona WHERE id = ?';

        let respuesta = await qy(query, [req.params.id]);

        res.status(200).send({"mensaje" : "se borro correctamente"});
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({"Error": e.message}); 
    }
});
