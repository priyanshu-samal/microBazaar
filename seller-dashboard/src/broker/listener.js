const { subscribeToQueue } = require("./broker")
const userModel = require("../models/user.model")
const productModel = require("../models/product.model")
const orderModel = require("../models/order.model")
const paymentModel = require("../models/payment.model")

module.exports = async function () {
    subscribeToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", async (user) => {
        await userModel.updateOne({ _id: user._id }, user, { upsert: true })
    })

    subscribeToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED", async (product) => {
        await productModel.updateOne({ _id: product._id }, product, { upsert: true })
    })

    subscribeToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED", async (order) => {
        await orderModel.updateOne({ _id: order._id }, order, { upsert: true })
    })

    subscribeToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED", async (payment) => {
        await paymentModel.updateOne({ _id: payment._id }, payment, { upsert: true })
    })

    subscribeToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE", async (payment) => {
        await paymentModel.findOneAndUpdate({ orderId: payment.orderId }, { ...payment })
    })
} 