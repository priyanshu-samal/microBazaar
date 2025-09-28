const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph")
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { ToolMessage, AIMessage, HumanMessage } = require("@langchain/core/messages")
const tools = require("./tools")


const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0.5,
})


const graph = new StateGraph(MessagesAnnotation)
    .addNode("tools", async (state, config) => {
        const { socket, token } = config.configurable;
        const lastMessage = state.messages[state.messages.length - 1]

        const toolsCall = lastMessage.tool_calls
        if (toolsCall[0].name === 'searchProduct') {
            socket.emit('status', 'Searching for product...');
        } else if (toolsCall[0].name === 'addProductToCart') {
            socket.emit('status', 'Adding product to cart...');
        }

        const toolCallResults = await Promise.all(toolsCall.map(async (call) => {

            const tool = tools[call.name]
            if (!tool) {
                throw new Error(`Tool ${call.name} not found`)
            }
            const toolInput = call.args

            const toolResult = await tool.func({ ...toolInput, token })

            return new ToolMessage({ content: toolResult, name: call.name, tool_call_id: call.id })

        }))

        state.messages.push(...toolCallResults)

        return state
    })
    .addNode("chat", async (state, config) => {
        const response = await model.invoke(state.messages, { tools: [tools.searchProduct, tools.addProductToCart] })


        state.messages.push(new AIMessage({ content: response.text, tool_calls: response.tool_calls }))

        return state

    })
    .addNode("handleSearch", async (state, config) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.name === "searchProduct") {
            const products = JSON.parse(lastMessage.content);
            if (products && products.length > 0) {
                const product = products[0];
                const toolCall = {
                    name: "addProductToCart",
                    args: { productId: product._id, quantity: 1 },
                    id: `call_${Math.random().toString(36).substr(2, 9)}`
                };
                state.messages.push(new AIMessage({ content: "", tool_calls: [toolCall] }));
            } else {
                state.messages.push(new AIMessage({ content: "Product not found." }));
            }
        }
        return state;
    })
    .addEdge("__start__", "chat")
    .addConditionalEdges("chat", (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools";
        } else {
            return "__end__";
        }
    })
    .addConditionalEdges("tools", (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.name === "searchProduct") {
            return "handleSearch";
        } else { // This will be for addProductToCart
            return "chat";
        }
    })
    .addConditionalEdges("handleSearch", (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools";
        } else {
            return "__end__";
        }
    });



const agent = graph.compile()


module.exports = agent