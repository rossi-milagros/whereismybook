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

//CREO SERVIDOR
app.listen(port, () => {
    console.log("Server listening on port:", port);
});
