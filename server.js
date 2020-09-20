const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

var knex = require('knex')

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
    let found = false;
    database.users.forEach(user => {
        if((req.body.email === user.email) && (req.body.password === user.password)){
            found = true;
            return res.json(user)
        } 
    })
    if(!found){
        res.json("Can't find user")
    }
})

app.post('/register', (req, res) =>{
    const {name, email, pass} = req.body;
    db('users').returning('*')
    .insert({
        name: name,
        email: email,
        joined: new Date()
        })
        .then(user => res.json(user[0]))
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