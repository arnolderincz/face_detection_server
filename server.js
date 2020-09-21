const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'dlonra',
      database : 'face_det'
    }
});


const app = express();
app.use(bodyParser.json());
app.use(cors());
let cur_id = 1;

const database = {
    users:[
        {
            id: cur_id++,
            name: 'John',
            email:'john@gmail.com',
            password: 'banana',
            entries: 0,
            joined: new Date()
        }
    ]
}

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) =>{
    db.select('email', 'hash').from('login')
    .where({email: req.body.email})
    .then(data => {  
        var valid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(valid){
            return db.select('*').from('users')
            .where({email: req.body.email})
            .then(user => res.json(user[0]))
            .catch(err => res.status(400).json("unable to get user"))
        }
    })
    .then(err => res.status(400).json("Can't find user"))
})

app.post('/register', (req, res) =>{
    const {name, email, password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users').returning('*')
            .insert({
                name: name,
                email: loginEmail[0],
                joined: new Date()
            })
            .then(user => res.json(user[0]))
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('Unable to join'));
})

app.get('/profile/:id', (req, res) =>{
    const {id} = req.params;
    db.select('*').from('users').where({id: id}).then(user =>{
        if(user.length){
            res.json(user[0])
        }
        else{
            res.status(400).json("User not found");
        }
    })
})

app.put('/image', (req, res) => {
    const {id} = req.body;
    db.select('*').from('users')
    .where({id:id}).increment('entries', 1)
    .returning('entries')
    .then(entries => {
        if(entries.length){
          res.json(entries[0])  
        }
        else{
            res.status(400).json("User not found")
        }
    })
    .catch(err => res.status(400).json("Unable to get entries"));
})

app.listen(3001, () =>{
console.log('app is running on port 3001')
});

/*
/signin --> POST = succes/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> user updated

*/