const expres = require("express");

const router = expres.Router();

//  Invocamos a la conexion de la DB
const connection = require('../database/db');
/* importamos el Model */
const MProyecto = require('../model/MProyecto');
const mProyecto = new MProyecto();
//	Invocamos a bcrypt
const bcrypt = require('bcryptjs');

const ProyectoDTO = require('../interface/system');


/**   RUTAS  **/

router.get('/login', (req, res) => {
	res.render('../views/login.ejs');
})

router.get('/register',(req, res)=>{
		res.render('register');
})
router.get('/createproyecto',(req, res)=>{
		res.render('create',{
			login:true,
			name: req.session.name,
			user_id: req.session.user_id,
		});
})

//10 - Método para REGISTRARSE
router.post('/register', async (req, res)=>{
	const user = req.body.user;
	const name = req.body.name;
    const rol = req.body.rol;
	const pass = req.body.pass;
	let passwordHash = await bcrypt.hash(pass, 8);
    connection.query('INSERT INTO users SET ?',{user:user, name:name, rol:rol, pass:passwordHash}, async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('register', {
				alert: true,
				alertTitle: "Regitro",
				alertMessage: "Te registraste correctamente!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: 'login'
			});
        }
	});
})


//10 - Método para la REGISTRACIÓN
router.post('/store', async (req, res) => {
    const name = req.body.name;
	const user_id =  req.session.user_id;
	const link = `http://localhost:3000/pizarra/` + name;
    const nuevoProyectoDTO = new ProyectoDTO(name,link,user_id);
    mProyecto.crearProyecto(nuevoProyectoDTO)
        .then((insertId) => {
            
            res.render('create', {
                alert: true,
                name: name,
                alertTitle: "Registro Correcto",
                alertMessage: "¡Registro exitoso!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''
            });
        })
        .catch((error) => {
            console.error(error);
        });
});



router.post('/update', async (req, res) => {
	try {
	  const { id, newData } = req.body;
	  
	  mProyecto.update(id,newData);
	  res.status(200).json({ message: 'Datos actualizados con éxito' });
	} catch (error) {
	  res.status(500).json({ error: 'Error al actualizar datos' });
	}
  });




module.exports = router;