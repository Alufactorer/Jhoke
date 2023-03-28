import axios from "axios"



function getIndicesOf(searchStr:string, str:string): number[]{
    let searchStrLen = searchStr.length;
    if(searchStrLen == 0){
        return [];
    }

    let startIndex : number = 0;
    let index : number; 
    let indices : number[] = [];

    while ((index = str.indexOf(searchStr, startIndex)) > -1){
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

interface QueryType {
    where?:{
        $has?: string[] | undefined,
        [key: string]: any
    },
    update?: {
        $delete?: boolean | undefined,
        $deleteKeys?: string[] | undefined,
        $upsert?: boolean | undefined,
        [key: string]: any
    }
}

const Query = (Query : QueryType, data : string) => {
let query = {
    where:{
        $has:[],
        ...Query.where     
    },
    update:{
        $delete:false,
        $deleteKeys:[],
        $upsert:false,
        ...Query.update
    },
    
}

    /**
     * query consist of: identifier, (optionally) new data
     */

    const currenttext = data
    const lb = getIndicesOf("\n", currenttext)



    

    let searchParams = 
    [
        ...(query.where.$has ? query.where.$has.map(has => `"${has}":"`): []),
        ...Object.keys(query.where).filter(key => !key.includes("$")).map(key => `"${key}":${JSON.stringify(query.where[key])}`)
    ]

    let hits : any[] = []
    let updated : any[] = []
    let updatedWhole : string = data
    searchParams.forEach(param => {
        const occs = getIndicesOf(param, currenttext)


        let lines = occs.map(occ => {
            const larger = lb.filter(val => val > occ).sort((a, b) => a - b)[0]
            const smaller = lb.filter(val => val < occ).sort((a, b) => b - a)[0] || 0


            let curr = currenttext.substring(smaller, larger)


            let err = searchParams.map(p => {
                return curr.includes(p)
            })

            if(err.includes(false)) {return "error"}


            data = data.replace(curr, "")

            return JSON.parse(curr)

        })


        if(lines.includes("error")){
            return 
        }
        
        
        let newlines = (query.update.$delete) ? [] : lines.map(obj => {
            const newobj = {};

            Object.keys(query.update).filter(key => !key.includes("$")).forEach(key => {
                newobj[key] = query.update[key]
            })
            return {...obj, ...newobj}
        

                

        }).map(line => {

            const newobj = {}
            Object.keys(line).forEach(key => {
                if(!query.update.$deleteKeys.includes(key)){
                    newobj[key] = line[key]
                }
            })

            return newobj
        })

        
        const $where = {}
        const $update = {}

        Object.keys(query.where).filter(key => !key.includes("$")).forEach(key => {
            $where[key] = query.where[key] 

        })

        Object.keys(query.update).filter(key => !key.includes("$")).forEach(key => {
            
            $update[key] = query.update[key]
        })

        const n = {...$update, ...$where}
        console.log(newlines)     
        
        hits = lines || []
        updated = (newlines.length > 0) ? newlines : (query.update.$upsert ? [n] : [])
    })
    
    

    updatedWhole = data + ((updated.length > 0) ? "\n" : "") + updated.map(res => JSON.stringify(res)).join("\n")

    return {
        found:hits,
        updated:Query.update? updated : [], 
        wholedata: updatedWhole.slice(updatedWhole.indexOf("{"), updatedWhole.length)
    }
}




class JhokeClient{
    defaultUrl : string
    value : Promise<any>
    uid:string;
    optional:any;
    constructor(uid:string, value?:any, optional?:any){
        this.defaultUrl = (process.argv.includes("dev")) ? "http://localhost:3000" : "https://bucketstore.onrender.com"

        this.value = value;
        this.uid = uid;
        this.optional = optional;
    }

    save(obj: object){
        const val = (async () => {
            let currentsave : object;

            
            const {data : uidURL , success} = (await axios.post(this.defaultUrl + "/get", {key:this.uid})).data

            if(!success){
                currentsave = {}
            } else {
                const res = await axios.get(uidURL);

                currentsave = (JSON.parse(res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim()))
            }
            const params = new URLSearchParams();


                params.append("saveText", "Save Text!")
                params.append("lines", JSON.stringify({...currentsave, ...obj}))


                const newsaveurl = await axios.post("https://textsaver.flap.tv/index.php", params)
                                    .then(res => res.data.split(`id="listLink">`)[1].split("<")[0])
                


                await axios.post(this.defaultUrl + "/save", {key:this.uid, value:newsaveurl})


                return newsaveurl

                
        })

        return new JhokeClient(this.uid, val(), this.optional)

    }

    saveObjToURL(obj : object){
         const params = new URLSearchParams();

        params.append("lines", JSON.stringify(obj)),
        params.append("saveText", "Save Text!")
        
        return new JhokeClient(
            this.uid, 
            (async () => {
                const url = await axios.post("https://textsaver.flap.tv/index.php", params).then(res => res.data.split(`id="listLink">`)[1].split("<")[0])
            
                return url
            })(),
            
            this.optional
        )

    }
    

    get(key : string){
        return new JhokeClient(this.uid,


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


    getValueFromURL(key:string, url:string){
        return new JhokeClient(
            this.uid, 
            (async () => {

                const retrieveURL = url || await this.value

                
                if(typeof retrieveURL !== "string"){return}
                const res =  await axios.get(retrieveURL).then(res => res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim()) 

            
                const response = key ? ((JSON.parse(res))[key]) : res;

                return response
            })(), 
            this.optional
    
        )
    }



    pipe(func:Function){
        return new JhokeClient(
            this.uid, 
            this.value.then(res => func(res)),
            this.optional
        )

    }
    



    query(q : QueryType, perurl? :string){
     let val = (async () => {

                    let data : unknown = ""


                    
                    if(!perurl){

                    
                            let {data} = await axios.post(this.defaultUrl + "/get", { 
                                key:this.uid
                            })


                            if(!data.data){
                                data = ""
                            } else {

                                data = await axios.get(data.data).then(res => res.data.split(`<div id="viewPost">`)[1].split(`</div>`)[0].trim().replace("<br />", ""))
                            }
                            data = Query(q, data)
                            

                        

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
                        data = Query(q, res)
                    }


                return data
                })


                return new JhokeClient(this.uid, val(), this.optional)

    }
}



export {JhokeClient, Query, QueryType}
