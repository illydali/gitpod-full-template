const express = require('express')
const router = express.Router();

// #1 import in the Product model
const {
    Product,
    Category,
    Brand,
    Tag,
} = require('../models')
// import in the Forms
const {
    bootstrapField,
    createProductForm,
    createSearchForm
} = require('../forms');


// import in the CheckIfAuthenticated middleware
const {
    checkIfAuthenticated
} = require('../middlewares');

// create function to get product by id from mysql since this will be used repeatedly especially
// when doing CRUD
async function getProductById(productId) {
    // eqv of
    // select * from products where id = ${productId}
    const product = await Product.where({
        'id': productId
    }).fetch({
        'require': true, // will cause an error if not found
        'withRelated': ['category', 'tags'] // load in the associated category and tags
    })
    return product;
}

async function getAllCategories() {
    const allCategories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    })
    return allCategories;
}

async function getAllTags() {
    const allTags = await Tag.fetchAll().map(tag => {
        return [tag.get('id'), tag.get('name')]
    })
    return allTags;
}

// -- TO READ FROM MYSQL --
router.get('/', async (req, res) => {
    // -- OLD CODE
    // // #2 - fetch all the products (ie, SELECT * from products)
    // // The NAME of the MODEL always refer
    // // to the entire table
    // let products = await Product.collection().fetch({
    //     withRelated: ['category', 'tags']
    // });
    // -- END OLD CODE

    // -- search form 

    const allCategories = await getAllCategories();
    // this code adds an ALL option in our select dropdown
    allCategories.unshift(["", "All"])
    const allTags = await getAllTags();

    const searchForm = createSearchForm(allCategories, allTags)

    // 1. Begin with an always true query
    // ... creating a query object ( a quey object represents one SQL statement )
    // this is just a query and has not been executed yet
    let q = Product.collection(); // <-- eqv to 'SELECT * FROM products WHERE 1'
    searchForm.handle(req, {
        'success': async function (form) {


            // 2. check if user has provided any search parameters 
            // 2b. for each search parameters that we have, add it to the always-true-query
            if (form.data.name) {
                q.where('name', 'like', '%' + form.data.name + '%')
            }
            if (form.data.min_cost) {
                q.where('cost', '>=', form.data.min_cost);
            }

            if (form.data.max_cost) {
                q.where('cost', '<=', form.data.max_cost);
            }

            if (form.data.category_id) {
                q.where('category_id', '=', form.data.category_id)
            }

            if (form.data.tags) {
                // joining in bookshelf: 
                q.query('join', 'products_tags', 'products.id', 'product_id')
                    .where('tag_id', 'in', form.data.tags.split(','))
                // eqv in mysql
                // SELECT * FROM products JOIN products_tags ON products.id = product_id
                // WHERE tag_id in (1,4)

            }


            // 3. execute the query and fetch the results 
            let products = await q.fetch({
                withRelated: ['category', 'tags']
            }); // execute the query

            res.render('products/index', {
                'products': products.toJSON(),
                'searchForm': form.toHTML(bootstrapField)
            })
        },
        'error': async function (form) {

            let products = await q.fetch({
                withRelated: ['category', 'tags']
            })

            res.render('products/index', {
                'searchForm': form.toHTML(bootstrapField),
                'products': products.toJSON()
            })
        },
        'empty': async function (form) {
            let products = await q.fetch({
                withRelated: ['category', 'tags']

            })

            res.render('products/index', {
                'searchForm': form.toHTML(bootstrapField),
                'products': products.toJSON()
            })
        }
    })

    // -- OLD CODE 
    // res.render('products/index', {
    //     'products': products.toJSON(),
    //     'searchForm': form.toHTML(bootstrapField)
    //     // #3 - convert collection to JSON
    // })
    // -- OLD CODE
})

// -- TO CREATE AKA ADD NEW --
router.get('/create', checkIfAuthenticated, async (req, res) => {

    const allCategories = await getAllCategories();
    const allTags = await getAllTags();
    const productForm = createProductForm(allCategories, allTags);
    res.render('products/create', {
        'form': productForm.toHTML(bootstrapField),
        'cloudinaryName': process.env.CLOUDINARY_NAME,
        'cloudinaryApiKey': process.env.CLOUDINARY_API_KEY,
        'cloudinaryPreset': process.env.CLOUDINARY_UPLOAD_PRESET
    })
})

