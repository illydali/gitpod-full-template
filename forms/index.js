const forms = require('forms')

// create some shortcuts
const fields = forms.fields;
const validators = forms.validators;
const widgets = forms.widgets;

var bootstrapField = function (name, object) {
    if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }

    if (object.widget.classes.indexOf('form-control') === -1) {
        object.widget.classes.push('form-control');
    }

    var validationclass = object.value && !object.error ? 'is-valid' : '';
    validationclass = object.error ? 'is-invalid' : validationclass;
    if (validationclass) {
        object.widget.classes.push(validationclass);
    }

    var label = object.labelHTML(name);
    var error = object.error ? '<div class="invalid-feedback">' + object.error + '</div>' : '';

    var widget = object.widget.toHTML(name, object);
    return '<div class="form-group">' + label + widget + error + '</div>';
};

const createProductForm = (categories, tags) => {
    // first arg of forms.create takes in the config value
    // the key is the NAME of the <input type=...>
    // the value defines the properties of input
    return forms.create({
        // <input type="text" name="name"/>
        'name': fields.string({
            'required': true,
            'errorAfterField':true,
        }),
        // <input type="text" name="cost"/>
        'cost': fields.string({
            'required': true,
            'errorAfterField': true,
            'validators':[validators.integer(), validators.min(0)]
        }),
        // <input type="text" name="description"/>
        'description': fields.string({
            'required': true,
            'errorAfterField': true
        }),
        'category_id' : fields.string({
            'label': 'Category',
            'required': true,
            'errorAfterField': true,
            'widget': widgets.select(), // use the dropdowns elect
            'choices': categories
        }),
        'tags' : fields.string({
            'required' : true,
            'errorAfterField' : true,
            'widget': widgets.multipleSelect(),
            'choices': tags // [ [1, 'Snack'], [2, 'Healthy'] ]
        }),
        'image_url' : fields.string({
            'widget': widgets.hidden()
        })
    })
}

const createRegistrationForm = () => {
    return forms.create({
        'username' : fields.string({
            'required': true,
            'errorAfterField': true,
        }),
        'email' : fields.string({
            'required': true,
            'errorAfterField' : true
        }),
        'password': fields.password({
            'required' : true,
            'errorAfterField' : true,
        }),
        'confirm_password' : fields.password({
            'required' : true,
            'errorAfterField': true,
            'validators' : [ validators.matchField('password')]
        })
    })
}

const createLoginForm = () => { return forms.create({
    'email': fields.string({
        'required': true,
        'errorAfterField': true,
    }),
    'password': fields.password({
        'required': true,
        'errorAfterField': true
    })
})}


module.exports = { bootstrapField, createProductForm, createRegistrationForm, createLoginForm}