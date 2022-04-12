const express = require('express')
const router = express.Router();

// #1 import in the Product model
const {
    Product
} = require('../models')
// import in the Forms
const {
    bootstrapField,
    createProductForm
} = require('../forms')


// create function to get product by id from mysql since this will be used repeatedly especially
// when doing CRUD
async function getProductById(productId) {
    // eqv of
    // select * from products where id = ${productId}
    const product = await Product.where({
        'id': productId
    }).fetch({
        'require': true // will cause an error if not found
    })
    return product;
}

// -- TO READ FROM MYSQL --
router.get('/', async (req, res) => {
    // #2 - fetch all the products (ie, SELECT * from products)
    // The NAME of the MODEL always refer
    // to the entire table
    let products = await Product.collection().fetch();
    res.render('products/index', {
        'products': products.toJSON()
        // #3 - convert collection to JSON
    })
})

// -- TO CREATE AKA ADD NEW --
router.get('/create', async (req, res) => {

    const productForm = createProductForm();
    res.render('products/create', {
        'form': productForm.toHTML(bootstrapField)
    })
})

// -- TO CREATE AKA ADD NEW --
router.post('/create', async (req, res) => {
    const form = createProductForm();
    form.handle(req, {
        'success': async (form) => {

            // create an instance of the Product model
            // if we refering to the MODEL directly, we are accessing the entire table
            // if we referring to the instance of the model, then we are accessing one row
            // eqv:
            /*
             insert into products (name, cost, description)
              values (?, ?, ?)
            */

            const product = new Product();
            product.set('name', form.data.name);
            product.set('cost', form.data.cost);
            product.set('description', form.data.description);
            await product.save();
            res.redirect('/products');
        },
        'error': async (form) => {
            res.render('products/create', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})


// -- TO EDIT -- 
// -- GET route to display edit
router.get('/:id/update', async (req, res) => {
    const product = await getProductById(req.params.id);

    // create product form 
    const form = createProductForm();

    // fill in the values of the already existing input in the form 

    form.fields.name.value = product.get('name');
    form.fields.cost.value = product.get('cost');
    form.fields.description.value = product.get('description');

    res.render('products/update', {
        'form': form.toHTML(bootstrapField),
        'product': product.toJSON()
    })
})

// -- TO EDIT --
// -- POST route to save edited info -- 
router.post('/:id/update', async (req, res) => {
    // 1. fetch the product we wanna update 
    const product = await getProductById(req.params.id);

    // 2. handle the form
    const form = createProductForm();
    form.handle(req, {
        'success' : async (form) => {
            product.set(form.data); 
            product.save();
            res.redirect('/products'); 
        },
        'error' : async (form) => {
            res.render('products/update', {
                'form' : form.toHTML(bootstrapField)
            })
        }
    })
})


// -- TO DELETE -- 
// first get product ID
router.get('/:id/delete', async(req, res) => {
    const product = await getProductById(req.params.id);

    res.render('products/delete', {
        'product' : product.toJSON()
    })
})

// -- TO DELETE -- 
// then process delete post route
router.post(':id/delete', async (req,res) => {
    const product = await getProductById(req.params.id);
    await product.destroy();
    res.redirect('/products');
})



module.exports = router;