// require in bookshelf
const bookshelf = require('../bookshelf')

// we can use bookshelf to create models
// bookshelf.model => func, used to create a bookshelf model
// first arg: name of the model (first alphabet uppercase)
// second arg: config object, numerous options
//  - tableName: the name of the table in the database
// - the name of the model should be the singular, upper case
// version of the table name
// - the table name should always be in all lower case
// plural form
const Product = bookshelf.model('Product', {
    tableName:'products',
    // for belongs to:
    // function name is that of the model, singular form, in lower case
    category: function() {
        return this.belongsTo('Category')
    },
    // for M:N
    // the name of the function
    // is that of the Model that it is related to, in lower case and plural
    tags: function() {
        return this.belongsToMany('Tag')
    }
});

// name of the table = all lower case, plural
// name of model = first alphabet upper case, singular

const Category = bookshelf.model('Category',{
    tableName: 'categories',
})

// name of the table = all lower case, plural
// name of model = first alphabet upper case, singular
const Brand = bookshelf.model('Brand',{
    tableName: 'brands'
})

const Tag = bookshelf.model('Tag', {
    'tableName':'tags',
    products:function(){
        return this.belongsToMany('Product')
    }
})

module.exports = { Product, Category, Brand, Tag };