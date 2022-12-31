const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app=express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000; 

//middlewire
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.PASSWORD}@cluster0.skhdz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message:'Unauthorized User'});
    }
    const token=authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
        if(err){
            res.status(401).send({message:'Unauthorized User'});
        }
        req.decoded=decoded;
        next();
    })

}

async function run(){
    const serviceCollection=client.db('geniousDb').collection('services')
    const orderCollection=client.db('geniousDb').collection('orders')

    //jwt
    app.post('/jwt',(req,res)=>{
        const user=req.body;
        const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
        res.send({token})
    })

    app.get('/services',async(req,res)=>{
        const query={}
        const cursor=serviceCollection.find(query)
        const services=await cursor.toArray();
        res.send(services)
    })

    app.get('/services/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)}
        const service=await serviceCollection.findOne(query);
        res.send(service)
    })

    //orders

    app.get('/orders',verifyJWT,async(req,res)=>{
        const decoded=req.decoded;
        const email=req.query.email;
        if(decoded.email==!email){
            res.status(403).send({message:'Unauthorized User'})
        }
        let query={};
        if(email){
            query={
                email:email
            }
        }

        const cursor=orderCollection.find(query)
        const result=await cursor.toArray()
        res.send(result)
    })

    app.post('/orders',verifyJWT,async(req,res)=>{
        const order=req.body;
        const result=await orderCollection.insertOne(order)
        res.send(result)
    })

    app.patch('/orders/:id',verifyJWT,async(req,res)=>{
        const id=req.params.id;
        const status=req.body.status;
        const query={_id:ObjectId(id)}
        const updatedDoc={
            $set:{
                status:status
            }
        }
        const result=await orderCollection.updateOne(query,updatedDoc)
        res.send(result)
    })

    app.delete('/orders/:id',verifyJWT,async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)}
        const result= await orderCollection.deleteOne(query)
        res.send(result)
    })

}
run().catch(err=>console.log(err))


app.get('/',(req,res)=>{
    res.send("Welcome Ginius Car web Dev")
})

app.listen(port,()=>{
    console.log(`Welcome to PORT ${port}`);
})