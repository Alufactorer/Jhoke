const {v4 : uuidv4} = require("uuid")
const {Query} = require("./queries")
const { default: axios } = require("axios");



/**
 * @typedef InsertObject
     * @property {string} queryObject
     * 
     * @typedef QueryKey
     * @property {string} Key
     * 
     * @typedef insert
     * @property {InsertObject[]} Query
     * 
     * @typedef update
     * @property {InsertObject[]} Query
     * 
     * @typedef delete
     * @property {QueryKey} Query
     * 
     * @typedef findMany
     * @property {QueryKey[]} Query
     * 
     * @typedef findOne
     * @property {QueryKey} Query
     * 
     * 
     * @typedef query
     * @property {insert} [insert]
     * @property {update} [update]
     * @property {delete} [delete]
     * @property {findMany} [findMany]
     * @property {findOne} [findOne]
 */

class saveBucket{


    /**
     * 
     * @param {string | undefined} uid 
     * @param {saveBucket | undefined} value 
     * @param {object | undefined} optional 
     * 
     * 
     * return saveBucket
     */

    constructor(uid, value = undefined, optional = undefined){
        this.defaultUrl = (process.argv[2] === "dev") ? "http://localhost:3000" : "https://bucketstore.onrender.com"
        if(process.argv[2] === "dev") console.log("dev")
        this.value = value;
        this.uid = uid;
        this.optional = optional;
    }



    /**
     * 
     * @example 
     * const buck = new saveBucket(uid)
     *      .save({"key1":"value1"})
     *      .pipe(console.log)
     *      //console.logs the url where the users store is
     * @description 
     * will store the given object at the store with the specified uid as the key, 
     * the values can later be retreived with the keys theyre stored with. 
     * 
     * @param {object} obj 
     * @returns {saveBucket} 
     */

    save(obj){

    

        return new saveBucket(this.uid, 
            
            (async () => {

                let currentsave

                const {data : uidURL, success} = (await axios.post(this.defaultUrl + "/get", {key:this.uid})).data
                if(!success){

                    currentsave = {}
                }else{

                    const res = await axios.get(uidURL)

                    currentsave =  (JSON.parse(res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim()))
                }


                const params = new URLSearchParams()

                params.append("saveText", "Save Text!")
                params.append("lines", JSON.stringify({...currentsave, ...obj}))


                const newsaveurl = await axios.post("https://textsaver.flap.tv/index.php", params).then(res => res.data.split(`id="listLink">`)[1].split("<")[0])
                


                await axios.post(this.defaultUrl + "/save", {key:this.uid, value:newsaveurl})


                return newsaveurl
            })(),
            this.optional
            
            )
    }

    /**
     * @description
     * 
     * will save the object at a url and return this url
     * 
     * @example  
     * const buck = new saveBucket(uid)
     *      .saveObjToURL({"key1":"value1"})
     *      .pipe(console.log)
     * 
     *      //console.logs the url where the object is saved at
     * 
     * @async
     * @param {object} obj 
     * @returns {saveBucket} 
     */
    saveObjToURL(obj){

        

        const params = new URLSearchParams();

        params.append("lines", JSON.stringify(obj)),
        params.append("saveText", "Save Text!")
        
        return new saveBucket(
            this.uid, 
            (async () => {
                const url = await axios.post("https://textsaver.flap.tv/index.php", params).then(res => res.data.split(`id="listLink">`)[1].split("<")[0])
            
                return url
            })(),
            
            this.optional
        )
    }

    /**
     * @example
     * const buck = new saveBucket(uid)
     *      .save({"key1":"value1"})
     *      .get(key1)
     *      .pipe(console.log)
     *      //console.logs "value1"
     * 
     * @description
     * 
     * will get the value stored under key inside the users store
     * 
     * @param {string} key 
     * @returns {saveBucket}
     */
    get(key){
        return new saveBucket(this.uid,


            (async () => {
                const {data : uidURL, error} = (await axios.post(this.defaultUrl + "/get", {key:this.uid})).data
                if(error){
                    return this.value || null
                }
                

                const res = await axios.get(uidURL)


                return (JSON.parse(res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim())[key])
            })(),
            this.optional
        )

        
    }

    
    /**
     * 
     * @example 
     * const buck = new saveBucket(uid)
     *      .saveObjToURL({"key1", "key1"})
     *      .getValueFromURL("key1")
     *      .pipe(console.log)
     *      //console.logs "value1"
     * 
     * @description 
     * Returns the key stored at the url
     * 
     * **IMPORTANT** 
     *
     * if no key is provided the whole object which is stored will be returned
     * 
     * if no url is provided the value currently stored under ```saveBucket.value``` will be used
     * 
     * 
     * @param {string} key 
     * @param {string} url 
     * @returns {saveBucket}
     * 
     */
    getValueFromURL(key, url){

        

        return new saveBucket(
            this.uid, 
            (async () => {

                const retrieveURL = url || await this.value

                

                const res =  await axios.get(retrieveURL).then(res => res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim()) 

            
                const response = key ? ((JSON.parse(res))[key]) : res;

                return response
            })(), 
            this.optional
        )

        
    }


    /**
     * @example 
     * const buck = new saveBucket(uid)
     *      .get("key1")
     *      .pipe(res => res.split("l"))
     *      .pipe(console.log)
     *      //console.logs ["va", "ue1"]
     * @description
     * takes in a function that mutates the current ```saveBucket.value``` and returns a new saveBucket with the now mutated value
     * 
     * @param {Function} func 
     * @returns  {saveBucket}
     */
    pipe(func){

        if(typeof func === "undefined"){
            return new saveBucket(
                this.uid, 
                this.value,
                this.optional
            )
        }

        return new saveBucket(
            this.uid, 
            this.value.then(res => func(res)),
            this.optional
        )
    }




    //query stuff from here, should be more efficient although harder to use.


    /**
     * 
     * @typedef query 
     * @property {{id:string, [some]:any}} where
     * @property {{$upsert: boolean | undefined}} update
     *
     * @param {query} query 
     * 
     * @returns {saveBucket}
     */

    query(query, perurl=false){
       

                return (async () => {

                    let data = ""


                    
                    if(!perurl){

                    
                            let {data} = await axios.post(this.defaultUrl + "/get", { 
                                key:this.uid
                            })


                            if(!data.data){
                                data = ""
                            } else {

                                data = await axios.get(data.data).then(res => res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim().replace("<br />", ""))
                            }
                        console.log(data)
                            data = Query(query, data)
                            

                        

                            const params = new URLSearchParams()

                params.append("saveText", "Save Text!")
                params.append("lines", data.wholedata)
                        

                            const url = await axios.post("https://textsaver.flap.tv/index.php", params).then(res => res.data.split(`id="listLink">`)[1].split("<")[0])
                            await axios.post(this.defaultUrl + "/save", {
                                key:this.uid, 
                                value:url 
                            })
                           
                        return data;
                            
                        
                    }
                    if(perurl){
                        const retrieveURL = perurl
                             const res =  await axios.get(retrieveURL).then(res => res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim().split("<br />").join(""))
                        data = Query(query, res)
                    }


                return data
                })() 
        
            
    }
    


}




module.exports = {
    saveBucket
}


