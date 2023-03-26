const express = require("express")
const app = express();

app.use(express.json())

const fs = require("fs");
const path = require("path");


app.post("/save", (req, res) => {
    const {key, value} = req.body;


    const currentsave = fs.readFileSync(path.join(__dirname, "save.json"))


    const obj = JSON.parse(currentsave)


    const saveobj = {...obj}

    saveobj[key] = value

    fs.writeFileSync(path.join(__dirname, "save.json"), JSON.stringify(saveobj))

    res.send({success:true})
})


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})


app.post("/get", (req, res) => {
    const {key} = req.body;

    console.log("hello there")

    let currentsave = (fs.readFileSync(path.join(__dirname, "save.json"), "utf-8"))

    currentsave = JSON.parse(currentsave);


    if(!currentsave[key]){
        res.send({success:false})
        return 
    }


    res.send({success:true, data:currentsave[key]})
})


app.listen(3000)
