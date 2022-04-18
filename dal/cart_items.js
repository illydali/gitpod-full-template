const {
    CartItem
} = require('../models');


//  retrieve all the items in the user shopping cart

async function getCart(userId) {
    return await CartItem.collection()
        .where({
            'user_id': userId
        }).fetch({
            require: false, // will not throw an exception if no results are found
            withRelated: ['product', 'product.category']
        })
}

/* check whether the user has added an item to the cart */
async function getCartItemByUserAndProduct(userId, productId) {
    return await CartItem.where({
        'user_id': userId,
        'product_id': productId
    }).fetch({
        'require': false
    })
}

/* add a cart item */
async function createCartItem(userId, productId, quantity) {
    // an instance of a model represents one row in the table
    // so to create a new row, simply create a new instance
    // of the model
    let cartItem = new CartItem({
        'user_id': userId,
        'product_Id': productId,
        'quantity': quantity
    });

    await cartItem.save(); // save the new row to the database
    return cartItem;
}

async function updateCartItemQuantity(userId, productId, quantity) {
    let cartItem = await getCartItemByUserAndProduct(userId, productId);
    cartItem.set('quantity', quantity);
    await cartItem.save();
    return cartItem;
}

async function removeFromCart(userId, productId) {
    let cartItem = await getCartItemByUserAndProduct(userId, productId);
    await cartItem.destroy();
}

module.exports = {
    getCart,
    createCartItem,
    getCartItemByUserAndProduct,
    updateCartItemQuantity,
    removeFromCart
}