const express = require("express");
const app = express()
const jwt = require('jsonwebtoken')
const {MongoClient} = require('mongodb')
const dburl = 'mongodb://127.0.0.1:27017'
const dbName = 'TestRemove'
const client = new MongoClient(dburl)
const nodemailer = require("nodemailer");


app.use(express.json())
let privateKey = 'ThisIsThePrivateKey'

generateToken = async(email)=>{
    let expires_In="2 days"
    return await jwt.sign({email }, privateKey,{expiresIn:expires_In});

}

signup = async(req,res,next)=>{
    try{
    await client.connect()
    const databaseName = client.db(dbName)
    let collectionName = databaseName.collection("EB")
    let user = await collectionName.insertOne(req.body)
    await client.close()
    
    const jwtToken = await generateToken(req.body.email)

    //Send verify link along with token
    res.status(200).json({
        "message" : "Sucess from signup",
        jwtToken
    })
    }
    catch(err){
        console.log("Error occured during signup : ",err)
    }
}

login = async(req,res)=>{
    try{
        if(!(req.body.email) || !(req.body.password)){
            res.status(400).json({"message":"Please enter Email Id or Password"})
        }else{
            await client.connect()
            const databaseName = client.db(dbName)
            let collectionName = databaseName.collection("EB")
            email = req.body.email
            let user = await collectionName.findOne({email})
            await client.close()
            
            if(!user || !(user['password'] == req.body.password)){
                res.status(401).json({"message":"Incorrect email or password"})
            }

            const jwtToken = await generateToken(req.body.email)
            res.status(200).json({
                "message" : "Sucess from login",
                jwtToken
            })
        }
    }
    catch(err){
        console.log("Error in login : ",err)
    }
}

verify = async(req,res)=>{
    unverifiedToken = token
    let decoded = jwt.verify(token, privateKey)
    if(decoded){
        res.status(200).json({
            "message" : "Successfully verified token",
            decoded
        })
    }

    res.status(400).json({
        "message" : "Token verification failed"
    })
}

createProduct = async(req,res,next)=>{
    await client.connect()
    const databaseName = client.db(dbName)
    let collectionName = databaseName.collection("Product")
    let product = await collectionName.insertOne(req.body)
    await client.close()

    if(!product){
        res.status(400).json({"message":"Error while creating product"})
    }
    res.status(200).json({
        "message" : "Product created"
    })
}

getProduct = async(req,res,next)=>{
    await client.connect()
    const databaseName = client.db(dbName)
    let collectionName = databaseName.collection("Product")
    let productName = req.body.name
    let product = await collectionName.findOne({name:productName})
    await client.close()

    if(!product){
        res.status(400).json({"message":"Error while creating product"})
    }

    res.status(200).json({
        "message" : "Success",
        "product": product
    })
} 

updateProduct = async(req,res,next)=>{
    await client.connect()
    const databaseName = client.db(dbName)
    let collectionName = databaseName.collection("Product")
    let productName = req.body.name
    let filter = {name:req.params.name}

    let updateDoc ={$set:req.body}
    let updatedProduct = await collectionName.updateOne(filter,updateDoc)
    await client.close()

    if(!updatedProduct){
        res.status(400).json({"message":"Error while updating product"})
    }

    res.status(200).json({
        "message" : "Successsfully updated Product"
    })

}

deleteProduct = async(req,res,next)=>{
    try{
        await client.connect()
        const databaseName = client.db(dbName)
        let collectionName = databaseName.collection("Product")
        let deleteDoc ={name:req.params.name}
        
        let deletedProduct = await collectionName.deleteOne(deleteDoc)
        await client.close()

        res.status(200).json({
            "message" : "Successsfully deleted Product"
        })
    
    }
    catch(err){
        console.log("Error while deleting the Product : ",err)
        res.status(400).json({"message":"Error while deleting the Product"})

    }
    
}

assignProducts = async(req,res,next)=>{

    await client.connect()
    const databaseName = client.db(dbName)
    let collectionName = databaseName.collection("EB")
    let filter = {username:req.params.user}

    let updateDoc ={$set:req.body}
    let updatedUser ;
    updatedUser = await collectionName.updateOne(filter,updateDoc)
    
    await client.close()

    res.status(200).json({
        "message" : "Successsfully assigned product"
    })
}

listProducts = async(req,res)=>{
    username = req.params.user
    await client.connect()
    const databaseName = client.db(dbName)
    let collectionName = databaseName.collection("EB")

    let productList = await collectionName.findOne({username:username})
    if(!productList){
        res.status(404).json({"message":"Incorrect userId"})
    }

    let productCollection = databaseName.collection("Product")
    let productQuery = {}
    if(req.params.brand)
        {productQuery.brand = req.params.brand}
    

    if(req.params.category)
        {productQuery.category = req.params.category}

    let products = await productCollection.findOne(productQuery)
    await client.close()

    let message;
    let prods = productList.product
    let prodName = JSON.stringify(products.name)
    
    let status
    if(!products){
        status=404
        message= "Incorrect brand/category"
    }
    else if((prods.includes(prodName))){
        status=404
        message= "Product not assigned to user "
    }
    
    if(!productList){
        status=400
        message="Error while creating product"
    }

    if(!status){
        res.status(200).json({
            "message" : "Successsful listProducts",
            "product" : products
        })
    } else{ 
        res.status(status).json({"message":message})
    }
}

app.post('/signup',signup) 
app.post('/login',login)
app.post('/verify',verify)
app.put('/assign/:user',assignProducts)
app.get('/assign/:user/:brand/:category',listProducts)

app.post('/Product',createProduct)          // C
app.get('/Product',getProduct)              // R
app.patch('/Product/:name',updateProduct)   // U
app.delete('/Product/:name',deleteProduct)  // D


port=3500
app.listen(port,'127.0.0.1',()=>{
    console.log("Server started on : ",port)
})
