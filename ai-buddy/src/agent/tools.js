const {tool} =require("@langchain/core/tools")
const {z}=require("zod")
const axios=require("axios")

const searchProduct=tool(async({input, token})=>{

const response=await axios.get(`http://localhost:3001/api/products?q=${input}`,{
    headers:{
        Authorization:`Bearer ${token}`
    }
})

return JSON.stringify(response.data)


},{

    name:"searchProduct",
    description:"Use this tool to search for products. The result will be a JSON array of products, each with an 'id' field. You need this 'id' to add a product to the cart.",
    inputSchema:z.object({
        input: z.string().describe("The search query for products")
    })
})



const addProductToCart=tool(async({productId, qty=1,token})=>{

    const response=await axios.post(`http://localhost:3002/api/cart/items`,{
        productId,
        qty
    },{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return `Added product id ${productId} to cart with quantity ${qty} to cart`
},{

    name:"addProductToCart",
    description:"Use this tool to add a product to the cart. You must provide the 'productId' of the product you want to add. You can get the 'productId' by first using the 'searchProduct' tool.",  
    inputSchema:z.object({
        productId:z.string().describe("The id of the product to add to the cart"),
        qty:z.number().describe("The quantity of the product to add to the cart").default(1),

    
    })


})




module.exports={searchProduct,addProductToCart}