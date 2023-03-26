
function getIndicesOf(searchStr, str) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}











const Query = (Query, data) => {
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

    let hits = []
    let updated = []
    let updatedWhole = data
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
    
    

    updatedWhole = data + ((updated.length > 0) ? "\n" : "") + updated.map(JSON.stringify).join("\n")

    return {
        found:hits,
        updated:Query.update? updated : [], 
        wholedata: updatedWhole.slice(updatedWhole.indexOf("{"), updatedWhole.length)
    }
}



module.exports = {
    Query
}