// -- TO CREATE AKA ADD NEW --
router.post('/create', checkIfAuthenticated, async (req, res) => {
    const allCategories = await getAllCategories();
    const allTags = await getAllTags();
    const form = createProductForm(allCategories, allTags);
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
            product.set('category_id', form.data.category_id);
            product.set('image_url', form.data.image_url);
            await product.save();

            // we can create the M:N relationship after the product is created
            let tags = form.data.tags;
            if (tags) {
                // the reason we split the tags by comma
                // is because attach function takes in an array of ids

                // add new tags to the M:n tags relationship
                await product.tags().attach(tags.split(','));
            }
            req.flash('success_messages', `New Product ${product.get('name')} has been created`)
            res.redirect('/products');
        },
        'error': async (form) => {
            res.render('products/create', {
                'form': form.toHTML(bootstrapField),
                'cloudinaryName': process.env.CLOUDINARY_NAME,
                'cloudinaryApiKey': process.env.CLOUDINARY_API_KEY,
                'cloudinaryPreset': process.env.CLOUDINARY_UPLOAD_PRESET
            })
        }
    })
})


// -- TO EDIT -- 
// -- GET route to display edit
router.get('/:id/update', async (req, res) => {
    const product = await getProductById(req.params.id);

    const allCategories = await getAllCategories();
    const allTags = await getAllTags();

    // create the product form
    const form = createProductForm(allCategories, allTags);

    // fill in the values of the already existing input in the form 

    form.fields.name.value = product.get('name');
    form.fields.cost.value = product.get('cost');
    form.fields.description.value = product.get('description');
    form.fields.category_id.value = product.get('category_id');

    // 1 - set the image url in the product form
    form.fields.image_url.value = product.get('image_url');


    // get all the existing tags
    // we use the .related function to access the relationship
    // .fetch will fetch all the tags related to the product
    // let selectedTags = (await product.related('tags').fetch()).toJSON();
    // let selectedTagIDs = selectedTags.map( tag => tag.id);

    let selectedTags = await product.related('tags').pluck('id');
    form.fields.tags.value = selectedTags;
    console.log(selectedTags)
    res.render('products/update', {
        'form': form.toHTML(bootstrapField),
        'product': product.toJSON(),
        // 2 - send to the HBS file the cloudinary information
        'cloudinaryName': process.env.CLOUDINARY_NAME,
        'cloudinaryApiKey': process.env.CLOUDINARY_API_KEY,
        'cloudinaryPreset': process.env.CLOUDINARY_UPLOAD_PRESET

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
        'success': async (form) => {

            // extract out form.data.tags into the tags variable
            // all the other keys/vaues from form.data will go 
            // into productData variable as an object
            let {
                tags,
                ...productData
            } = form.data;

            product.set(productData);
            product.save();

            // handle tags 

            let selectedTagIds = tags.split(',');
            console.log(selectedTagIds)
            // get all the existing tags
            let existingTags = await product.related('tags').pluck('id');
            console.log(existingTags)
            // remove all the tags that are not selected anymore
            let toRemove = existingTags.filter(id => selectedTagIds.includes(id) === false);

            await product.tags().detach(toRemove); // -- detach takes in an array of ids
            // -- those ids will be removed from the relationship

            // add in all the new tags
            await product.tags().attach(selectedTagIds);

            res.redirect('/products');
        },
        'error': async (form) => {
            res.render('products/update', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})


// -- TO DELETE -- 
// first get product ID
router.get('/:id/delete', async (req, res) => {
    const product = await getProductById(req.params.id);

    res.render('products/delete', {
        'product': product.toJSON()
    })
})

// -- TO DELETE -- 
// then process delete post route
router.post(':id/delete', async (req, res) => {
    const product = await getProductById(req.params.id);
    await product.destroy();
    res.redirect('/products');
})


router.get('/brands', async (req, res) => {
    let brands = await Brand.collection().fetch();
    res.render('products/brands', {
        'brands': brands.toJSON()
    })
})

module.exports = router;